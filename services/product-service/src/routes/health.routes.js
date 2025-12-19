/**
 * Health Check Routes for Product Service
 */

import express from 'express';
import { pool } from '../config/database.js';

const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'product-service',
    timestamp: new Date().toISOString(),
  });
});

router.get('/liveness', (req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
});

router.get('/readiness', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({
      status: 'ready',
      dependencies: { database: 'connected' },
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      dependencies: { database: 'disconnected' },
    });
  }
});

export default router;
