// Service: help sessions (created when an offer is accepted – see offerService.accept).
//
// Session lifecycle:   scheduled ──start──> in_progress ──complete──> completed
//                          └──────cancel──────────┴──> cancelled
// While scheduled, either participant can propose new details (mode/time/place);
// the other participant accepts or declines. A session can only start once
// a time (and, in person, a place) is agreed and no proposal is waiting.
const { pool, withTransaction } = require('../config/db');

const fail = (message) => ({ ok: false, message });

const SESSION_COLUMNS = `
  s.id, s.help_request_id, s.requester_user_id, s.helper_user_id, s.mode,
  s.scheduled_at, s.location_label, s.status, s.created_at,
  s.proposed_by_user_id, s.proposed_mode, s.proposed_scheduled_at,
  s.proposed_location_label, s.proposed_at,
  r.title AS request_title, r.status AS request_status,
  requester.full_name AS requester_name,
  helper.full_name AS helper_name`;

const SESSION_JOINS = `
  JOIN help_requests r ON r.id = s.help_request_id
  JOIN users requester ON requester.id = s.requester_user_id
  JOIN users helper ON helper.id = s.helper_user_id`;

const CLEAR_PROPOSAL = `
  proposed_by_user_id = NULL, proposed_mode = NULL, proposed_scheduled_at = NULL,
  proposed_location_label = NULL, proposed_at = NULL`;

// ----- Reading -----

// Sessions where the user is the requester or the helper. Active ones first.
async function listForUser(userId) {
  const [rows] = await pool.execute(
    `SELECT ${SESSION_COLUMNS}
       FROM help_sessions s ${SESSION_JOINS}
      WHERE s.requester_user_id = ? OR s.helper_user_id = ?
      ORDER BY s.status IN ('scheduled', 'in_progress') DESC, s.created_at DESC`,
    [userId, userId]
  );
  return rows;
}

// One session, including both participants' emails.
// Only show this to the two participants (checked in the controller).
async function getById(id) {
  const [rows] = await pool.execute(
    `SELECT ${SESSION_COLUMNS}, r.description AS request_description,
            requester.email AS requester_email, helper.email AS helper_email
       FROM help_sessions s ${SESSION_JOINS}
      WHERE s.id = ?`,
    [id]
  );
  return rows[0] || null;
}

// The newest session for a request (used to link to it from the request page).
async function getLatestForRequest(requestId) {
  const [rows] = await pool.execute(
    `SELECT id, requester_user_id, helper_user_id, status
       FROM help_sessions
      WHERE help_request_id = ?
      ORDER BY created_at DESC, id DESC
      LIMIT 1`,
    [requestId]
  );
  return rows[0] || null;
}

// What still has to happen before a scheduled session can start (empty list = ready).
function startBlockers(session) {
  const blockers = [];
  if (session.proposed_by_user_id) blockers.push('Respond to the pending proposal.');
  if (!session.scheduled_at) blockers.push('Agree on a time.');
  if (session.mode === 'in_person' && !session.location_label) blockers.push('Agree on a meeting place.');
  return blockers;
}

// ----- Changing -----

// Locks the session row, checks that the user takes part in it, runs `check`
// (returns an error message or null), then `apply` (the UPDATEs). All in one transaction.
async function changeSession(sessionId, userId, check, apply) {
  return withTransaction(async (connection) => {
    const [[session]] = await connection.execute(
      'SELECT * FROM help_sessions WHERE id = ? FOR UPDATE',
      [sessionId]
    );
    if (!session || ![session.requester_user_id, session.helper_user_id].includes(userId)) {
      return fail('Only the two people in this help session can change it.');
    }

    const problem = check(session);
    if (problem) return fail(problem);

    await apply(connection, session);
    return { ok: true };
  });
}

function start(sessionId, userId) {
  return changeSession(
    sessionId,
    userId,
    (session) => {
      if (session.status !== 'scheduled') return 'Only scheduled sessions can be started.';
      const blockers = startBlockers(session);
      return blockers.length ? `Before starting: ${blockers.join(' ')}` : null;
    },
    (connection, session) =>
      connection.execute(`UPDATE help_sessions SET status = 'in_progress' WHERE id = ?`, [session.id])
  );
}

// Completing the session also completes the help request.
function complete(sessionId, userId) {
  return changeSession(
    sessionId,
    userId,
    (session) => (session.status !== 'in_progress' ? 'Only sessions in progress can be completed.' : null),
    async (connection, session) => {
      await connection.execute(`UPDATE help_sessions SET status = 'completed' WHERE id = ?`, [session.id]);
      await connection.execute(
        `UPDATE help_requests SET status = 'completed' WHERE id = ? AND status = 'matched'`,
        [session.help_request_id]
      );
    }
  );
}

// The request stays "matched" – its owner then chooses to reopen or cancel it
// (helpRequestService.reopen / cancel).
function cancel(sessionId, userId) {
  return changeSession(
    sessionId,
    userId,
    (session) =>
      ['scheduled', 'in_progress'].includes(session.status) ? null : 'This session has already ended.',
    (connection, session) =>
      connection.execute(
        `UPDATE help_sessions SET status = 'cancelled', ${CLEAR_PROPOSAL} WHERE id = ?`,
        [session.id]
      )
  );
}

// `details` = { mode, scheduledAt, locationLabel } already validated and in database format.
function propose(sessionId, userId, details) {
  return changeSession(
    sessionId,
    userId,
    (session) => {
      if (session.status !== 'scheduled') return 'Details can only be changed before the session starts.';
      if (session.proposed_by_user_id) return 'There’s already a proposal waiting for a response.';
      return null;
    },
    (connection, session) =>
      connection.execute(
        `UPDATE help_sessions
            SET proposed_by_user_id = ?, proposed_mode = ?, proposed_scheduled_at = ?,
                proposed_location_label = ?, proposed_at = NOW()
          WHERE id = ?`,
        [userId, details.mode, details.scheduledAt, details.locationLabel, session.id]
      )
  );
}

// Checks shared by accepting and declining: there must be a proposal from the OTHER person.
function checkCanRespond(userId) {
  return (session) => {
    if (session.status !== 'scheduled') return 'Details can only be changed before the session starts.';
    if (!session.proposed_by_user_id) return 'There’s no proposal to respond to.';
    if (session.proposed_by_user_id === userId) return 'You can’t respond to your own proposal.';
    return null;
  };
}

// The proposed details become the agreed details.
function acceptProposal(sessionId, userId) {
  return changeSession(sessionId, userId, checkCanRespond(userId), (connection, session) =>
    // MySQL applies SET assignments left to right, so the proposed values are copied before being cleared
    connection.execute(
      `UPDATE help_sessions
          SET mode = proposed_mode, scheduled_at = proposed_scheduled_at,
              location_label = proposed_location_label, ${CLEAR_PROPOSAL}
        WHERE id = ?`,
      [session.id]
    )
  );
}

function declineProposal(sessionId, userId) {
  return changeSession(sessionId, userId, checkCanRespond(userId), (connection, session) =>
    connection.execute(`UPDATE help_sessions SET ${CLEAR_PROPOSAL} WHERE id = ?`, [session.id])
  );
}

function withdrawProposal(sessionId, userId) {
  return changeSession(
    sessionId,
    userId,
    (session) => (session.proposed_by_user_id !== userId ? 'You have no proposal to withdraw.' : null),
    (connection, session) =>
      connection.execute(`UPDATE help_sessions SET ${CLEAR_PROPOSAL} WHERE id = ?`, [session.id])
  );
}

module.exports = {
  listForUser,
  getById,
  getLatestForRequest,
  startBlockers,
  start,
  complete,
  cancel,
  propose,
  acceptProposal,
  declineProposal,
  withdrawProposal,
};
