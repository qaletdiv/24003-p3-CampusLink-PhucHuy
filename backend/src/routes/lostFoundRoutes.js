// /api/lost-found – viewing is public; posting and managing need login (owner checks in the controller).
const express = require('express');
const lostFoundController = require('../controllers/lostFoundController');
const { requireAuth } = require('../middleware/requireAuth');

const router = express.Router();

router.get('/', lostFoundController.list);
router.post('/', requireAuth, lostFoundController.create);
router.get('/:id', lostFoundController.detail);
router.put('/:id', requireAuth, lostFoundController.update);
router.patch('/:id/status', requireAuth, lostFoundController.setStatus);

module.exports = router;
