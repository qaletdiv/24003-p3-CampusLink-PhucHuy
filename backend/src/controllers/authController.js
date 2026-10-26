// Register, Login, Logout and "who am I".
const userService = require('../services/userService');
const { validateRegistration, validateLogin } = require('../validators/authValidator');
const { getToken } = require('../middleware/csrf');
const { httpError, assertValid } = require('../utils/httpError');

const SESSION_COOKIE = 'campuslink.sid';
const EMAIL_TAKEN = 'An account with this email already exists. Try logging in instead.';

// express-session uses callbacks; these wrappers let us use await.
const regenerateSession = (req) =>
  new Promise((resolve, reject) => req.session.regenerate((err) => (err ? reject(err) : resolve())));
const saveSession = (req) =>
  new Promise((resolve, reject) => req.session.save((err) => (err ? reject(err) : resolve())));
const destroySession = (req) =>
  new Promise((resolve, reject) => req.session.destroy((err) => (err ? reject(err) : resolve())));

// GET /api/auth/me – the logged-in user (or null) and the CSRF token for the next changes
function me(req, res) {
  res.json({ user: req.session.user || null, csrfToken: getToken(req.session) });
}

// POST /api/auth/register
async function register(req, res) {
  const { values, password, errors } = validateRegistration(req.body);

  if (!errors.email && (await userService.emailExists(values.email))) errors.email = EMAIL_TAKEN;
  assertValid(errors);

  try {
    await userService.createUser({ ...values, password });
  } catch (err) {
    // Two sign-ups with the same email at the same moment: the UNIQUE index catches the second one
    if (err.code !== 'ER_DUP_ENTRY') throw err;
    assertValid({ email: EMAIL_TAKEN });
  }

  res.status(201).json({ message: 'Your account has been created. Please log in.' });
}

// POST /api/auth/login
async function login(req, res) {
  const { values, password, errors } = validateLogin(req.body);
  assertValid(errors);

  const user = await userService.verifyCredentials(values.email, password);
  // Same message whether the email or the password is wrong (don't reveal which accounts exist)
  if (!user) throw httpError(401, 'Email or password is incorrect.');

  // New session id after login prevents "session fixation" attacks
  await regenerateSession(req);
  req.session.user = user;
  const csrfToken = getToken(req.session); // the old token died with the old session
  await saveSession(req);

  res.json({ user, csrfToken });
}

// POST /api/auth/logout
async function logout(req, res) {
  await destroySession(req);
  res.clearCookie(SESSION_COOKIE);
  res.status(204).end();
}

module.exports = { me, register, login, logout };
