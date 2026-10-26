// Data for the Home page.
const helpRequestService = require('../services/helpRequestService');
const teamService = require('../services/teamService');
const lostFoundService = require('../services/lostFoundService');

// GET /api/home
async function show(req, res) {
  const [latestRequests, featuredTeams, latestLostFound, openRequests, teams, openLostFound] = await Promise.all([
    helpRequestService.getLatestOpen(6),
    teamService.getFeatured(3),
    lostFoundService.getLatestOpen(4),
    helpRequestService.countOpen(),
    teamService.count(),
    lostFoundService.countOpen(),
  ]);

  res.json({ latestRequests, featuredTeams, latestLostFound, stats: { openRequests, teams, openLostFound } });
}

module.exports = { show };
