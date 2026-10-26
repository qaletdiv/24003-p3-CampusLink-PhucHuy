// /api/help-requests – viewing is public; everything else needs login (owner checks in the controller).
const express = require('express');
const helpRequestController = require('../controllers/helpRequestController');
const offerController = require('../controllers/offerController');
const { requireAuth } = require('../middleware/requireAuth');

const router = express.Router();

router.get('/', helpRequestController.list);
router.post('/', requireAuth, helpRequestController.create);
router.get('/:id', helpRequestController.detail);
router.put('/:id', requireAuth, helpRequestController.update);
router.post('/:id/cancel', requireAuth, helpRequestController.cancel);
router.post('/:id/reopen', requireAuth, helpRequestController.reopen);
router.post('/:id/offers', requireAuth, offerController.create);

module.exports = router;
