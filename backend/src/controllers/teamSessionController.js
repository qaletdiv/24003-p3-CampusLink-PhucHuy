// Team study sessions / events. Every route here is members-only
// (requireAuth + loadTeam + requireTeamMember in routes/teamRoutes.js).
const teamSessionService = require('../services/teamSessionService');
const { validateTeamSession, toDbTeamSession } = require('../validators/teamValidator');
const { httpError, assertValid, parseId } = require('../utils/httpError');

const CANT_CHANGE = 'Cancelled or finished sessions can’t be changed.';

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
  if (session.status !== 'scheduled' || session.is_past) throw httpError(409, CANT_CHANGE);
}

// POST /api/teams/:id/sessions
async function create(req, res) {
  const { values, errors } = validateTeamSession(req.body);
  assertValid(errors);

  const id = await teamSessionService.create(req.team.id, req.session.user.id, toDbTeamSession(values));
  res.status(201).json({ data: { id }, message: 'Session created. Your team can see it now.' });
}

// GET /api/teams/:id/sessions/:sessionId
async function detail(req, res) {
  const session = await findSessionOr404(req);
  res.json({
    data: session,
    team: { id: req.team.id, name: req.team.name },
    canManage:
      session.created_by_user_id === req.session.user.id && session.status === 'scheduled' && !session.is_past,
  });
}

// PUT /api/teams/:id/sessions/:sessionId
async function update(req, res) {
  const session = await findSessionOr404(req);
  checkCanManage(req, session);

  const { values, errors } = validateTeamSession(req.body, session);
  assertValid(errors);

  const updated = await teamSessionService.update(
    req.team.id, session.id, req.session.user.id, toDbTeamSession(values)
  );
  if (!updated) throw httpError(409, 'This session can no longer be changed.');
  res.json({ message: 'Session updated.' });
}

// POST /api/teams/:id/sessions/:sessionId/cancel
async function cancel(req, res) {
  const session = await findSessionOr404(req);
  checkCanManage(req, session);

  const cancelled = await teamSessionService.cancel(req.team.id, session.id, req.session.user.id);
  if (!cancelled) throw httpError(409, 'This session can no longer be changed.');
  res.json({ message: 'Session cancelled.' });
}

module.exports = { create, detail, update, cancel };
