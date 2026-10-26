// One-time messages shown after a redirect, e.g. "Your request was posted."
// req.flash(type, message) saves it in the session; the next page shows it once, then it's removed.
function flash(req, res, next) {
  req.flash = (type, message) => {
    req.session.flash = { type, message };
  };

  res.locals.flash = req.session.flash || null;
  delete req.session.flash;
  next();
}

module.exports = flash;
