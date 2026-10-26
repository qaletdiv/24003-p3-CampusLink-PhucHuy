// Service: Lost & Found posts.
const { pool } = require('../config/db');

const PAGE_SIZE = 9;

// contact_info is only ever non-NULL when the poster opted in to share it on the post.
const COLUMNS = `
  p.id, p.user_id, p.post_type, p.title, p.description, p.category, p.location_label,
  p.occurred_at, p.image_url, p.contact_info, p.status, p.created_at, p.updated_at,
  u.full_name AS author_name`;

function escapeLike(text) {
  return text.replace(/[\\%_]/g, (char) => `\\${char}`);
}

function buildWhere(filters) {
  const conditions = [];
  const params = [];

  if (filters.q) {
    const pattern = `%${escapeLike(filters.q)}%`;
    conditions.push('(p.title LIKE ? OR p.description LIKE ? OR p.location_label LIKE ?)');
    params.push(pattern, pattern, pattern);
  }
  if (filters.type) {
    conditions.push('p.post_type = ?');
    params.push(filters.type);
  }
  if (filters.category) {
    conditions.push('p.category = ?');
    params.push(filters.category);
  }
  if (filters.posted) {
    conditions.push('p.created_at >= NOW() - INTERVAL ? DAY');
    params.push(Number(filters.posted));
  }
  if (filters.status !== 'all') {
    conditions.push('p.status = ?');
    params.push(filters.status);
  }

  return { whereSql: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '', params };
}

// Filters come from utils/lostFoundQuery.js (already allow-listed).
async function search(filters) {
  const { whereSql, params } = buildWhere(filters);

  const [[{ total }]] = await pool.execute(
    `SELECT COUNT(*) AS total FROM lost_found_posts p ${whereSql}`,
    params
  );
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(filters.page, totalPages);

  const [rows] = await pool.execute(
    `SELECT ${COLUMNS}
       FROM lost_found_posts p JOIN users u ON u.id = p.user_id
       ${whereSql}
      ORDER BY p.created_at DESC, p.id DESC
      LIMIT ? OFFSET ?`,
    [...params, String(PAGE_SIZE), String((page - 1) * PAGE_SIZE)]
  );
  return { posts: rows, total, page, totalPages, pageSize: PAGE_SIZE };
}

async function getLatestOpen(limit = 4) {
  const [rows] = await pool.execute(
    `SELECT ${COLUMNS}
       FROM lost_found_posts p JOIN users u ON u.id = p.user_id
      WHERE p.status = 'open'
      ORDER BY p.created_at DESC
      LIMIT ?`,
    [String(limit)]
  );
  return rows;
}

async function getById(id) {
  const [rows] = await pool.execute(
    `SELECT ${COLUMNS} FROM lost_found_posts p JOIN users u ON u.id = p.user_id WHERE p.id = ?`,
    [id]
  );
  return rows[0] || null;
}

// Posts by one user, newest first (My Account).
async function listByUser(userId, limit) {
  const [rows] = await pool.execute(
    `SELECT ${COLUMNS}
       FROM lost_found_posts p JOIN users u ON u.id = p.user_id
      WHERE p.user_id = ?
      ORDER BY p.created_at DESC
      LIMIT ?`,
    [userId, String(limit)]
  );
  return rows;
}

async function countByUser(userId) {
  const [[{ total }]] = await pool.execute(
    'SELECT COUNT(*) AS total FROM lost_found_posts WHERE user_id = ?',
    [userId]
  );
  return total;
}

async function create(userId, data) {
  const [result] = await pool.execute(
    `INSERT INTO lost_found_posts
       (user_id, post_type, title, description, category, location_label, occurred_at, image_url, contact_info)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, data.postType, data.title, data.description, data.category, data.locationLabel,
      data.occurredAt, data.imageUrl, data.contactInfo]
  );
  return result.insertId;
}

// Content can be edited only while the post is open. Returns true if updated.
async function update(id, userId, data) {
  const [result] = await pool.execute(
    `UPDATE lost_found_posts
        SET post_type = ?, title = ?, description = ?, category = ?, location_label = ?,
            occurred_at = ?, image_url = ?, contact_info = ?
      WHERE id = ? AND user_id = ? AND status = 'open'`,
    [data.postType, data.title, data.description, data.category, data.locationLabel,
      data.occurredAt, data.imageUrl, data.contactInfo, id, userId]
  );
  return result.affectedRows === 1;
}

// The owner can move between open / resolved / closed at any time (e.g. reopen a closed post).
async function setStatus(id, userId, status) {
  const [result] = await pool.execute(
    'UPDATE lost_found_posts SET status = ? WHERE id = ? AND user_id = ?',
    [status, id, userId]
  );
  return result.affectedRows === 1;
}

async function countOpen() {
  const [[{ total }]] = await pool.execute(`SELECT COUNT(*) AS total FROM lost_found_posts WHERE status = 'open'`);
  return total;
}

module.exports = { search, getLatestOpen, countOpen, getById, listByUser, countByUser, create, update, setStatus };
