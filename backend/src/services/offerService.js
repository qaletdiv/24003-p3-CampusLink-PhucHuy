// Service: offers to help ("Offer Help") and accepting them.
//
// Rule-breaking actions (offering on a closed request, accepting twice, ...) return
// { ok: false, message } so the controller can show the message to the user.
// Changes that touch several rows run in a transaction with SELECT ... FOR UPDATE:
// the selected rows stay locked until commit, so two clicks at the same moment
// can't both succeed (e.g. accepting two different offers for one request).
const { pool, withTransaction } = require('../config/db');

const fail = (message) => ({ ok: false, message });

// One offer with the request it belongs to (used for permission checks).
async function getOfferWithRequest(offerId) {
  const [rows] = await pool.execute(
    `SELECT o.id, o.help_request_id, o.helper_user_id, o.status,
            r.user_id AS owner_user_id, r.status AS request_status
       FROM help_offers o
       JOIN help_requests r ON r.id = o.help_request_id
      WHERE o.id = ?`,
    [offerId]
  );
  return rows[0] || null;
}

// All offers for a request, for the request owner. Pending ones first.
async function listForRequest(requestId) {
  const [rows] = await pool.execute(
    `SELECT o.id, o.message, o.preferred_mode, o.status, o.created_at,
            u.full_name AS helper_name, u.major AS helper_major
       FROM help_offers o
       JOIN users u ON u.id = o.helper_user_id
      WHERE o.help_request_id = ?
      ORDER BY o.status = 'pending' DESC, o.created_at ASC`,
    [requestId]
  );
  return rows;
}

// The most recent offer this helper sent for a request (or null).
async function getLatestByHelper(requestId, helperId) {
  const [rows] = await pool.execute(
    `SELECT id, message, preferred_mode, status, created_at
       FROM help_offers
      WHERE help_request_id = ? AND helper_user_id = ?
      ORDER BY created_at DESC, id DESC
      LIMIT 1`,
    [requestId, helperId]
  );
  return rows[0] || null;
}

// Offers the user has sent, newest first ("My offers").
async function listByHelper(helperId) {
  const [rows] = await pool.execute(
    `SELECT o.id, o.help_request_id, o.message, o.preferred_mode, o.status, o.created_at,
            r.title AS request_title, r.status AS request_status
       FROM help_offers o
       JOIN help_requests r ON r.id = o.help_request_id
      WHERE o.helper_user_id = ?
      ORDER BY o.created_at DESC, o.id DESC`,
    [helperId]
  );
  return rows;
}

// Checks whether this user may offer help on this request right now.
async function checkCanOffer(request, helperId) {
  if (request.user_id === helperId) return fail('You can’t offer help on your own request.');
  if (request.status !== 'open') return fail('This request is no longer accepting offers.');

  const latest = await getLatestByHelper(request.id, helperId);
  if (latest && latest.status === 'pending') return fail('You already have an active offer for this request.');
  if (latest && latest.status === 'accepted') return fail('You were already matched with this request once.');
  return { ok: true };
}

async function create(requestId, helperId, { message, preferredMode }) {
  try {
    return await withTransaction(async (connection) => {
      // Lock the request so it can't be matched/cancelled while we insert
      const [[request]] = await connection.execute(
        'SELECT id, user_id, status FROM help_requests WHERE id = ? FOR UPDATE',
        [requestId]
      );
      if (!request) return fail('This help request does not exist.');
      if (request.user_id === helperId) return fail('You can’t offer help on your own request.');
      if (request.status !== 'open') return fail('This request is no longer accepting offers.');

      const [result] = await connection.execute(
        `INSERT INTO help_offers (help_request_id, helper_user_id, message, preferred_mode)
         VALUES (?, ?, ?, ?)`,
        [requestId, helperId, message, preferredMode]
      );
      return { ok: true, offerId: result.insertId };
    });
  } catch (err) {
    // uq_help_offers_one_active: this helper already has a pending/accepted offer
    if (err.code === 'ER_DUP_ENTRY') return fail('You already have an active offer for this request.');
    throw err;
  }
}

// The sender takes back a pending offer.
async function withdraw(offerId, helperId) {
  const [result] = await pool.execute(
    `UPDATE help_offers SET status = 'withdrawn'
      WHERE id = ? AND helper_user_id = ? AND status = 'pending'`,
    [offerId, helperId]
  );
  return result.affectedRows === 1 ? { ok: true } : fail('Only pending offers can be withdrawn.');
}

// The request owner declines a pending offer.
async function decline(offerId, ownerId) {
  const [result] = await pool.execute(
    `UPDATE help_offers o
       JOIN help_requests r ON r.id = o.help_request_id
        SET o.status = 'declined'
      WHERE o.id = ? AND r.user_id = ? AND o.status = 'pending'`,
    [offerId, ownerId]
  );
  return result.affectedRows === 1 ? { ok: true } : fail('Only pending offers can be declined.');
}

// The request owner accepts an offer. In one transaction:
//   offer -> accepted, other pending offers -> closed, request -> matched, new help session.
async function accept(offerId, ownerId) {
  return withTransaction(async (connection) => {
    const [[row]] = await connection.execute(
      `SELECT o.id, o.status, o.helper_user_id, o.preferred_mode,
              r.id AS request_id, r.user_id AS owner_user_id, r.status AS request_status,
              r.scheduled_at, r.location_label
         FROM help_offers o
         JOIN help_requests r ON r.id = o.help_request_id
        WHERE o.id = ?
        FOR UPDATE`,
      [offerId]
    );

    if (!row || row.owner_user_id !== ownerId) return fail('You can only accept offers on your own requests.');
    if (row.status !== 'pending') return fail('Only pending offers can be accepted.');
    if (row.request_status !== 'open') return fail('This request already has a helper or is no longer open.');

    await connection.execute(`UPDATE help_offers SET status = 'accepted' WHERE id = ?`, [row.id]);
    await connection.execute(
      `UPDATE help_offers SET status = 'closed'
        WHERE help_request_id = ? AND status = 'pending' AND id <> ?`,
      [row.request_id, row.id]
    );
    await connection.execute(`UPDATE help_requests SET status = 'matched' WHERE id = ?`, [row.request_id]);

    // The session starts from the helper's preferred mode and the request's time/place;
    // both sides can agree on changes later.
    const [result] = await connection.execute(
      `INSERT INTO help_sessions
         (help_request_id, help_offer_id, requester_user_id, helper_user_id, mode, scheduled_at, location_label)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        row.request_id,
        row.id,
        ownerId,
        row.helper_user_id,
        row.preferred_mode,
        row.scheduled_at,
        row.preferred_mode === 'in_person' ? row.location_label : null,
      ]
    );

    return { ok: true, sessionId: result.insertId };
  });
}

module.exports = {
  getOfferWithRequest,
  listForRequest,
  getLatestByHelper,
  listByHelper,
  checkCanOffer,
  create,
  withdraw,
  decline,
  accept,
};
