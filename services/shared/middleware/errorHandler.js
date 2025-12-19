/**
 * Error Handling Middleware
 * OWASP ASVS Section 7: Error Handling and Logging
 * Prevents information disclosure through error messages
 */

import { logError } from '../utils/logger.js';

/**
 * Global error handler
 * Catches all unhandled errors and returns safe error messages
 */
export function errorHandler(err, req, res, next) {
  // Log the full error with stack trace
  logError(err, {
    method: req.method,
    path: req.path,
    userId: req.user?.userId,
    ip: req.ip,
    body: req.body,
  });

  // Determine status code
  const statusCode = err.statusCode || err.status || 500;

  // Development vs Production error responses
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Create safe error response
  const errorResponse = {
    success: false,
    error: err.message || 'Internal server error',
    code: err.code || 'INTERNAL_ERROR',
    timestamp: new Date().toISOString(),
  };

  // Include validation details if available
  if (err.details && Array.isArray(err.details) && err.details.length > 0) {
    errorResponse.details = err.details;
  }

  // Include stack trace only in development
  if (isDevelopment) {
    errorResponse.stack = err.stack;
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
}

/**
 * 404 Not Found handler
 */
export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: 'Resource not found',
    code: 'RESOURCE_NOT_FOUND',
    path: req.path,
  });
}

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Custom error classes
 */
export class ValidationError extends Error {
  constructor(message, details = []) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
    this.code = 'VALIDATION_ERROR';
    this.details = details;
  }
}

export class AuthenticationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthenticationError';
    this.statusCode = 401;
    this.code = 'AUTHENTICATION_ERROR';
  }
}

export class AuthorizationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthorizationError';
    this.statusCode = 403;
    this.code = 'AUTHORIZATION_ERROR';
  }
}

export class NotFoundError extends Error {
  constructor(message = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
    this.code = 'NOT_FOUND';
  }
}

export class ConflictError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConflictError';
    this.statusCode = 409;
    this.code = 'CONFLICT';
  }
}

export default {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
};
