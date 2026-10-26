// Service: study sessions / events inside a team. Members-only – the controller
// checks membership before calling these functions.
const { pool } = require('../config/db');

const COLUMNS = `
  ts.id, ts.team_id, ts.created_by_user_id, ts.title, ts.description,
  ts.starts_at, ts.ends_at, ts.location_label, ts.status, ts.created_at,
  (ts.ends_at <= NOW()) AS is_past,
  u.full_name AS creator_name`;

// Upcoming sessions (soonest first), then past and cancelled ones (most recent first).
async function listForTeam(teamId) {
  const [rows] = await pool.execute(
    `SELECT ${COLUMNS}
       FROM team_sessions ts JOIN users u ON u.id = ts.created_by_user_id
      WHERE ts.team_id = ?
      ORDER BY ts.starts_at ASC`,
    [teamId]
  );
  const upcoming = rows.filter((row) => row.status === 'scheduled' && !row.is_past);
  const others = rows.filter((row) => !upcoming.includes(row)).reverse();
  return { upcoming, others };
}

// Looking up by team id too means /teams/1/sessions/5 can't show a session of another team.
async function getById(teamId, id) {
  const [rows] = await pool.execute(
    `SELECT ${COLUMNS}
       FROM team_sessions ts JOIN users u ON u.id = ts.created_by_user_id
      WHERE ts.team_id = ? AND ts.id = ?`,
    [teamId, id]
  );
  return rows[0] || null;
}

async function create(teamId, userId, data) {
  const [result] = await pool.execute(
    `INSERT INTO team_sessions
       (team_id, created_by_user_id, title, description, starts_at, ends_at, location_label)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [teamId, userId, data.title, data.description, data.startsAt, data.endsAt, data.locationLabel]
  );
  return result.insertId;
}

// Only the creator, and only while it's scheduled and hasn't ended. Returns true if updated.
async function update(teamId, id, userId, data) {
  const [result] = await pool.execute(
    `UPDATE team_sessions
        SET title = ?, description = ?, starts_at = ?, ends_at = ?, location_label = ?
      WHERE team_id = ? AND id = ? AND created_by_user_id = ?
        AND status = 'scheduled' AND ends_at > NOW()`,
    [data.title, data.description, data.startsAt, data.endsAt, data.locationLabel, teamId, id, userId]
  );
  return result.affectedRows === 1;
}

async function cancel(teamId, id, userId) {
  const [result] = await pool.execute(
    `UPDATE team_sessions SET status = 'cancelled'
      WHERE team_id = ? AND id = ? AND created_by_user_id = ?
        AND status = 'scheduled' AND ends_at > NOW()`,
    [teamId, id, userId]
  );
  return result.affectedRows === 1;
}

module.exports = { listForTeam, getById, create, update, cancel };
