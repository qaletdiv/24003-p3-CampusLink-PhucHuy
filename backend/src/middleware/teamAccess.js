// Team access checks used by every /api/teams/:id/... route.
// Hiding buttons in the page is not security: these checks run on the server
// for every request, so a member-only URL is refused even if someone types it by hand.
const teamService = require('../services/teamService');
const { httpError, parseId } = require('../utils/httpError');

// Loads the team from :id and works out the viewer's role. Sets req.team, req.isTeamMember, req.isTeamOwner.
async function loadTeam(req, res, next) {
  const id = parseId(req.params.id);
  const team = id && (await teamService.getById(id));
  if (!team) throw httpError(404, 'This team does not exist.');

  const user = req.session.user;
  req.team = team;
  req.isTeamMember = Boolean(user) && (await teamService.isMember(team.id, user.id));
  req.isTeamOwner = Boolean(user) && team.owner_user_id === user.id;
  next();
}

// Use after requireAuth and loadTeam.
function requireTeamMember(req, res, next) {
  if (!req.isTeamMember) throw httpError(403, 'Only members of this team can do that. Join the team first.');
  next();
}

function requireTeamOwner(req, res, next) {
  if (!req.isTeamOwner) throw httpError(403, 'Only the team owner can do that.');
  next();
}

module.exports = { loadTeam, requireTeamMember, requireTeamOwner };
