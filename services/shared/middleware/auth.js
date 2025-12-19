/**
 * Authentication Middleware
 * OWASP ASVS Section 2: Authentication Verification
 * Implements Zero Trust - verify every request
 */

import { verifyToken } from '../utils/jwt.js';
import { logAuthzFailure } from '../utils/logger.js';

/**
 * Authenticate JWT token from request header
 * Extracts and verifies JWT, attaches user to request
 */
export function authenticate(req, res, next) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided',
        code: 'AUTH_TOKEN_MISSING',
      });
    }

    const token = authHeader.substring(7);

    // Verify token
    const decoded = verifyToken(token);

    // Attach user info to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error.message === 'Token expired') {
      return res.status(401).json({
        success: false,
        error: 'Token expired',
        code: 'AUTH_TOKEN_EXPIRED',
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Invalid token',
      code: 'AUTH_TOKEN_INVALID',
    });
  }
}

/**
 * Optional authentication - doesn't fail if no token
 * Used for endpoints that work for both authenticated and anonymous users
 */
export function optionalAuthenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);
      
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      };
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
}

export default {
  authenticate,
  optionalAuthenticate,
};
