require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');
const connectDB = require('./config/db');

// Environment Validation
const isProd = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 5000;

if (isProd) {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.includes('change_me')) {
    console.warn('⚠️ WARNING: Using default or insecure JWT_SECRET in production mode!');
  }
  if (!process.env.MONGODB_URI) {
    console.error('❌ FATAL: MONGODB_URI is required in production environment.');
    process.exit(1);
  }
}

// Initialize Database Connection
connectDB();

const server = app.listen(PORT, '0.0.0.0', () => {
  const memoryMB = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
  console.log(`=========================================`);
  console.log(`  LeadFlow Production Server Ready`);
  console.log(`  Port:        ${PORT}`);
  console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`  Node.js:     ${process.version}`);
  console.log(`  Process ID:  ${process.pid}`);
  console.log(`  Memory Heap: ${memoryMB} MB`);
  console.log(`  Health URL:  http://localhost:${PORT}/api/health`);
  console.log(`=========================================`);
});

// Graceful Shutdown Handler
const gracefulShutdown = (signal) => {
  console.log(`\n[${new Date().toISOString()}] Received ${signal}. Starting graceful shutdown...`);
  
  // Stop accepting new connections
  server.close(async () => {
    console.log('  -> HTTP server closed to new requests.');
    try {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close(false);
        console.log('  -> MongoDB connection closed cleanly.');
      }
      console.log('  -> LeadFlow shutdown complete.');
      process.exit(0);
    } catch (err) {
      console.error('Error during database connection shutdown:', err);
      process.exit(1);
    }
  });

  // Force shutdown after 10s if active sockets hang
  setTimeout(() => {
    console.error('Shutdown timeout reached (10s). Forcing termination.');
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Process Exception Handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception thrown:', err);
  // Give process a chance to log and exit cleanly
  setTimeout(() => process.exit(1), 1000).unref();
});

