const express = require('express');
const router = express.Router();
const { trackOpen, trackClick } = require('../controllers/trackingController');

// Public tracking routes
router.get('/open/:messageId', trackOpen);
router.get('/click/:messageId', trackClick);

module.exports = router;

