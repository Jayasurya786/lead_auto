const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getEmailHistory, getEmailById } = require('../controllers/emailController');

router.use(protect);

router.get('/', getEmailHistory);
router.get('/:id', getEmailById);

module.exports = router;

