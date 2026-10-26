// Teams: list/search, create/edit, join/leave, ownership transfer and Team Signals.
// Team-level permission checks happen in middleware/teamAccess.js (see routes/teamRoutes.js).
const teamService = require('../services/teamService');
const teamSessionService = require('../services/teamSessionService');
const teamSignalService = require('../services/teamSignalService');
const { validateTeam, validateSignal } = require('../validators/teamValidator');
const { buildPageList } = require('../utils/pagination');
const { parseId } = require('../utils/httpError');

const DEFAULT_SIGNAL = { message: '', locationLabel: '', durationMinutes: '30' };

function teamListUrl(q, page) {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (page > 1) params.set('page', page);
  const queryString = params.toString();
  return queryString ? `/teams?${queryString}` : '/teams';
}

// Shows a service result as a flash message and goes back to the team page.
function finish(req, res, result, successMessage) {
  req.flash(result.ok ? 'success' : 'error', result.ok ? successMessage : result.message);
  res.redirect(`/teams/${req.team.id}`);
}

// ----- List & create -----

// GET /teams?q=&page=
async function list(req, res) {
  const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 100) : '';
  const requestedPage = Number.parseInt(req.query.page, 10);
  const result = await teamService.search({
    q,
    page: Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1,
  });
  const user = req.session.user;

  res.render('teams/list', {
    pageTitle: 'Study Teams',
    q,
    ...result,
    myTeamIds: user ? await teamService.getTeamIdsForUser(user.id) : new Set(),
    pageList: buildPageList(result.page, result.totalPages),
    pageUrl: (page) => teamListUrl(q, page),
  });
}

// GET /teams/new
function showNewForm(req, res) {
  res.render('teams/form', { pageTitle: 'Create a team', team: null, values: {}, errors: {} });
}

// POST /teams
async function create(req, res) {
  const { values, errors } = validateTeam(req.body);
  if (Object.keys(errors).length > 0) {
    return res.status(422).render('teams/form', { pageTitle: 'Create a team', team: null, values, errors });
  }

  const teamId = await teamService.create(req.session.user.id, values);
  req.flash('success', 'Your team has been created. You’re the owner.');
  res.redirect(`/teams/${teamId}`);
}

// ----- Team page -----

// Public info for everyone; members also get signals, sessions and the member list.
async function renderDetail(req, res, { status = 200, signalValues = DEFAULT_SIGNAL, signalErrors = {} } = {}) {
  const team = req.team;
  const memberData = req.isTeamMember
    ? {
        members: await teamService.listMembers(team.id),
        sessions: await teamSessionService.listForTeam(team.id),
        signals: await teamSignalService.listActive(team.id),
      }
    : { members: [], sessions: { upcoming: [], others: [] }, signals: [] };

  res.status(status).render('teams/detail', {
    pageTitle: team.name,
    team,
    isMember: req.isTeamMember,
    isOwner: req.isTeamOwner,
    ...memberData,
    signalDurations: teamSignalService.SIGNAL_DURATIONS,
    signalValues,
    signalErrors,
    loginUrl: `/login?returnTo=${encodeURIComponent(`/teams/${team.id}`)}`,
  });
}

// GET /teams/:id
function showDetail(req, res) {
  return renderDetail(req, res);
}

// GET /teams/:id/edit (owner)
function showEditForm(req, res) {
  res.render('teams/form', {
    pageTitle: 'Edit team',
    team: req.team,
    values: { name: req.team.name, description: req.team.description },
    errors: {},
  });
}

// POST /teams/:id/edit (owner)
async function update(req, res) {
  const { values, errors } = validateTeam(req.body);
  if (Object.keys(errors).length > 0) {
    return res.status(422).render('teams/form', { pageTitle: 'Edit team', team: req.team, values, errors });
  }

  const updated = await teamService.update(req.team.id, req.session.user.id, values);
  const result = updated ? { ok: true } : { ok: false, message: 'Only the team owner can edit it.' };
  finish(req, res, result, 'Team details saved.');
}

// ----- Membership -----

// POST /teams/:id/join
async function join(req, res) {
  const result = await teamService.join(req.team.id, req.session.user.id);
  finish(req, res, result, `Welcome to ${req.team.name}!`);
}

// POST /teams/:id/leave (member)
async function leave(req, res) {
  const result = await teamService.leave(req.team.id, req.session.user.id);
  finish(req, res, result, `You’ve left ${req.team.name}.`);
}

// POST /teams/:id/transfer (owner) – body: newOwnerId
async function transfer(req, res) {
  const newOwnerId = parseId(req.body.newOwnerId);
  const result = newOwnerId
    ? await teamService.transferOwnership(req.team.id, req.session.user.id, newOwnerId)
    : { ok: false, message: 'Choose a member to make owner.' };
  finish(req, res, result, 'Ownership transferred. You’re now a regular member and can leave the team.');
}

// ----- Team Signals (members) -----

// POST /teams/:id/signals
async function createSignal(req, res) {
  const { values, errors } = validateSignal(req.body);
  if (Object.keys(errors).length > 0) {
    return renderDetail(req, res, { status: 422, signalValues: values, signalErrors: errors });
  }

  await teamSignalService.create(req.team.id, req.session.user.id, {
    ...values,
    durationMinutes: Number(values.durationMinutes),
  });
  finish(req, res, { ok: true }, 'Signal sent to your team.');
}

// POST /teams/:id/signals/:signalId/cancel (sender)
async function cancelSignal(req, res) {
  const signalId = parseId(req.params.signalId);
  const cancelled = signalId && (await teamSignalService.cancel(req.team.id, signalId, req.session.user.id));
  finish(
    req,
    res,
    cancelled ? { ok: true } : { ok: false, message: 'You can only cancel your own active signals.' },
    'Signal cancelled.'
  );
}

module.exports = {
  list,
  showNewForm,
  create,
  showDetail,
  showEditForm,
  update,
  join,
  leave,
  transfer,
  createSignal,
  cancelSignal,
};
