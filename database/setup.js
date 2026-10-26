// Recreates the database from schema.sql, then loads sample data from seed.sql.
// Run from the project root: npm run db:reset   (WARNING: deletes all existing data)
// Connection settings are shared with the API, so they are read from backend/.env.
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'backend', '.env'), quiet: true });

const fs = require('fs/promises');
const mysql = require('mysql2/promise');

const DB_NAME = process.env.DB_NAME || 'campuslink_db';

async function runSqlFile(connection, fileName) {
  const sql = await fs.readFile(path.join(__dirname, fileName), 'utf8');
  await connection.query(sql);
  console.log(`✓ Ran ${fileName}`);
}

async function main() {
  // The name is put into SQL directly (CREATE DATABASE can't use ? placeholders), so allow only safe characters
  if (!/^\w{1,64}$/.test(DB_NAME)) {
    throw new Error('DB_NAME may only contain letters, digits and underscores.');
  }

  // No database selected here because it may not exist yet
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true, // allow running many SQL statements from one file
  });

  try {
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    await connection.query(`USE \`${DB_NAME}\``);
    await runSqlFile(connection, 'schema.sql');
    await runSqlFile(connection, 'seed.sql');
    console.log(`Database "${DB_NAME}" is ready.`);
  } finally {
    await connection.end();
  }
}

main().catch((err) => {
  console.error('Database setup failed:', err.message);
  process.exit(1);
});
