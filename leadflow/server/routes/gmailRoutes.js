const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  initiateAuth,
  oauthCallback,
  getStatus,
  disconnect,
  sendEmail,
  sendBulk,
  syncReplies,
} = require('../controllers/gmailController');

// Callback is public as Google redirects the browser here
router.get('/callback', oauthCallback);

// Protected routes
router.use(protect);

router.get('/auth', initiateAuth);
router.get('/status', getStatus);
router.post('/disconnect', disconnect);
router.post('/send', sendEmail);
router.post('/send-bulk', sendBulk);
router.post('/sync-replies', syncReplies);

module.exports = router;

