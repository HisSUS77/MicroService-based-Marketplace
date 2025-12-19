/**
 * Shared Security Utilities
 * OWASP ASVS v5 Compliant
 * Zero Trust Architecture
 */

import crypto from 'crypto';

// Generate or use provided encryption key (must be 32 bytes for AES-256)
let ENCRYPTION_KEY;
if (process.env.ENCRYPTION_KEY) {
  // If env var is set, convert from hex string to Buffer
  ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
  // Ensure it's exactly 32 bytes
  if (ENCRYPTION_KEY.length !== 32) {
    console.warn('ENCRYPTION_KEY is not 32 bytes, generating new key');
    ENCRYPTION_KEY = crypto.randomBytes(32);
  }
} else {
  // Generate a random 32-byte key
  ENCRYPTION_KEY = crypto.randomBytes(32);
}

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const ITERATIONS = 100000;
const KEY_LENGTH = 32;

/**
 * Encrypt data using AES-256-GCM
 * @param {string} text - Plain text to encrypt
 * @returns {string} - Encrypted data with IV and auth tag
 */
export function encrypt(text) {
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(
      ALGORITHM,
      ENCRYPTION_KEY,
      iv
    );
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Encryption failed');
  }
}

/**
 * Decrypt data using AES-256-GCM
 * @param {string} encryptedData - Encrypted data with IV and auth tag
 * @returns {string} - Decrypted plain text
 */
export function decrypt(encryptedData) {
  try {
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      ENCRYPTION_KEY,
      iv
    );
    
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Decryption failed');
  }
}

/**
 * Hash password using PBKDF2
 * @param {string} password - Plain password
 * @returns {Promise<string>} - Hashed password with salt
 */
export async function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(SALT_LENGTH).toString('hex');
    
    crypto.pbkdf2(password, salt, ITERATIONS, KEY_LENGTH, 'sha512', (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

/**
 * Verify password against hash
 * @param {string} password - Plain password
 * @param {string} hash - Stored hash with salt
 * @returns {Promise<boolean>} - True if password matches
 */
export async function verifyPassword(password, hash) {
  return new Promise((resolve, reject) => {
    const [salt, key] = hash.split(':');
    
    crypto.pbkdf2(password, salt, ITERATIONS, KEY_LENGTH, 'sha512', (err, derivedKey) => {
      if (err) reject(err);
      resolve(key === derivedKey.toString('hex'));
    });
  });
}

/**
 * Generate secure random token
 * @param {number} length - Token length in bytes
 * @returns {string} - Hex encoded token
 */
export function generateToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Sanitize input to prevent XSS
 * @param {string} input - User input
 * @returns {string} - Sanitized input
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
}

/**
 * Validate email format
 * @param {string} email - Email address
 * @returns {boolean} - True if valid
 */
export function isValidEmail(email) {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Mask sensitive data for logging
 * @param {string} data - Sensitive data
 * @param {number} visibleChars - Number of visible chars
 * @returns {string} - Masked data
 */
export function maskSensitiveData(data, visibleChars = 4) {
  if (!data || data.length <= visibleChars) return '****';
  return `${data.slice(0, visibleChars)}${'*'.repeat(data.length - visibleChars)}`;
}

export default {
  encrypt,
  decrypt,
  hashPassword,
  verifyPassword,
  generateToken,
  sanitizeInput,
  isValidEmail,
  maskSensitiveData,
};
