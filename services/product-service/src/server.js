/**
 * Product Service - Main Server
 * Implements secure product management with RBAC
 */

import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

dotenv.config();

import { configureHelmet, configureCORS, rateLimiter, logSecurityEvents } from '../../shared/middleware/security.js';
import { errorHandler, notFoundHandler } from '../../shared/middleware/errorHandler.js';
import { logger } from '../../shared/utils/logger.js';
import { initializeDatabase } from './config/database.js';

import productRoutes from './routes/product.routes.js';
import healthRoutes from './routes/health.routes.js';

const app = express();
const PORT = process.env.PORT || 3002;

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

// Body parsing
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
    });
  });
  next();
});

// Routes
app.use('/health', healthRoutes);
app.use('/products', productRoutes);

app.get('/', (req, res) => {
  res.json({
    service: 'Product Service',
    version: '1.0.0',
    status: 'running',
  });
});

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Initialize database and start server
initializeDatabase().then(() => {
  app.listen(PORT, () => {
    logger.info(`Product Service started on port ${PORT}`);
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

export default app;
