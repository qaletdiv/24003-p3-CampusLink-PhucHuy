// My Account: the logged-in user's profile and activity.
// Everything is loaded with req.session.user.id – never an id from the URL –
// so there is no way to read someone else's account.
const userService = require('../services/userService');
const helpRequestService = require('../services/helpRequestService');
const offerService = require('../services/offerService');
const sessionService = require('../services/sessionService');
const teamService = require('../services/teamService');
const lostFoundService = require('../services/lostFoundService');
const { validateProfile } = require('../validators/authValidator');
const { httpError, assertValid } = require('../utils/httpError');

const RECENT_LIMIT = 5;

// GET /api/account
async function show(req, res) {
  const userId = req.session.user.id;
  const profile = await userService.getProfile(userId);

  // The account was removed while logged in: end the session
  if (!profile) {
    await new Promise((resolve) => req.session.destroy(resolve));
    throw httpError(401, 'Please log in first.');
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

  res.json({
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

// PUT /api/account – body: fullName, major
async function update(req, res) {
  const { values, errors } = validateProfile(req.body);
  assertValid(errors);

  await userService.updateProfile(req.session.user.id, values);
  req.session.user.fullName = values.fullName; // keep the name in the header up to date
  res.json({ user: req.session.user, message: 'Your profile has been updated.' });
}

module.exports = { show, update };
