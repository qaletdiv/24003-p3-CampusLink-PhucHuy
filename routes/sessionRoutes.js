// Help sessions. Every route requires login.
const express = require('express');
const sessionController = require('../controllers/sessionController');
const { requireAuth } = require('../middleware/requireAuth');

const router = express.Router();

router.use(requireAuth);

router.get('/', sessionController.list);
router.get('/:id', sessionController.showDetail);

// Lifecycle
router.post('/:id/start', sessionController.start);
router.post('/:id/complete', sessionController.complete);
router.post('/:id/cancel', sessionController.cancel);

// Agreeing on details: one person proposes, the other accepts or declines
router.post('/:id/proposal', sessionController.propose);
router.post('/:id/proposal/accept', sessionController.acceptProposal);
router.post('/:id/proposal/decline', sessionController.declineProposal);
router.post('/:id/proposal/withdraw', sessionController.withdrawProposal);

module.exports = router;
