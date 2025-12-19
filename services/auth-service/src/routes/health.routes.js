/**
 * Health Check Routes
 * Implements health and readiness probes for Kubernetes
 */

import express from 'express';
import { pool } from '../config/database.js';

const router = express.Router();

/**
 * @route   GET /health
 * @desc    Basic health check
 * @access  Public
 */
router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'auth-service',
    timestamp: new Date().toISOString(),
  });
});

/**
 * @route   GET /health/liveness
 * @desc    Kubernetes liveness probe
 * @access  Public
 */
router.get('/liveness', (req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
});

/**
 * @route   GET /health/readiness
 * @desc    Kubernetes readiness probe - checks dependencies
 * @access  Public
 */
router.get('/readiness', async (req, res) => {
  try {
    // Check database connection
    await pool.query('SELECT 1');
    
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
      dependencies: {
        database: 'connected',
      },
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      dependencies: {
        database: 'disconnected',
      },
    });
  }
});

export default router;
