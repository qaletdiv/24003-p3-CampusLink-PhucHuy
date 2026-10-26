// Teams: list/search, create/edit, join/leave, ownership transfer and Team Signals.
// Team-level permission checks happen in middleware/teamAccess.js (see routes/teamRoutes.js).
const teamService = require('../services/teamService');
const teamSessionService = require('../services/teamSessionService');
const teamSignalService = require('../services/teamSignalService');
const { validateTeam, validateSignal } = require('../validators/teamValidator');
const { keyword, pageNumber, listResponse } = require('../utils/listQuery');
const { httpError, assertValid, parseId } = require('../utils/httpError');
const { sendResult } = require('../utils/serviceResult');

// ----- List & create -----

// GET /api/teams?q=&page=
async function list(req, res) {
  const q = keyword(req.query.q);
  const result = await teamService.search({ q, page: pageNumber(req.query.page) });
  const user = req.session.user;
  const myTeamIds = user ? await teamService.getTeamIdsForUser(user.id) : new Set();

  res.json(listResponse(result.teams, result, { filters: { q, page: result.page }, myTeamIds: [...myTeamIds] }));
}

// POST /api/teams
async function create(req, res) {
  const { values, errors } = validateTeam(req.body);
  assertValid(errors);

  const teamId = await teamService.create(req.session.user.id, values);
  res.status(201).json({ data: { id: teamId }, message: 'Your team has been created. You’re the owner.' });
}

// ----- Team page -----

// GET /api/teams/:id – public info for everyone; members also get signals, sessions and the member list.
async function detail(req, res) {
  const team = req.team;
  const memberData = req.isTeamMember
    ? {
        members: await teamService.listMembers(team.id),
        sessions: await teamSessionService.listForTeam(team.id),
        signals: await teamSignalService.listActive(team.id),
      }
    : { members: [], sessions: { upcoming: [], others: [] }, signals: [] };

  res.json({ data: team, isMember: req.isTeamMember, isOwner: req.isTeamOwner, ...memberData });
}

// PUT /api/teams/:id (owner)
async function update(req, res) {
  const { values, errors } = validateTeam(req.body);
  assertValid(errors);

  const updated = await teamService.update(req.team.id, req.session.user.id, values);
  if (!updated) throw httpError(403, 'Only the team owner can edit it.');
  res.json({ message: 'Team details saved.' });
}

// ----- Membership -----

// POST /api/teams/:id/join
async function join(req, res) {
  const result = await teamService.join(req.team.id, req.session.user.id);
  sendResult(res, result, `Welcome to ${req.team.name}!`);
}

// POST /api/teams/:id/leave (member)
async function leave(req, res) {
  const result = await teamService.leave(req.team.id, req.session.user.id);
  sendResult(res, result, `You’ve left ${req.team.name}.`);
}

// POST /api/teams/:id/transfer (owner) – body: newOwnerId
async function transfer(req, res) {
  const newOwnerId = parseId(String(req.body.newOwnerId ?? ''));
  const result = newOwnerId
    ? await teamService.transferOwnership(req.team.id, req.session.user.id, newOwnerId)
    : { ok: false, message: 'Choose a member to make owner.' };
  sendResult(res, result, 'Ownership transferred. You’re now a regular member and can leave the team.');
}

// ----- Team Signals (members) -----

// POST /api/teams/:id/signals – body: message, locationLabel, durationMinutes
async function createSignal(req, res) {
  const { values, errors } = validateSignal(req.body);
  assertValid(errors);

  const id = await teamSignalService.create(req.team.id, req.session.user.id, {
    ...values,
    durationMinutes: Number(values.durationMinutes),
  });
  res.status(201).json({ data: { id }, message: 'Signal sent to your team.' });
}

// POST /api/teams/:id/signals/:signalId/cancel (sender)
async function cancelSignal(req, res) {
  const signalId = parseId(req.params.signalId);
  const cancelled = signalId && (await teamSignalService.cancel(req.team.id, signalId, req.session.user.id));
  if (!cancelled) throw httpError(409, 'You can only cancel your own active signals.');
  res.json({ message: 'Signal cancelled.' });
}

module.exports = { list, create, detail, update, join, leave, transfer, createSignal, cancelSignal };
