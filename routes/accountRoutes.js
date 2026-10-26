// My Account. Every route requires login and only ever shows the logged-in user's data.
const express = require('express');
const accountController = require('../controllers/accountController');
const { requireAuth } = require('../middleware/requireAuth');

const router = express.Router();

router.use(requireAuth);

router.get('/', accountController.show);
router.get('/edit', accountController.showEditForm);
router.post('/edit', accountController.update);

module.exports = router;
