// CampusLink API entry point: checks the configuration and the database, then starts listening.
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env'), quiet: true }); // backend/.env

const { testConnection } = require('./config/db');

const PORT = Number(process.env.PORT) || 3000;

if (!process.env.SESSION_SECRET) {
  console.error('SESSION_SECRET is missing from backend/.env (see backend/.env.example).');
  process.exit(1);
}

// Loaded after dotenv so the app and the database pool see the .env values
const app = require('./app');

async function start() {
  try {
    await testConnection();
    console.log('Connected to MySQL.');
  } catch (err) {
    console.error('Could not connect to MySQL:', err.message);
    console.error('Check that MySQL is running and the DB_* variables in backend/.env are correct.');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`CampusLink API is running at http://localhost:${PORT}/api`);
  });
}

start();
