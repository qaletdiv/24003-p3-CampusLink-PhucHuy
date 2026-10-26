// Offer actions and "My offers". Every route requires login.
const express = require('express');
const offerController = require('../controllers/offerController');
const { requireAuth } = require('../middleware/requireAuth');

const router = express.Router();

router.use(requireAuth);

router.get('/', offerController.listMine);
router.post('/:id/withdraw', offerController.withdraw);
router.post('/:id/accept', offerController.accept);
router.post('/:id/decline', offerController.decline);

module.exports = router;
