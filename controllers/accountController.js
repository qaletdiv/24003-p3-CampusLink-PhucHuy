// My Account: the logged-in user's profile and activity.
// Everything is loaded with req.session.user.id – never an id from the URL –
// so there is no way to open someone else's account page.
const userService = require('../services/userService');
const helpRequestService = require('../services/helpRequestService');
const offerService = require('../services/offerService');
const sessionService = require('../services/sessionService');
const teamService = require('../services/teamService');
const lostFoundService = require('../services/lostFoundService');
const { validateProfile } = require('../validators/authValidator');

const RECENT_LIMIT = 5;

// GET /account
async function show(req, res) {
  const userId = req.session.user.id;
  const profile = await userService.getProfile(userId);

  // The account was removed while logged in: end the session
  if (!profile) {
    return req.session.destroy(() => res.redirect('/login'));
  }

  const [requests, requestCount, offers, sessions, teams, posts, postCount] = await Promise.all([
    helpRequestService.listByUser(userId, RECENT_LIMIT),
    helpRequestService.countByUser(userId),
    offerService.listByHelper(userId),
    sessionService.listForUser(userId),
    teamService.listForUser(userId),
    lostFoundService.listByUser(userId, RECENT_LIMIT),
    lostFoundService.countByUser(userId),
  ]);

  res.render('account/show', {
    pageTitle: 'My Account',
    profile,
    requests,
    requestCount,
    offers: offers.slice(0, RECENT_LIMIT),
    offerCount: offers.length,
    sessions: sessions.slice(0, RECENT_LIMIT),
    sessionCount: sessions.length,
    teams,
    posts,
    postCount,
  });
}

// GET /account/edit
async function showEditForm(req, res) {
  const profile = await userService.getProfile(req.session.user.id);
  res.render('account/edit', {
    pageTitle: 'Edit profile',
    profile,
    values: { fullName: profile.full_name, major: profile.major || '' },
    errors: {},
  });
}

// POST /account/edit
async function update(req, res) {
  const userId = req.session.user.id;
  const { values, errors } = validateProfile(req.body);

  if (Object.keys(errors).length > 0) {
    const profile = await userService.getProfile(userId);
    return res.status(422).render('account/edit', { pageTitle: 'Edit profile', profile, values, errors });
  }

  await userService.updateProfile(userId, values);
  req.session.user.fullName = values.fullName; // keep the name in the header up to date
  req.flash('success', 'Your profile has been updated.');
  res.redirect('/account');
}

module.exports = { show, showEditForm, update };
