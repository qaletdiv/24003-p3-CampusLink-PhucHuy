// Team study sessions / events. Every route here is members-only
// (requireAuth + loadTeam + requireTeamMember in routes/teamRoutes.js).
const teamSessionService = require('../services/teamSessionService');
const { validateTeamSession, toDbTeamSession } = require('../validators/teamValidator');
const { toDateTimeLocal } = require('../utils/format');
const { httpError, parseId } = require('../utils/httpError');

async function findSessionOr404(req) {
  const id = parseId(req.params.sessionId);
  const session = id && (await teamSessionService.getById(req.team.id, id));
  if (!session) throw httpError(404, 'This session does not exist in this team.');
  return session;
}

// Only the creator may change a session, and only while it is scheduled and not over.
function checkCanManage(req, session) {
  if (session.created_by_user_id !== req.session.user.id) {
    throw httpError(403, 'Only the person who created this session can change it.');
  }
  if (session.status !== 'scheduled' || session.is_past) {
    return 'Cancelled or finished sessions can’t be changed.';
  }
  return null;
}

function renderForm(req, res, status, options) {
  res.status(status).render('teams/sessionForm', {
    team: req.team,
    session: null,
    errors: {},
    minDateTime: toDateTimeLocal(new Date()),
    ...options,
  });
}

// GET /teams/:id/sessions/new
function showNewForm(req, res) {
  renderForm(req, res, 200, { pageTitle: 'New session or event', values: {} });
}

// POST /teams/:id/sessions
async function create(req, res) {
  const { values, errors } = validateTeamSession(req.body);
  if (Object.keys(errors).length > 0) {
    return renderForm(req, res, 422, { pageTitle: 'New session or event', values, errors });
  }

  const id = await teamSessionService.create(req.team.id, req.session.user.id, toDbTeamSession(values));
  req.flash('success', 'Session created. Your team can see it now.');
  res.redirect(`/teams/${req.team.id}/sessions/${id}`);
}

// GET /teams/:id/sessions/:sessionId
async function showDetail(req, res) {
  const session = await findSessionOr404(req);
  res.render('teams/sessionDetail', {
    pageTitle: session.title,
    team: req.team,
    session,
    canManage:
      session.created_by_user_id === req.session.user.id && session.status === 'scheduled' && !session.is_past,
  });
}

// GET /teams/:id/sessions/:sessionId/edit
async function showEditForm(req, res) {
  const session = await findSessionOr404(req);
  const problem = checkCanManage(req, session);
  if (problem) {
    req.flash('error', problem);
    return res.redirect(`/teams/${req.team.id}/sessions/${session.id}`);
  }

  renderForm(req, res, 200, {
    pageTitle: 'Edit session',
    session,
    values: {
      title: session.title,
      description: session.description || '',
      startsAt: toDateTimeLocal(session.starts_at),
      endsAt: toDateTimeLocal(session.ends_at),
      locationLabel: session.location_label || '',
    },
  });
}

// POST /teams/:id/sessions/:sessionId/edit
async function update(req, res) {
  const session = await findSessionOr404(req);
  const problem = checkCanManage(req, session);
  if (problem) {
    req.flash('error', problem);
    return res.redirect(`/teams/${req.team.id}/sessions/${session.id}`);
  }

  const { values, errors } = validateTeamSession(req.body, session);
  if (Object.keys(errors).length > 0) {
    return renderForm(req, res, 422, { pageTitle: 'Edit session', session, values, errors });
  }

  const updated = await teamSessionService.update(
    req.team.id, session.id, req.session.user.id, toDbTeamSession(values)
  );
  req.flash(updated ? 'success' : 'error', updated ? 'Session updated.' : 'This session can no longer be changed.');
  res.redirect(`/teams/${req.team.id}/sessions/${session.id}`);
}

// POST /teams/:id/sessions/:sessionId/cancel
async function cancel(req, res) {
  const session = await findSessionOr404(req);
  checkCanManage(req, session); // throws 403 for anyone but the creator

  const cancelled = await teamSessionService.cancel(req.team.id, session.id, req.session.user.id);
  req.flash(cancelled ? 'success' : 'error', cancelled ? 'Session cancelled.' : 'This session can no longer be changed.');
  res.redirect(`/teams/${req.team.id}/sessions/${session.id}`);
}

module.exports = { showNewForm, create, showDetail, showEditForm, update, cancel };
