/**
 * User Model
 * Handles user data operations with security best practices
 */

import crypto from 'crypto';
import { query } from '../config/database.js';
import { hashPassword, verifyPassword as verifyPasswordUtil } from '../../../shared/utils/crypto.js';

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 15;

/**
 * Create new user
 * @param {object} userData - User data (email, password, role)
 * @returns {Promise<object>} - Created user
 */
async function create(userData) {
  const { email, password, role } = userData;
  
  // Hash password
  const passwordHash = await hashPassword(password);
  
  const result = await query(
    `INSERT INTO users (email, password_hash, role) 
     VALUES ($1, $2, $3) 
     RETURNING id, email, role, created_at`,
    [email, passwordHash, role]
  );
  
  return result.rows[0];
}

/**
 * Find user by email
 * @param {string} email - User email
 * @returns {Promise<object|null>} - User or null
 */
async function findByEmail(email) {
  const result = await query(
    'SELECT * FROM users WHERE email = $1 AND is_active = true',
    [email]
  );
  
  return result.rows[0] || null;
}

/**
 * Find user by ID
 * @param {string} userId - User ID
 * @returns {Promise<object|null>} - User or null
 */
async function findById(userId) {
  const result = await query(
    'SELECT id, email, role, created_at, updated_at, last_login FROM users WHERE id = $1 AND is_active = true',
    [userId]
  );
  
  return result.rows[0] || null;
}

/**
 * Verify user password
 * @param {string} userId - User ID
 * @param {string} password - Password to verify
 * @returns {Promise<boolean>} - True if password is valid
 */
async function verifyPassword(userId, password) {
  const result = await query(
    'SELECT password_hash FROM users WHERE id = $1',
    [userId]
  );
  
  if (result.rows.length === 0) {
    return false;
  }
  
  return await verifyPasswordUtil(password, result.rows[0].password_hash);
}

/**
 * Update user password
 * @param {string} userId - User ID
 * @param {string} newPassword - New password
 */
async function updatePassword(userId, newPassword) {
  const passwordHash = await hashPassword(newPassword);
  
  await query(
    'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    [passwordHash, userId]
  );
}

/**
 * Update last login timestamp
 * @param {string} userId - User ID
 */
async function updateLastLogin(userId) {
  await query(
    'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
    [userId]
  );
}

/**
 * Increment failed login attempts
 * @param {string} userId - User ID
 */
async function incrementFailedLoginAttempts(userId) {
  const result = await query(
    `UPDATE users 
     SET failed_login_attempts = failed_login_attempts + 1,
         locked_until = CASE 
           WHEN failed_login_attempts + 1 >= $1 
           THEN CURRENT_TIMESTAMP + INTERVAL '${LOCK_DURATION_MINUTES} minutes'
           ELSE locked_until
         END
     WHERE id = $2
     RETURNING failed_login_attempts`,
    [MAX_FAILED_ATTEMPTS, userId]
  );
  
  return result.rows[0];
}

/**
 * Reset failed login attempts
 * @param {string} userId - User ID
 */
async function resetFailedLoginAttempts(userId) {
  await query(
    'UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = $1',
    [userId]
  );
}

/**
 * Store refresh token
 * @param {string} userId - User ID
 * @param {string} token - Refresh token
 */
async function storeRefreshToken(userId, token) {
  // Hash token before storing
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  
  await query(
    'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
    [userId, tokenHash, expiresAt]
  );
}

/**
 * Validate refresh token
 * @param {string} userId - User ID
 * @param {string} token - Refresh token
 * @returns {Promise<boolean>} - True if token is valid
 */
async function validateRefreshToken(userId, token) {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  
  const result = await query(
    `SELECT * FROM refresh_tokens 
     WHERE user_id = $1 AND token_hash = $2 AND expires_at > CURRENT_TIMESTAMP AND revoked = false`,
    [userId, tokenHash]
  );
  
  return result.rows.length > 0;
}

/**
 * Revoke refresh token
 * @param {string} userId - User ID
 * @param {string} token - Refresh token
 */
async function revokeRefreshToken(userId, token) {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  
  await query(
    'UPDATE refresh_tokens SET revoked = true WHERE user_id = $1 AND token_hash = $2',
    [userId, tokenHash]
  );
}

/**
 * Revoke all refresh tokens for user
 * @param {string} userId - User ID
 */
async function revokeAllRefreshTokens(userId) {
  await query(
    'UPDATE refresh_tokens SET revoked = true WHERE user_id = $1',
    [userId]
  );
}

/**
 * Log audit event
 * @param {object} auditData - Audit data
 */
async function logAudit(auditData) {
  const { userId, action, resource, ipAddress, userAgent, success } = auditData;
  
  await query(
    `INSERT INTO audit_logs (user_id, action, resource, ip_address, user_agent, success) 
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [userId, action, resource, ipAddress, userAgent, success]
  );
}

export default {
  create,
  findByEmail,
  findById,
  verifyPassword,
  updatePassword,
  updateLastLogin,
  incrementFailedLoginAttempts,
  resetFailedLoginAttempts,
  storeRefreshToken,
  validateRefreshToken,
  revokeRefreshToken,
  revokeAllRefreshTokens,
  logAudit,
};
