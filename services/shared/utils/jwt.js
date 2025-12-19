/**
 * JWT Utilities
 * Implements stateless authentication with JWT
 * OWASP ASVS Section 2: Authentication
 */

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '24h';
const JWT_REFRESH_EXPIRATION = process.env.JWT_REFRESH_EXPIRATION || '7d';

/**
 * Generate JWT access token
 * @param {object} payload - Token payload (user data)
 * @returns {string} - Signed JWT token
 */
export function generateAccessToken(payload) {
  const sanitizedPayload = {
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    iat: Math.floor(Date.now() / 1000),
  };
  
  return jwt.sign(sanitizedPayload, JWT_SECRET, {
    expiresIn: JWT_EXPIRATION,
    issuer: 'secure-marketplace',
    audience: 'marketplace-api',
  });
}

/**
 * Generate JWT refresh token
 * @param {object} payload - Token payload (user data)
 * @returns {string} - Signed refresh token
 */
export function generateRefreshToken(payload) {
  const sanitizedPayload = {
    userId: payload.userId,
    tokenVersion: payload.tokenVersion || 0,
  };
  
  return jwt.sign(sanitizedPayload, JWT_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRATION,
    issuer: 'secure-marketplace',
    audience: 'marketplace-refresh',
  });
}

/**
 * Verify and decode JWT token
 * @param {string} token - JWT token
 * @returns {object} - Decoded payload
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'secure-marketplace',
      audience: 'marketplace-api',
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    throw new Error('Token verification failed');
  }
}

/**
 * Verify refresh token
 * @param {string} token - Refresh token
 * @returns {object} - Decoded payload
 */
export function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'secure-marketplace',
      audience: 'marketplace-refresh',
    });
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
}

/**
 * Decode token without verification (for debugging only)
 * @param {string} token - JWT token
 * @returns {object} - Decoded payload
 */
export function decodeToken(token) {
  return jwt.decode(token);
}

export default {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken,
  decodeToken,
};
