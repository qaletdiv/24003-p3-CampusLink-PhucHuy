// Help request pages (HTML).
// HTML forms can only send GET and POST, so edit/cancel use POST to dedicated URLs.
const express = require('express');
const helpRequestController = require('../controllers/helpRequestController');
const offerController = require('../controllers/offerController');
const { requireAuth } = require('../middleware/requireAuth');

const router = express.Router();

router.get('/', helpRequestController.showList);
router.post('/', requireAuth, helpRequestController.create);
router.get('/new', requireAuth, helpRequestController.showNewForm); // must come before /:id
router.get('/:id', helpRequestController.showDetail);
router.get('/:id/edit', requireAuth, helpRequestController.showEditForm);
router.post('/:id/edit', requireAuth, helpRequestController.update);
router.post('/:id/cancel', requireAuth, helpRequestController.cancel);
router.post('/:id/reopen', requireAuth, helpRequestController.reopen);
router.get('/:id/offer', requireAuth, offerController.showNewForm);
router.post('/:id/offers', requireAuth, offerController.create);

module.exports = router;
