const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getLeadStats,
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  addNote,
  deleteLead,
  bulkAction,
  getPublicLeadPreview,
} = require('../controllers/leadController');

// Public route for landing page mockup preview
router.get('/public/:id', getPublicLeadPreview);

router.use(protect);

router.get('/stats', getLeadStats);
router.get('/', getLeads);
router.post('/', createLead);
router.post('/bulk', bulkAction);
router.get('/:id', getLeadById);
router.put('/:id', updateLead);
router.delete('/:id', deleteLead);
router.post('/:id/notes', addNote);

module.exports = router;

