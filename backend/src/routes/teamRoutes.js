// /api/teams – teams, team sessions/events and Team Signals.
// Access levels: public (list, team intro) · logged in (create, join) · member · owner.
const express = require('express');
const teamController = require('../controllers/teamController');
const teamSessionController = require('../controllers/teamSessionController');
const { requireAuth } = require('../middleware/requireAuth');
const { loadTeam, requireTeamMember, requireTeamOwner } = require('../middleware/teamAccess');

const router = express.Router();

const member = [requireAuth, loadTeam, requireTeamMember];
const owner = [requireAuth, loadTeam, requireTeamOwner];

// Public
router.get('/', teamController.list);
router.post('/', requireAuth, teamController.create);
router.get('/:id', loadTeam, teamController.detail); // member-only parts are filtered in the controller

// Membership
router.post('/:id/join', requireAuth, loadTeam, teamController.join);
router.post('/:id/leave', member, teamController.leave);

// Owner only
router.put('/:id', owner, teamController.update);
router.post('/:id/transfer', owner, teamController.transfer);

// Members only: Team Signals
router.post('/:id/signals', member, teamController.createSignal);
router.post('/:id/signals/:signalId/cancel', member, teamController.cancelSignal);

// Members only: sessions / events
router.post('/:id/sessions', member, teamSessionController.create);
router.get('/:id/sessions/:sessionId', member, teamSessionController.detail);
router.put('/:id/sessions/:sessionId', member, teamSessionController.update);
router.post('/:id/sessions/:sessionId/cancel', member, teamSessionController.cancel);

module.exports = router;
