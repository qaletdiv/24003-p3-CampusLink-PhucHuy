// Lost & Found pages. Viewing is public; posting and managing need login (owner checks in the controller).
const express = require('express');
const lostFoundController = require('../controllers/lostFoundController');
const { requireAuth } = require('../middleware/requireAuth');

const router = express.Router();

router.get('/', lostFoundController.list);
router.get('/new', requireAuth, lostFoundController.showNewForm); // must come before /:id
router.post('/', requireAuth, lostFoundController.create);
router.get('/:id', lostFoundController.showDetail);
router.get('/:id/edit', requireAuth, lostFoundController.showEditForm);
router.post('/:id/edit', requireAuth, lostFoundController.update);
router.post('/:id/status', requireAuth, lostFoundController.setStatus);

module.exports = router;
