// Service: Team Signals – short-lived "come meet us here" invitations.
// Members-only – the controller checks membership before calling these functions.
const { pool } = require('../config/db');

// How long a signal can stay active, in minutes (the form offers exactly these).
const SIGNAL_DURATIONS = {
  15: '15 minutes',
  30: '30 minutes',
  60: '1 hour',
  120: '2 hours',
};

// Active = not cancelled and not yet expired. Expired signals simply stop showing up.
async function listActive(teamId) {
  const [rows] = await pool.execute(
    `SELECT s.id, s.sender_user_id, s.message, s.location_label, s.expires_at, s.created_at,
            u.full_name AS sender_name
       FROM team_signals s JOIN users u ON u.id = s.sender_user_id
      WHERE s.team_id = ? AND s.cancelled_at IS NULL AND s.expires_at > NOW()
      ORDER BY s.created_at DESC`,
    [teamId]
  );
  return rows;
}

// The expiry time is calculated by MySQL so it uses the same clock as the "active" check.
async function create(teamId, senderId, { message, locationLabel, durationMinutes }) {
  const [result] = await pool.execute(
    `INSERT INTO team_signals (team_id, sender_user_id, message, location_label, expires_at)
     VALUES (?, ?, ?, ?, NOW() + INTERVAL ? MINUTE)`,
    [teamId, senderId, message, locationLabel, durationMinutes]
  );
  return result.insertId;
}

// Only the sender can cancel, and only while it's still active. Returns true if cancelled.
async function cancel(teamId, id, senderId) {
  const [result] = await pool.execute(
    `UPDATE team_signals SET cancelled_at = NOW()
      WHERE team_id = ? AND id = ? AND sender_user_id = ?
        AND cancelled_at IS NULL AND expires_at > NOW()`,
    [teamId, id, senderId]
  );
  return result.affectedRows === 1;
}

module.exports = { SIGNAL_DURATIONS, listActive, create, cancel };
