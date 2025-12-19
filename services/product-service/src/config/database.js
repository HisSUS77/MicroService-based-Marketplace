/**
 * Product Database Configuration
 */

import pg from 'pg';
import { logger } from '../../../shared/utils/logger.js';

const { Pool } = pg;

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'marketplace_products',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : false,
};

const pool = new Pool(dbConfig);

pool.on('connect', () => {
  logger.info('Product database connection established');
});

pool.on('error', (err) => {
  logger.error('Unexpected product database error', { error: err.message });
});

export async function query(text, params) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug('Query executed', { duration: `${duration}ms`, rows: result.rowCount });
    return result;
  } catch (error) {
    logger.error('Database query error', { error: error.message });
    throw error;
  }
}

export async function initializeDatabase() {
  try {
    // Create products table
    await query(`
      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(200) NOT NULL,
        description TEXT NOT NULL,
        price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
        stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
        seller_id UUID NOT NULL,
        category VARCHAR(100),
        image_url VARCHAR(500),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes
    await query('CREATE INDEX IF NOT EXISTS idx_products_seller ON products(seller_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)');
    await query('CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active)');
    await query('CREATE INDEX IF NOT EXISTS idx_products_created ON products(created_at)');

    logger.info('Product database schema initialized');
  } catch (error) {
    logger.error('Product database initialization failed', { error: error.message });
    throw error;
  }
}

export default { query, pool, initializeDatabase };
