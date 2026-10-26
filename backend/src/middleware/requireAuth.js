// Route guards based on the login session.

// Only logged-in users may continue.
function requireAuth(req, res, next) {
  if (req.session.user) return next();
  res.status(401).json({ error: 'Please log in first.' });
}

// Register/Login are for guests only.
function guestOnly(req, res, next) {
  if (!req.session.user) return next();
  res.status(409).json({ error: 'You are already logged in.' });
}

module.exports = { requireAuth, guestOnly };
