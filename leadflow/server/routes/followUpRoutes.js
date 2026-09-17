const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getFollowUps,
  sendFollowUp,
  rescheduleFollowUp,
} = require('../controllers/followUpController');

router.use(protect);

router.get('/', getFollowUps);
router.post('/:leadId/send', sendFollowUp);
router.put('/:leadId/reschedule', rescheduleFollowUp);

module.exports = router;

