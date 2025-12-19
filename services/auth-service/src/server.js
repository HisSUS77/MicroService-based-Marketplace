/**
 * Auth Service - Main Server
 * Implements secure user authentication and authorization
 * OWASP ASVS v5 Compliant
 */

import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Load environment variables
dotenv.config();

// Import shared middleware
import { configureHelmet, configureCORS, rateLimiter, logSecurityEvents } from '../../shared/middleware/security.js';
import { errorHandler, notFoundHandler } from '../../shared/middleware/errorHandler.js';
import { logger } from '../../shared/utils/logger.js';
import { initializeDatabase } from './config/database.js';

// Import routes
import authRoutes from './routes/auth.routes.js';
import healthRoutes from './routes/health.routes.js';

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Create __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create logs directory in service folder
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Security middleware
app.use(configureHelmet());
app.use(configureCORS());
app.use(logSecurityEvents);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use(rateLimiter);

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.http('Request completed', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    });
  });
  next();
});

// Health check routes
app.use('/health', healthRoutes);

// API routes
app.use('/auth', authRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Auth Service',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Initialize database and start server
initializeDatabase().then(() => {
  app.listen(PORT, () => {
    logger.info(`Auth Service started on port ${PORT}`, {
      environment: process.env.NODE_ENV,
      pid: process.pid,
    });
  });
}).catch((error) => {
  logger.error('Failed to initialize database', { error: error.message });
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection', { reason, promise });
  process.exit(1);
});

export default app;
