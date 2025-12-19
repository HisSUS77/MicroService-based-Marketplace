import express from 'express';
import { pool } from '../config/database.js';

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ status: 'healthy', service: 'payment-service' });
});

router.get('/readiness', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ready', dependencies: { database: 'connected' } });
  } catch (error) {
    res.status(503).json({ status: 'not ready', dependencies: { database: 'disconnected' } });
  }
});

export default router;
