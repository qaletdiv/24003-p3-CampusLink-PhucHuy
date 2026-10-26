// CampusLink application entry point.
require('dotenv').config({ quiet: true });

const path = require('path');
const express = require('express');
const session = require('express-session');

const { testConnection } = require('./config/db');
const constants = require('./config/constants');
const format = require('./utils/format');
const pageRoutes = require('./routes/pageRoutes');
const helpRoutes = require('./routes/helpRoutes');
const apiRoutes = require('./routes/apiRoutes');
const authRoutes = require('./routes/authRoutes');
const offerRoutes = require('./routes/offerRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const teamRoutes = require('./routes/teamRoutes');
const lostFoundRoutes = require('./routes/lostFoundRoutes');
const accountRoutes = require('./routes/accountRoutes');
const flash = require('./middleware/flash');
const csrfProtection = require('./middleware/csrf');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

if (!process.env.SESSION_SECRET) {
  console.error('SESSION_SECRET is missing from .env (see .env.example).');
  process.exit(1);
}

// --- View engine: EJS renders HTML on the server ---
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Variables/helpers available in every .ejs file
app.locals.siteName = 'CampusLink';
app.locals.constants = constants;
app.locals.formatDateTime = format.formatDateTime;
app.locals.truncate = format.truncate;

// --- Middleware ---
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false })); // parse <form> submissions
app.use(express.json()); // parse JSON for the REST API

app.use(
  session({
    name: 'campuslink.sid',
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true, // browser JavaScript cannot read the cookie
      sameSite: 'lax',
      secure: isProduction, // only send over HTTPS when deployed
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  })
);

app.use(flash);

// Logged-in user (saved in the session at login) for views and controllers
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.currentPath = req.path;
  next();
});

app.use(csrfProtection);

// --- Routes ---
app.use('/', pageRoutes);
app.use('/', authRoutes);
app.use('/help', helpRoutes);
app.use('/offers', offerRoutes);
app.use('/sessions', sessionRoutes);
app.use('/teams', teamRoutes);
app.use('/lost-found', lostFoundRoutes);
app.use('/account', accountRoutes);
app.use('/api', apiRoutes);

// --- Error handling (always last) ---
app.use(notFound);
app.use(errorHandler);

async function start() {
  try {
    await testConnection();
    console.log('Connected to MySQL.');
  } catch (err) {
    console.error('Could not connect to MySQL:', err.message);
    console.error('Check that MySQL is running and the DB_* variables in .env are correct.');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`CampusLink is running at http://localhost:${PORT}`);
  });
}

start();
