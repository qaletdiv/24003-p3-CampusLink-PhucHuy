// CSRF protection: every form that changes data must send back a secret token
// stored in the user's session. Another website can't read that token,
// so it can't trick a logged-in user's browser into submitting our forms.
const crypto = require('crypto');
const { httpError } = require('../utils/httpError');

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

// Created only when a page actually renders a form, so plain visitors don't get a session.
function getToken(session) {
  if (!session.csrfToken) {
    session.csrfToken = crypto.randomBytes(32).toString('hex');
  }
  return session.csrfToken;
}

function tokensMatch(sent, expected) {
  if (typeof sent !== 'string' || !expected || sent.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(sent), Buffer.from(expected));
}

function csrfProtection(req, res, next) {
  // Views call csrfToken() inside forms (see views/partials/csrfField.ejs)
  res.locals.csrfToken = () => getToken(req.session);

  if (SAFE_METHODS.has(req.method)) return next();

  const sentToken = (req.body && req.body._csrf) || req.get('x-csrf-token');
  if (tokensMatch(sentToken, req.session.csrfToken)) return next();

  next(httpError(403, 'This form has expired. Please go back, refresh the page and try again.'));
}

module.exports = csrfProtection;
