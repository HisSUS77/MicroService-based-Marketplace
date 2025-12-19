/**
 * Payment Service Server
 * Mock payment processing with encryption
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

import paymentRoutes from './routes/payment.routes.js';
import healthRoutes from './routes/health.routes.js';

const app = express();
const PORT = process.env.PORT || 3004;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create logs directory in service folder
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

app.use(configureHelmet());
app.use(configureCORS());
app.use(logSecurityEvents);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(rateLimiter);

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.http('Request completed', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${Date.now() - start}ms`,
    });
  });
  next();
});

app.use('/health', healthRoutes);
app.use('/payments', paymentRoutes);

app.get('/', (req, res) => {
  res.json({
    service: 'Payment Service',
    version: '1.0.0',
    status: 'running',
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

initializeDatabase().then(() => {
  app.listen(PORT, () => {
    logger.info(`Payment Service started on port ${PORT}`);
  });
}).catch((error) => {
  logger.error('Failed to initialize database', { error: error.message });
  process.exit(1);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received');
  process.exit(0);
});

export default app;
