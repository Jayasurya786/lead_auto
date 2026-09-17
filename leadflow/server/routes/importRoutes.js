const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { protect } = require('../middleware/authMiddleware');
const {
  uploadSpreadsheet,
  getImports,
  getImportById,
} = require('../controllers/importController');

router.use(protect);

router.post('/', upload.single('file'), uploadSpreadsheet);
router.get('/', getImports);
router.get('/:id', getImportById);

module.exports = router;

