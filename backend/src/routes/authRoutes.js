// /api/auth – who am I, Register, Login and Logout.
const express = require('express');
const authController = require('../controllers/authController');
const { requireAuth, guestOnly } = require('../middleware/requireAuth');

const router = express.Router();

router.get('/me', authController.me);
router.post('/register', guestOnly, authController.register);
router.post('/login', guestOnly, authController.login);
router.post('/logout', requireAuth, authController.logout);

module.exports = router;
