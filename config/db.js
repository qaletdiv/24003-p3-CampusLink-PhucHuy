// MySQL connection pool (mysql2/promise).
// A pool keeps a few connections open for reuse, which is faster than opening a new one per request.
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'campuslink_db',
  waitForConnections: true,
  connectionLimit: 10,
});

// Called at startup so database misconfiguration is caught early.
async function testConnection() {
  const connection = await pool.getConnection();
  try {
    await connection.ping();
  } finally {
    connection.release();
  }
}

// Runs several queries as one all-or-nothing unit (a transaction).
// `work` receives a connection; if it throws, every change it made is rolled back.
async function withTransaction(work) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await work(connection);
    await connection.commit();
    return result;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

module.exports = { pool, testConnection, withTransaction };
