// Service: user accounts and password checking.
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

const BCRYPT_ROUNDS = 10;

// Used when the email doesn't exist, so a failed login takes the same time either way
// and attackers can't tell which emails are registered by measuring response time.
const DUMMY_HASH = bcrypt.hashSync('campuslink-dummy-password', BCRYPT_ROUNDS);

async function emailExists(email) {
  const [rows] = await pool.execute('SELECT 1 FROM users WHERE email = ? LIMIT 1', [email]);
  return rows.length > 0;
}

// Returns the new user's id. Throws an error with code 'ER_DUP_ENTRY' if the email is taken.
async function createUser({ fullName, email, major, password }) {
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const [result] = await pool.execute(
    'INSERT INTO users (full_name, email, password_hash, major) VALUES (?, ?, ?, ?)',
    [fullName, email, passwordHash, major || null]
  );
  return result.insertId;
}

// Returns the user if the email and password match, otherwise null.
async function verifyCredentials(email, password) {
  const [rows] = await pool.execute(
    'SELECT id, full_name, email, password_hash FROM users WHERE email = ?',
    [email]
  );
  const user = rows[0];

  const passwordMatches = await bcrypt.compare(password, user ? user.password_hash : DUMMY_HASH);
  if (!user || !passwordMatches) return null;

  return { id: user.id, fullName: user.full_name, email: user.email };
}

// Profile for My Account (never includes the password hash).
async function getProfile(id) {
  const [rows] = await pool.execute(
    'SELECT id, full_name, email, major, created_at FROM users WHERE id = ?',
    [id]
  );
  return rows[0] || null;
}

// Email is the login and can't be changed in v1, so only name and major are updated.
async function updateProfile(id, { fullName, major }) {
  await pool.execute('UPDATE users SET full_name = ?, major = ? WHERE id = ?', [
    fullName,
    major || null,
    id,
  ]);
}

module.exports = { emailExists, createUser, verifyCredentials, getProfile, updateProfile };
