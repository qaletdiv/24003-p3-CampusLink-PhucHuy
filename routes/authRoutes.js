// Register, Login and Logout pages.
const express = require('express');
const authController = require('../controllers/authController');
const { requireAuth, guestOnly } = require('../middleware/requireAuth');

const router = express.Router();

router.get('/register', guestOnly, authController.showRegister);
router.post('/register', guestOnly, authController.register);
router.get('/login', guestOnly, authController.showLogin);
router.post('/login', guestOnly, authController.login);
router.post('/logout', requireAuth, authController.logout);

module.exports = router;
