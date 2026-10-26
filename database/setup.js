// Recreates the database from sql/schema.sql, then loads sample data from sql/seed.sql.
// Run: npm run db:reset   (WARNING: deletes all existing data)
require('dotenv').config({ quiet: true });

const fs = require('fs/promises');
const path = require('path');
const mysql = require('mysql2/promise');

async function runSqlFile(connection, fileName) {
  const filePath = path.join(__dirname, '..', 'sql', fileName);
  const sql = await fs.readFile(filePath, 'utf8');
  await connection.query(sql);
  console.log(`✓ Ran ${fileName}`);
}

async function main() {
  // No database selected here because schema.sql creates campuslink_db itself
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true, // allow running many SQL statements from one file
  });

  try {
    await runSqlFile(connection, 'schema.sql');
    await runSqlFile(connection, 'seed.sql');
    console.log('Database setup complete.');
  } finally {
    await connection.end();
  }
}

main().catch((err) => {
  console.error('Database setup failed:', err.message);
  process.exit(1);
});
