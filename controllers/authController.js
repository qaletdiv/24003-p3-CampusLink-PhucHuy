// Register, Login and Logout.
const userService = require('../services/userService');
const { validateRegistration, validateLogin } = require('../validators/authValidator');
const { safeReturnTo } = require('../utils/safeRedirect');

const SESSION_COOKIE = 'campuslink.sid';

// express-session uses callbacks; these wrappers let us use await.
const regenerateSession = (req) =>
  new Promise((resolve, reject) => req.session.regenerate((err) => (err ? reject(err) : resolve())));
const saveSession = (req) =>
  new Promise((resolve, reject) => req.session.save((err) => (err ? reject(err) : resolve())));
const destroySession = (req) =>
  new Promise((resolve, reject) => req.session.destroy((err) => (err ? reject(err) : resolve())));

// Only pass returnTo along when it points to a page on this site.
function returnToQuery(value) {
  const returnTo = safeReturnTo(value, '');
  return returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : '';
}

// ----- Register -----

function showRegister(req, res) {
  res.render('auth/register', {
    pageTitle: 'Sign up',
    values: {},
    errors: {},
    returnTo: safeReturnTo(req.query.returnTo, ''),
  });
}

async function register(req, res) {
  const { values, password, errors } = validateRegistration(req.body);
  const returnTo = safeReturnTo(req.body.returnTo, '');

  if (!errors.email && (await userService.emailExists(values.email))) {
    errors.email = 'An account with this email already exists. Try logging in instead.';
  }

  if (Object.keys(errors).length > 0) {
    // Passwords are never sent back to the form
    return res.status(422).render('auth/register', { pageTitle: 'Sign up', values, errors, returnTo });
  }

  try {
    await userService.createUser({ ...values, password });
  } catch (err) {
    // Two sign-ups with the same email at the same moment: the UNIQUE index catches the second one
    if (err.code !== 'ER_DUP_ENTRY') throw err;
    errors.email = 'An account with this email already exists. Try logging in instead.';
    return res.status(422).render('auth/register', { pageTitle: 'Sign up', values, errors, returnTo });
  }

  req.flash('success', 'Your account has been created. Please log in.');
  res.redirect(`/login${returnToQuery(returnTo)}`);
}

// ----- Login -----

function showLogin(req, res) {
  res.render('auth/login', {
    pageTitle: 'Log in',
    values: {},
    errors: {},
    formError: null,
    returnTo: safeReturnTo(req.query.returnTo, ''),
  });
}

async function login(req, res) {
  const { values, password, errors } = validateLogin(req.body);
  const returnTo = safeReturnTo(req.body.returnTo, '');
  const renderLogin = (status, formError) =>
    res.status(status).render('auth/login', { pageTitle: 'Log in', values, errors, formError, returnTo });

  if (Object.keys(errors).length > 0) return renderLogin(422, null);

  const user = await userService.verifyCredentials(values.email, password);
  if (!user) {
    // Same message whether the email or the password is wrong (don't reveal which accounts exist)
    return renderLogin(401, 'Email or password is incorrect.');
  }

  // New session id after login prevents "session fixation" attacks
  await regenerateSession(req);
  req.session.user = user;
  await saveSession(req);

  res.redirect(returnTo || '/');
}

// ----- Logout -----

async function logout(req, res) {
  await destroySession(req);
  res.clearCookie(SESSION_COOKIE);
  res.redirect('/');
}

module.exports = { showRegister, register, showLogin, login, logout };
