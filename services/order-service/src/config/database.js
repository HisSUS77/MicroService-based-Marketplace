import pg from 'pg';
import { logger } from '../../../shared/utils/logger.js';

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'marketplace_orders',
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
    CREATE TABLE IF NOT EXISTS orders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      product_id UUID NOT NULL,
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      total_amount DECIMAL(10, 2) NOT NULL,
      shipping_address TEXT,
      status VARCHAR(50) DEFAULT 'PENDING',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Add shipping_address column if it doesn't exist (for existing tables)
  await query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'shipping_address'
      ) THEN
        ALTER TABLE orders ADD COLUMN shipping_address TEXT;
      END IF;
    END $$;
  `);
  
  await query('CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id)');
  logger.info('Order database initialized');
}

export { pool };
export default { query, pool, initializeDatabase };
