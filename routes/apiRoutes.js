// REST API (JSON). Test with Postman / Thunder Client or curl.
const express = require('express');
const helpRequestController = require('../controllers/helpRequestController');
const lostFoundController = require('../controllers/lostFoundController');

const router = express.Router();

router.get('/help-requests', helpRequestController.apiList);
router.get('/help-requests/:id', helpRequestController.apiDetail);
router.get('/lost-found', lostFoundController.apiList);
router.get('/lost-found/:id', lostFoundController.apiDetail);

module.exports = router;
