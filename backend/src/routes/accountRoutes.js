// /api/account – My Account. Requires login and only ever returns the logged-in user's data.
const express = require('express');
const accountController = require('../controllers/accountController');
const { requireAuth } = require('../middleware/requireAuth');

const router = express.Router();

router.use(requireAuth);

router.get('/', accountController.show);
router.put('/', accountController.update);

module.exports = router;
