// Help sessions: only the two participants (requester and helper) may see or change a session.
const sessionService = require('../services/sessionService');
const { validateProposal, toDbProposal } = require('../validators/sessionValidator');
const { toDateTimeLocal } = require('../utils/format');
const { httpError, parseId } = require('../utils/httpError');

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

// Current agreed details -> values for the "Propose new details" form
function currentDetails(session) {
  return {
    mode: session.mode,
    scheduledAt: toDateTimeLocal(session.scheduled_at),
    locationLabel: session.location_label || '',
  };
}

async function renderDetail(req, res, session, { status = 200, proposalValues, proposalErrors = {} } = {}) {
  const userId = req.session.user.id;
  const isRequester = session.requester_user_id === userId;
  const latest = await sessionService.getLatestForRequest(session.help_request_id);

  res.status(status).render('sessions/detail', {
    pageTitle: 'Help session',
    session,
    isRequester,
    // The other participant, from the viewer's point of view
    partner: isRequester
      ? { role: 'Helper', name: session.helper_name, email: session.helper_email }
      : { role: 'Requester', name: session.requester_name, email: session.requester_email },
    startBlockers: sessionService.startBlockers(session),
    proposedByMe: session.proposed_by_user_id === userId,
    proposalValues: proposalValues || currentDetails(session),
    proposalErrors,
    // After a cancelled session the requester decides what happens to the request
    showRequestChoice:
      isRequester &&
      session.status === 'cancelled' &&
      session.request_status === 'matched' &&
      latest.id === session.id,
  });
}

// GET /sessions
async function list(req, res) {
  const sessions = await sessionService.listForUser(req.session.user.id);
  res.render('sessions/list', { pageTitle: 'My help sessions', sessions });
}

// GET /sessions/:id
async function showDetail(req, res) {
  const session = await findSessionForParticipant(req);
  await renderDetail(req, res, session);
}

// Builds a handler for a simple action (start, complete, ...):
// run the service function, show its result as a flash message, go back to the session.
function sessionAction(serviceFn, successMessage) {
  return async (req, res) => {
    const session = await findSessionForParticipant(req);
    const result = await serviceFn(session.id, req.session.user.id);

    req.flash(result.ok ? 'success' : 'error', result.ok ? successMessage : result.message);
    res.redirect(`/sessions/${session.id}`);
  };
}

// POST /sessions/:id/proposal
async function propose(req, res) {
  const session = await findSessionForParticipant(req);
  const { values, errors } = validateProposal(req.body, session);

  if (Object.keys(errors).length > 0) {
    return renderDetail(req, res, session, { status: 422, proposalValues: values, proposalErrors: errors });
  }

  const result = await sessionService.propose(session.id, req.session.user.id, toDbProposal(values));
  req.flash(
    result.ok ? 'success' : 'error',
    result.ok ? 'Your proposal has been sent. The other person needs to accept it.' : result.message
  );
  res.redirect(`/sessions/${session.id}`);
}

module.exports = {
  list,
  showDetail,
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
