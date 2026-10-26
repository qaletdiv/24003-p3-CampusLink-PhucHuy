// Service: SQL queries and business logic for help requests.
// Always use ? placeholders (prepared statements) instead of string concatenation to prevent SQL injection.
const { pool, withTransaction } = require('../config/db');

const PAGE_SIZE = 6;

// Columns shown on list cards (never includes the author's email).
const LIST_COLUMNS = `
  hr.id, hr.title, hr.description, hr.category, hr.support_mode,
  hr.location_label, hr.scheduled_at, hr.status, hr.created_at,
  u.full_name AS author_name`;

// ORDER BY cannot use ? placeholders, so only these fixed strings are ever inserted.
const ORDER_BY = {
  newest: 'hr.created_at DESC, hr.id DESC',
  soonest: 'hr.scheduled_at IS NULL, hr.scheduled_at ASC, hr.created_at DESC', // unscheduled last
};

// Escape % and _ so a keyword like "100%" is searched literally in LIKE.
function escapeLike(text) {
  return text.replace(/[\\%_]/g, (char) => `\\${char}`);
}

// Turns the filters into a WHERE clause plus its parameter values.
function buildWhere(filters) {
  const conditions = [];
  const params = [];

  if (filters.q) {
    const pattern = `%${escapeLike(filters.q)}%`;
    conditions.push('(hr.title LIKE ? OR hr.description LIKE ?)');
    params.push(pattern, pattern);
  }
  if (filters.category) {
    conditions.push('hr.category = ?');
    params.push(filters.category);
  }
  if (filters.mode) {
    conditions.push('hr.support_mode = ?');
    params.push(filters.mode);
  }
  if (filters.status !== 'all') {
    conditions.push('hr.status = ?');
    params.push(filters.status);
  }

  const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  return { whereSql, params };
}

// Latest open requests for the Home page.
async function getLatestOpen(limit = 6) {
  const [rows] = await pool.execute(
    `SELECT ${LIST_COLUMNS}
       FROM help_requests hr
       JOIN users u ON u.id = hr.user_id
      WHERE hr.status = 'open'
      ORDER BY hr.created_at DESC
      LIMIT ?`,
    [String(limit)]
  );
  return rows;
}

// Search + filter + sort + paginate. `filters` comes from parseListQuery().
async function search(filters) {
  const { whereSql, params } = buildWhere(filters);

  const [[{ total }]] = await pool.execute(
    `SELECT COUNT(*) AS total FROM help_requests hr ${whereSql}`,
    params
  );

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(filters.page, totalPages); // ?page=999 shows the last page
  const offset = (page - 1) * PAGE_SIZE;

  // mysql2 needs LIMIT/OFFSET values as strings when using execute()
  const [rows] = await pool.execute(
    `SELECT ${LIST_COLUMNS}
       FROM help_requests hr
       JOIN users u ON u.id = hr.user_id
       ${whereSql}
      ORDER BY ${ORDER_BY[filters.sort]}
      LIMIT ? OFFSET ?`,
    [...params, String(PAGE_SIZE), String(offset)]
  );

  return { requests: rows, total, page, totalPages, pageSize: PAGE_SIZE };
}

// One request with its author's public profile, or null if it doesn't exist.
async function getById(id) {
  const [rows] = await pool.execute(
    `SELECT hr.id, hr.user_id, hr.title, hr.description, hr.category, hr.support_mode,
            hr.location_label, hr.scheduled_at, hr.status, hr.created_at, hr.updated_at,
            u.full_name AS author_name, u.major AS author_major
       FROM help_requests hr
       JOIN users u ON u.id = hr.user_id
      WHERE hr.id = ?`,
    [id]
  );
  return rows[0] || null;
}

// Creates a new request (status starts as 'open'). Returns the new id.
async function create(userId, data) {
  const [result] = await pool.execute(
    `INSERT INTO help_requests
       (user_id, title, description, category, support_mode, location_label, scheduled_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [userId, data.title, data.description, data.category, data.supportMode, data.locationLabel, data.scheduledAt]
  );
  return result.insertId;
}

// The WHERE clause re-checks owner and status inside the same query, so the rule holds even if
// the request changed after the page was loaded. Returns true if a row was updated.
async function update(id, userId, data) {
  const [result] = await pool.execute(
    `UPDATE help_requests
        SET title = ?, description = ?, category = ?, support_mode = ?,
            location_label = ?, scheduled_at = ?
      WHERE id = ? AND user_id = ? AND status = 'open'`,
    [data.title, data.description, data.category, data.supportMode, data.locationLabel, data.scheduledAt,
      id, userId]
  );
  return result.affectedRows === 1;
}

// Locks the request and checks that it belongs to the user and has no active
// help session. Returns { request } or { error }.
async function lockOwnRequest(connection, id, userId) {
  const [[request]] = await connection.execute(
    'SELECT id, user_id, status FROM help_requests WHERE id = ? FOR UPDATE',
    [id]
  );
  if (!request || request.user_id !== userId) return { error: 'You can only manage your own help requests.' };

  const [[{ activeSessions }]] = await connection.execute(
    `SELECT COUNT(*) AS activeSessions FROM help_sessions
      WHERE help_request_id = ? AND status IN ('scheduled', 'in_progress')`,
    [id]
  );
  if (activeSessions > 0) {
    return { error: 'This request has an active help session. Complete or cancel the session first.' };
  }
  return { request };
}

// Open requests can be cancelled. Matched requests can be cancelled only after their
// help session was cancelled. Pending offers are closed in the same transaction.
async function cancel(id, userId) {
  return withTransaction(async (connection) => {
    const { request, error } = await lockOwnRequest(connection, id, userId);
    if (error) return { ok: false, message: error };
    if (!['open', 'matched'].includes(request.status)) {
      return { ok: false, message: 'This request has already been completed or cancelled.' };
    }

    await connection.execute(`UPDATE help_requests SET status = 'cancelled' WHERE id = ?`, [id]);
    await connection.execute(
      `UPDATE help_offers SET status = 'closed' WHERE help_request_id = ? AND status = 'pending'`,
      [id]
    );
    return { ok: true };
  });
}

// After a help session is cancelled, the owner can reopen the request to find another helper.
async function reopen(id, userId) {
  return withTransaction(async (connection) => {
    const { request, error } = await lockOwnRequest(connection, id, userId);
    if (error) return { ok: false, message: error };
    if (request.status !== 'matched') {
      return { ok: false, message: 'Only a request whose help session was cancelled can be reopened.' };
    }

    await connection.execute(`UPDATE help_requests SET status = 'open' WHERE id = ?`, [id]);
    return { ok: true };
  });
}

// Requests posted by one user, newest first (My Account).
async function listByUser(userId, limit) {
  const [rows] = await pool.execute(
    `SELECT id, title, category, support_mode, status, created_at
       FROM help_requests
      WHERE user_id = ?
      ORDER BY created_at DESC, id DESC
      LIMIT ?`,
    [userId, String(limit)]
  );
  return rows;
}

async function countByUser(userId) {
  const [[{ total }]] = await pool.execute(
    'SELECT COUNT(*) AS total FROM help_requests WHERE user_id = ?',
    [userId]
  );
  return total;
}

// Number of requests still looking for a helper (Home page).
async function countOpen() {
  const [[{ total }]] = await pool.execute(`SELECT COUNT(*) AS total FROM help_requests WHERE status = 'open'`);
  return total;
}

module.exports = {
  getLatestOpen,
  countOpen,
  search,
  getById,
  create,
  update,
  cancel,
  reopen,
  listByUser,
  countByUser,
};
