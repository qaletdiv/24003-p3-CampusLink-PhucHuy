// Every API route, mounted under /api in app.js.
const express = require('express');
const metaController = require('../controllers/metaController');
const homeController = require('../controllers/homeController');

const router = express.Router();

router.get('/health', (req, res) => res.json({ status: 'ok' }));
router.get('/meta', metaController.show);
router.get('/home', homeController.show);

router.use('/auth', require('./authRoutes'));
router.use('/account', require('./accountRoutes'));
router.use('/help-requests', require('./helpRequestRoutes'));
router.use('/offers', require('./offerRoutes'));
router.use('/sessions', require('./sessionRoutes'));
router.use('/teams', require('./teamRoutes'));
router.use('/lost-found', require('./lostFoundRoutes'));

module.exports = router;
