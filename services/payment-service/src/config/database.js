import pg from 'pg';
import { logger } from '../../../shared/utils/logger.js';

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'marketplace_payments',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: 20,
});

export async function query(text, params) {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    logger.error('Database error', { error: error.message });
    throw error;
  }
}

export async function initializeDatabase() {
  await query(`
    CREATE TABLE IF NOT EXISTS payments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      order_id UUID UNIQUE NOT NULL,
      user_id UUID NOT NULL,
      amount DECIMAL(10, 2) NOT NULL,
      encrypted_card TEXT NOT NULL,
      status VARCHAR(50) DEFAULT 'COMPLETED',
      transaction_id VARCHAR(100) UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await query('CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id)');
  logger.info('Payment database initialized');
}

export { pool };
export default { query, pool, initializeDatabase };
