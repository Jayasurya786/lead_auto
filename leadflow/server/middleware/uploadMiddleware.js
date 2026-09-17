const multer = require('multer');
const path = require('path');

// Store file in memory as Buffer for processing with SheetJS
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.xlsx', '.xls', '.csv'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (!allowedExtensions.includes(ext)) {
    return cb(
      new Error(`Invalid file type. Supported extensions are: ${allowedExtensions.join(', ')}`),
      false
    );
  }

  // Common spreadsheet MIME types
  const allowedMimes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
    'application/csv',
    'text/plain',
    'application/octet-stream', // Some browsers send octet-stream for xlsx
  ];

  if (allowedMimes.includes(file.mimetype) || ext === '.xlsx' || ext === '.xls' || ext === '.csv') {
    cb(null, true);
  } else {
    cb(new Error('Invalid spreadsheet file MIME type.'), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB limit
    files: 1,
  },
  fileFilter,
});

module.exports = upload;

