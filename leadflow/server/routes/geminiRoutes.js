const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { createPitch } = require('../controllers/geminiController');

router.use(protect);
router.post('/pitch', createPitch);

module.exports = router;

