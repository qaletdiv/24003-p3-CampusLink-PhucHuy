// Service: teams and membership.
// Rule-breaking actions return { ok: false, message } for the controller to show.
const { pool, withTransaction } = require('../config/db');

const PAGE_SIZE = 9;

const fail = (message) => ({ ok: false, message });

// Public team info shown on cards: never includes member names or emails.
const TEAM_COLUMNS = `
  t.id, t.owner_user_id, t.name, t.description, t.created_at,
  owner.full_name AS owner_name,
  (SELECT COUNT(*) FROM team_members m WHERE m.team_id = t.id) AS member_count,
  (SELECT COUNT(*) FROM team_sessions ts
    WHERE ts.team_id = t.id AND ts.status = 'scheduled' AND ts.ends_at > NOW()) AS upcoming_count`;

function escapeLike(text) {
  return text.replace(/[\\%_]/g, (char) => `\\${char}`);
}

// Search by keyword in name/description, newest first, paginated.
async function search({ q, page }) {
  const where = q ? 'WHERE t.name LIKE ? OR t.description LIKE ?' : '';
  const params = q ? [`%${escapeLike(q)}%`, `%${escapeLike(q)}%`] : [];

  const [[{ total }]] = await pool.execute(`SELECT COUNT(*) AS total FROM teams t ${where}`, params);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const [rows] = await pool.execute(
    `SELECT ${TEAM_COLUMNS}
       FROM teams t JOIN users owner ON owner.id = t.owner_user_id
       ${where}
      ORDER BY t.created_at DESC, t.id DESC
      LIMIT ? OFFSET ?`,
    [...params, String(PAGE_SIZE), String((currentPage - 1) * PAGE_SIZE)]
  );
  return { teams: rows, total, page: currentPage, totalPages, pageSize: PAGE_SIZE };
}

// Teams with the most members, for the Home page.
async function getFeatured(limit = 3) {
  const [rows] = await pool.execute(
    `SELECT ${TEAM_COLUMNS}
       FROM teams t JOIN users owner ON owner.id = t.owner_user_id
      ORDER BY member_count DESC, t.created_at DESC
      LIMIT ?`,
    [String(limit)]
  );
  return rows;
}

async function getById(id) {
  const [rows] = await pool.execute(
    `SELECT ${TEAM_COLUMNS}
       FROM teams t JOIN users owner ON owner.id = t.owner_user_id
      WHERE t.id = ?`,
    [id]
  );
  return rows[0] || null;
}

// Ids of the teams this user belongs to (to mark "Member" on list cards).
async function getTeamIdsForUser(userId) {
  const [rows] = await pool.execute('SELECT team_id FROM team_members WHERE user_id = ?', [userId]);
  return new Set(rows.map((row) => row.team_id));
}

async function isMember(teamId, userId) {
  const [rows] = await pool.execute(
    'SELECT 1 FROM team_members WHERE team_id = ? AND user_id = ?',
    [teamId, userId]
  );
  return rows.length > 0;
}

// Members-only: call this only after checking membership.
async function listMembers(teamId) {
  const [rows] = await pool.execute(
    `SELECT u.id, u.full_name, u.major, m.joined_at, (t.owner_user_id = u.id) AS is_owner
       FROM team_members m
       JOIN users u ON u.id = m.user_id
       JOIN teams t ON t.id = m.team_id
      WHERE m.team_id = ?
      ORDER BY is_owner DESC, m.joined_at ASC`,
    [teamId]
  );
  return rows;
}

// The creator becomes the owner and the first member, in one transaction.
async function create(ownerId, { name, description }) {
  return withTransaction(async (connection) => {
    const [result] = await connection.execute(
      'INSERT INTO teams (owner_user_id, name, description) VALUES (?, ?, ?)',
      [ownerId, name, description]
    );
    await connection.execute('INSERT INTO team_members (team_id, user_id) VALUES (?, ?)', [
      result.insertId,
      ownerId,
    ]);
    return result.insertId;
  });
}

async function update(teamId, ownerId, { name, description }) {
  const [result] = await pool.execute(
    'UPDATE teams SET name = ?, description = ? WHERE id = ? AND owner_user_id = ?',
    [name, description, teamId, ownerId]
  );
  return result.affectedRows === 1;
}

// Public teams: no approval needed. The primary key stops joining twice.
async function join(teamId, userId) {
  try {
    await pool.execute('INSERT INTO team_members (team_id, user_id) VALUES (?, ?)', [teamId, userId]);
    return { ok: true };
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return fail('You’re already a member of this team.');
    throw err;
  }
}

// The owner must hand over ownership first. Leaving also cancels the member's active signals.
async function leave(teamId, userId) {
  return withTransaction(async (connection) => {
    // Lock the team row so ownership can't change while we check it
    const [[team]] = await connection.execute('SELECT owner_user_id FROM teams WHERE id = ? FOR UPDATE', [
      teamId,
    ]);
    if (!team) return fail('This team does not exist.');
    if (team.owner_user_id === userId) {
      return fail('You own this team. Make another member the owner before leaving.');
    }

    const [result] = await connection.execute(
      'DELETE FROM team_members WHERE team_id = ? AND user_id = ?',
      [teamId, userId]
    );
    if (result.affectedRows === 0) return fail('You’re not a member of this team.');

    await connection.execute(
      `UPDATE team_signals SET cancelled_at = NOW()
        WHERE team_id = ? AND sender_user_id = ? AND cancelled_at IS NULL AND expires_at > NOW()`,
      [teamId, userId]
    );
    return { ok: true };
  });
}

async function transferOwnership(teamId, currentOwnerId, newOwnerId) {
  return withTransaction(async (connection) => {
    const [[team]] = await connection.execute('SELECT owner_user_id FROM teams WHERE id = ? FOR UPDATE', [
      teamId,
    ]);
    if (!team || team.owner_user_id !== currentOwnerId) return fail('Only the team owner can do that.');
    if (newOwnerId === currentOwnerId) return fail('You already own this team.');

    const [members] = await connection.execute(
      'SELECT 1 FROM team_members WHERE team_id = ? AND user_id = ? FOR UPDATE',
      [teamId, newOwnerId]
    );
    if (members.length === 0) return fail('The new owner must be a member of the team.');

    await connection.execute('UPDATE teams SET owner_user_id = ? WHERE id = ?', [newOwnerId, teamId]);
    return { ok: true };
  });
}

// Teams the user belongs to (My Account).
async function listForUser(userId) {
  const [rows] = await pool.execute(
    `SELECT ${TEAM_COLUMNS}, m.joined_at
       FROM team_members m
       JOIN teams t ON t.id = m.team_id
       JOIN users owner ON owner.id = t.owner_user_id
      WHERE m.user_id = ?
      ORDER BY m.joined_at DESC`,
    [userId]
  );
  return rows;
}

module.exports = {
  listForUser,
  search,
  getFeatured,
  getById,
  getTeamIdsForUser,
  isMember,
  listMembers,
  create,
  update,
  join,
  leave,
  transferOwnership,
};
