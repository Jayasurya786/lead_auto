const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');

const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const { apiLimiter, authLimiter } = require('./middleware/rateLimitMiddleware');

const authRoutes = require('./routes/authRoutes');
const importRoutes = require('./routes/importRoutes');
const leadRoutes = require('./routes/leadRoutes');
const contactRoutes = require('./routes/contactRoutes');
const templateRoutes = require('./routes/templateRoutes');
const emailRoutes = require('./routes/emailRoutes');
const gmailRoutes = require('./routes/gmailRoutes');
const followUpRoutes = require('./routes/followUpRoutes');
const exportRoutes = require('./routes/exportRoutes');
const trackingRoutes = require('./routes/trackingRoutes');
const geminiRoutes = require('./routes/geminiRoutes');

const app = express();

// Trust reverse proxy (for Render, Railway, Nginx, Cloudflare, AWS ALB)
app.set('trust proxy', 1);

// HTTP Compression (gzip / deflate)
app.use(compression());

// Security Headers configured for SPA & tracking pixel embeds
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS Configuration
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      const allowed = [
        clientUrl,
        'http://localhost:5173',
        'http://localhost:5000',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5000',
      ];
      if (allowed.includes(origin) || origin.endsWith('.onrender.com') || origin.endsWith('.railway.app')) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in fallback to avoid client lockout
    },
    credentials: true,
  })
);

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request Logging in non-test mode
if (process.env.NODE_ENV !== 'test') {
  app.use(process.env.NODE_ENV === 'production' ? morgan('combined') : morgan('dev'));
}

// Global API rate limiting
app.use('/api', apiLimiter);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    app: 'LeadFlow API',
    time: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/imports', importRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/email-history', emailRoutes);
app.use('/api/gmail', gmailRoutes);
app.use('/api/follow-ups', followUpRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/ai', geminiRoutes);

// Serve built React client assets when available
const clientDistPath = path.join(__dirname, '../client/dist');
app.use(
  express.static(clientDistPath, {
    maxAge: '1y',
    setHeaders: (res, filePath) => {
      // Never cache index.html so client gets fresh bundles after redeployment
      if (path.basename(filePath) === 'index.html') {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      }
    },
  })
);

// SPA client-side routing fallback (exclude /api/*)
app.get('*', (req, res, next) => {
  if (req.originalUrl.startsWith('/api')) {
    return next();
  }
  const fs = require('fs');
  const indexPath = path.join(clientDistPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(indexPath);
  } else {
    next();
  }
});

// Error Handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;
