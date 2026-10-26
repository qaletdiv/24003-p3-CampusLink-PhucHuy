// Routes that return HTML pages (rendered with EJS).
const express = require('express');
const pageController = require('../controllers/pageController');

const router = express.Router();

router.get('/', pageController.showHome);

module.exports = router;
