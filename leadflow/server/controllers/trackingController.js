const mongoose = require('mongoose');
const { EmailMessage, Lead } = require('../models');

// 1x1 Transparent GIF base64
const TRANSPARENT_GIF_BUFFER = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

// @desc    Track email open via 1x1 invisible pixel
// @route   GET /api/tracking/open/:messageId
// @access  Public
const trackOpen = async (req, res) => {
  const { messageId } = req.params;

  try {
    if (messageId && mongoose.connection.readyState === 1) {
      const email = await EmailMessage.findOne({
        $or: [{ _id: messageId.match(/^[0-9a-fA-F]{24}$/) ? messageId : null }, { messageId }],
      });

      if (email) {
        email.openedAt = email.openedAt || new Date();
        email.openCount = (email.openCount || 0) + 1;
        if (email.status === 'SENT' || email.status === 'SIMULATED') {
          email.status = 'OPENED';
        }
        await email.save();
      }
    }
  } catch (err) {
    // Fail silently so tracking pixel always returns valid image
    console.error('Tracking open error:', err.message);
  }

  // Return 1x1 transparent GIF with no-cache headers
  res.setHeader('Content-Type', 'image/gif');
  res.setHeader('Content-Length', TRANSPARENT_GIF_BUFFER.length);
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  return res.end(TRANSPARENT_GIF_BUFFER);
};

// @desc    Track email link click and redirect
// @route   GET /api/tracking/click/:messageId
// @access  Public
const trackClick = async (req, res) => {
  const { messageId } = req.params;
  const targetUrl = req.query.url;

  if (!targetUrl) {
    return res.redirect('/');
  }

  try {
    if (messageId && mongoose.connection.readyState === 1) {
      const email = await EmailMessage.findOne({
        $or: [{ _id: messageId.match(/^[0-9a-fA-F]{24}$/) ? messageId : null }, { messageId }],
      });

      if (email) {
        email.clickedAt = email.clickedAt || new Date();
        email.clickCount = (email.clickCount || 0) + 1;
        await email.save();
      }
    }
  } catch (err) {
    console.error('Tracking click error:', err.message);
  }

  return res.redirect(targetUrl);
};

module.exports = {
  trackOpen,
  trackClick,
};
