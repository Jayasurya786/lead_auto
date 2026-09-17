// 404 Handler
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Global Error Handler
const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  // Mask any potential sensitive tokens or secrets from leaking in errors
  let safeMessage = err.message
    ? err.message.replace(/([a-zA-Z0-9_\-\.]{30,})/g, '[REDACTED]')
    : 'Internal Server Error';

  // Specific database and validation error mapping
  if (err.name === 'CastError') {
    statusCode = 400;
    safeMessage = `Resource not found or invalid identifier format (${err.path || 'id'}).`;
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    safeMessage = Object.values(err.errors || {})
      .map((e) => e.message)
      .join(', ') || 'Validation error';
  } else if (err.name === 'MulterError') {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      safeMessage = 'Uploaded file exceeds the maximum allowed limit of 10 MB.';
    } else {
      safeMessage = err.message || 'File upload processing error.';
    }
  }

  if (process.env.NODE_ENV !== 'test') {
    console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);
  }

  res.status(statusCode).json({
    success: false,
    message: safeMessage,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = {
  notFound,
  errorHandler,
};
