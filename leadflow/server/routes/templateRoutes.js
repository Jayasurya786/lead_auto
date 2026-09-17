const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  duplicateTemplate,
  previewTemplate,
} = require('../controllers/templateController');

router.use(protect);

router.get('/', getTemplates);
router.post('/', createTemplate);
router.post('/preview', previewTemplate);
router.get('/:id', getTemplateById);
router.put('/:id', updateTemplate);
router.delete('/:id', deleteTemplate);
router.post('/:id/duplicate', duplicateTemplate);

module.exports = router;

