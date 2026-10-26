// Route guards based on the login session.

// Only logged-in users may continue. Guests are sent to Login and brought back afterwards.
function requireAuth(req, res, next) {
  if (req.session.user) return next();

  if (req.originalUrl.startsWith('/api/')) {
    return res.status(401).json({ error: 'Please log in first.' });
  }

  req.flash('info', 'Please log in to continue.');

  // After login we can only safely return to a page (GET), not replay a form submission.
  const loginUrl =
    req.method === 'GET'
      ? `/login?returnTo=${encodeURIComponent(req.originalUrl)}`
      : '/login';
  res.redirect(loginUrl);
}

// Login/Register pages are for guests only; logged-in users go to Home.
function guestOnly(req, res, next) {
  if (req.session.user) return res.redirect('/');
  next();
}

module.exports = { requireAuth, guestOnly };
