// CampusLink REST API: builds the Express app (started by server.js).
// Every route lives under /api and answers with JSON; the Next.js frontend renders the pages.
const express = require('express');
const session = require('express-session');

const apiRoutes = require('./routes');
const { csrfProtection } = require('./middleware/csrf');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const isProduction = process.env.NODE_ENV === 'production';

const app = express();

// Behind a reverse proxy (Nginx, Render, ...) in production: trust it so secure cookies work over HTTPS
if (isProduction) app.set('trust proxy', 1);

// --- Middleware ---
app.use(express.json({ limit: '100kb' })); // the API only accepts JSON bodies

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

app.use('/api', csrfProtection);

// --- Routes ---
app.use('/api', apiRoutes);
app.use(notFound);

// --- Error handling (always last) ---
app.use(errorHandler);

module.exports = app;
