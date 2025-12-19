/**
 * Database Configuration and Connection Pool
 * Implements secure database access with connection pooling
 */

import pg from 'pg';
import { logger } from '../../../shared/utils/logger.js';

const { Pool } = pg;

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'marketplace_auth',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  max: 20, // Maximum number of clients in pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: false,
  } : false,
};

// Create connection pool
export const pool = new Pool(dbConfig);

// Test connection
pool.on('connect', () => {
  logger.info('Database connection established');
});

pool.on('error', (err) => {
  logger.error('Unexpected database error', { error: err.message });
});

/**
 * Execute query with parameterized statements (SQL injection prevention)
 * @param {string} text - SQL query
 * @param {array} params - Query parameters
 * @returns {Promise} - Query result
 */
export async function query(text, params) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    logger.debug('Query executed', {
      duration: `${duration}ms`,
      rows: result.rowCount,
    });
    
    return result;
  } catch (error) {
    logger.error('Database query error', {
      error: error.message,
      query: text.substring(0, 100), // Log first 100 chars only
    });
    throw error;
  }
}

/**
 * Initialize database schema
 */
export async function initializeDatabase() {
  try {
    // Create users table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role VARCHAR(50) NOT NULL CHECK (role IN ('ADMIN', 'SELLER', 'BUYER')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP,
        is_active BOOLEAN DEFAULT true,
        failed_login_attempts INTEGER DEFAULT 0,
        locked_until TIMESTAMP
      )
    `);

    // Create indexes
    await query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
    await query('CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)');

    // Create refresh tokens table
    await query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        token_hash TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        revoked BOOLEAN DEFAULT false
      )
    `);

    await query('CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id)');

    // Create audit log table
    await query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID,
        action VARCHAR(100) NOT NULL,
        resource VARCHAR(100),
        ip_address INET,
        user_agent TEXT,
        success BOOLEAN,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query('CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at)');

    logger.info('Database schema initialized successfully');
  } catch (error) {
    logger.error('Database initialization failed', { error: error.message });
    throw error;
  }
}

export default {
  query,
  pool,
  initializeDatabase,
};
