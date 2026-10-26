// CSRF protection: every request that changes data must send back a secret token
// stored in the user's session, in the X-CSRF-Token header. Another website can't read
// that token, so it can't trick a logged-in user's browser into calling our API.
// The frontend gets the token from GET /api/auth/me (and from the login response).
const crypto = require('crypto');
const { httpError } = require('../utils/httpError');

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

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
  if (SAFE_METHODS.has(req.method)) return next();
  if (tokensMatch(req.get('x-csrf-token'), req.session.csrfToken)) return next();

  next(httpError(403, 'Your session has expired. Refresh the page and try again.'));
}

module.exports = { csrfProtection, getToken };
