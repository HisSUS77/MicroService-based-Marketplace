/**
 * Authorization Middleware - RBAC Implementation
 * OWASP ASVS Section 4: Access Control Verification
 * Implements Role-Based Access Control
 */

import { logAuthzFailure } from '../utils/logger.js';

// Role hierarchy
export const ROLES = {
  ADMIN: 'ADMIN',
  SELLER: 'SELLER',
  BUYER: 'BUYER',
};

// Role permissions mapping
const rolePermissions = {
  ADMIN: ['*'], // Admin has all permissions
  SELLER: [
    'product:create',
    'product:read',
    'product:update',
    'product:delete',
    'order:read',
  ],
  BUYER: [
    'product:read',
    'order:create',
    'order:read',
    'payment:create',
  ],
};

/**
 * Check if user has required role
 * @param {array|string} allowedRoles - Role(s) allowed to access resource
 */
export function authorize(...allowedRoles) {
  return (req, res, next) => {
    // Ensure user is authenticated
    if (!req.user) {
      logAuthzFailure('unknown', req.originalUrl, req.method, {
        reason: 'No authenticated user',
        ip: req.ip,
      });
      
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
    }

    // Check if user role is in allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      logAuthzFailure(req.user.userId, req.originalUrl, req.method, {
        reason: 'Insufficient permissions',
        userRole: req.user.role,
        requiredRoles: allowedRoles,
        ip: req.ip,
      });
      
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        code: 'AUTHZ_FORBIDDEN',
      });
    }

    next();
  };
}

/**
 * Check if user has specific permission
 * @param {string} permission - Permission required (e.g., 'product:create')
 */
export function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
    }

    const userRole = req.user.role;
    const permissions = rolePermissions[userRole] || [];

    // Check for wildcard permission (admin)
    if (permissions.includes('*')) {
      return next();
    }

    // Check for specific permission
    if (!permissions.includes(permission)) {
      logAuthzFailure(req.user.userId, req.originalUrl, req.method, {
        reason: 'Missing permission',
        required: permission,
        userPermissions: permissions,
      });
      
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        code: 'AUTHZ_FORBIDDEN',
      });
    }

    next();
  };
}

/**
 * Ensure user can only access their own resources
 * @param {string} userIdParam - Name of the user ID parameter in request
 */
export function requireOwnership(userIdParam = 'userId') {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
    }

    // Admin can access all resources
    if (req.user.role === ROLES.ADMIN) {
      return next();
    }

    // Get user ID from params, query, or body
    const resourceUserId = req.params[userIdParam] || 
                          req.query[userIdParam] || 
                          req.body[userIdParam];

    if (req.user.userId !== resourceUserId) {
      logAuthzFailure(req.user.userId, req.originalUrl, req.method, {
        reason: 'Ownership violation',
        attemptedAccess: resourceUserId,
      });
      
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        code: 'AUTHZ_OWNERSHIP_VIOLATION',
      });
    }

    next();
  };
}

export default {
  authorize,
  requirePermission,
  requireOwnership,
  ROLES,
};
