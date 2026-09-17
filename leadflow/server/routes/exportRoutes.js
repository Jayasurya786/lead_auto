const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { exportData } = require('../controllers/exportController');

router.use(protect);
router.get('/', exportData);

module.exports = router;

