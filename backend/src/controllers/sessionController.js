// Help sessions: only the two participants (requester and helper) may see or change a session.
const sessionService = require('../services/sessionService');
const { validateProposal, toDbProposal } = require('../validators/sessionValidator');
const { httpError, assertValid, parseId } = require('../utils/httpError');
const { sendResult } = require('../utils/serviceResult');

// Loads the session and checks that the logged-in user takes part in it.
async function findSessionForParticipant(req) {
  const id = parseId(req.params.id);
  const session = id && (await sessionService.getById(id));
  if (!session) throw httpError(404, 'This help session does not exist.');

  const userId = req.session.user.id;
  if (session.requester_user_id !== userId && session.helper_user_id !== userId) {
    throw httpError(403, 'Only the two people in this help session can view it.');
  }
  return session;
}

// GET /api/sessions
async function list(req, res) {
  res.json({ data: await sessionService.listForUser(req.session.user.id) });
}

// GET /api/sessions/:id – the session plus what the viewer may do with it
async function detail(req, res) {
  const session = await findSessionForParticipant(req);
  const userId = req.session.user.id;
  const isRequester = session.requester_user_id === userId;
  const latest = await sessionService.getLatestForRequest(session.help_request_id);

  res.json({
    data: session,
    isRequester,
    // The other participant, from the viewer's point of view
    partner: isRequester
      ? { role: 'Helper', name: session.helper_name, email: session.helper_email }
      : { role: 'Requester', name: session.requester_name, email: session.requester_email },
    startBlockers: sessionService.startBlockers(session),
    proposedByMe: session.proposed_by_user_id === userId,
    // After a cancelled session the requester decides what happens to the request
    showRequestChoice:
      isRequester &&
      session.status === 'cancelled' &&
      session.request_status === 'matched' &&
      latest.id === session.id,
  });
}

// Builds a handler for a simple action (start, complete, ...): run the service function, answer its result.
function sessionAction(serviceFn, successMessage) {
  return async (req, res) => {
    const session = await findSessionForParticipant(req);
    const result = await serviceFn(session.id, req.session.user.id);
    sendResult(res, result, successMessage);
  };
}

// POST /api/sessions/:id/proposal – body: mode, scheduledAt, locationLabel
async function propose(req, res) {
  const session = await findSessionForParticipant(req);
  const { values, errors } = validateProposal(req.body, session);
  assertValid(errors);

  const result = await sessionService.propose(session.id, req.session.user.id, toDbProposal(values));
  sendResult(res, result, 'Your proposal has been sent. The other person needs to accept it.');
}

module.exports = {
  list,
  detail,
  propose,
  start: sessionAction(sessionService.start, 'The session has started. Good luck!'),
  complete: sessionAction(
    sessionService.complete,
    'Session completed. The help request has been marked Completed. Thank you!'
  ),
  cancel: sessionAction(sessionService.cancel, 'The session has been cancelled.'),
  acceptProposal: sessionAction(sessionService.acceptProposal, 'The new details are now agreed.'),
  declineProposal: sessionAction(sessionService.declineProposal, 'The proposal has been declined.'),
  withdrawProposal: sessionAction(sessionService.withdrawProposal, 'Your proposal has been withdrawn.'),
};
