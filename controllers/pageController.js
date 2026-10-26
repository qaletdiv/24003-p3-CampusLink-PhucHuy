// Controller: receives the request, asks a service for data, then picks a view to render.
const helpRequestService = require('../services/helpRequestService');
const teamService = require('../services/teamService');
const lostFoundService = require('../services/lostFoundService');

async function showHome(req, res) {
  const latestRequests = await helpRequestService.getLatestOpen(6);
  const featuredTeams = await teamService.getFeatured(3);
  const latestLostFound = await lostFoundService.getLatestOpen(4);

  res.render('home', {
    pageTitle: 'Home',
    latestRequests,
    featuredTeams,
    latestLostFound,
  });
}

module.exports = { showHome };
