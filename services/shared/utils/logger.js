/**
 * Secure Logging Utility
 * OWASP ASVS Section 7: Error Handling and Logging
 * Implements audit logging and sensitive data masking
 */

import winston from 'winston';
import { maskSensitiveData } from './crypto.js';

const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const SERVICE_NAME = process.env.SERVICE_NAME || 'unknown-service';

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create logger instance
const logger = winston.createLogger({
  level: LOG_LEVEL,
  format: logFormat,
  defaultMeta: {
    service: SERVICE_NAME,
    environment: process.env.NODE_ENV || 'development',
  },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
          let msg = `${timestamp} [${service}] ${level}: ${message}`;
          if (Object.keys(meta).length > 0) {
            msg += ` ${JSON.stringify(meta)}`;
          }
          return msg;
        })
      ),
    }),
    new winston.transports.File({
      filename: `logs/${SERVICE_NAME}-error.log`,
      level: 'error',
    }),
    new winston.transports.File({
      filename: `logs/${SERVICE_NAME}-combined.log`,
    }),
  ],
});

/**
 * Mask sensitive fields in log data
 * @param {object} data - Log data
 * @returns {object} - Masked data
 */
function maskSensitiveFields(data) {
  if (!data || typeof data !== 'object') return data;

  const sensitiveFields = [
    'password',
    'token',
    'secret',
    'apiKey',
    'creditCard',
    'cardNumber',
    'cvv',
    'ssn',
  ];

  const masked = { ...data };

  for (const field of sensitiveFields) {
    if (masked[field]) {
      masked[field] = maskSensitiveData(masked[field]);
    }
  }

  return masked;
}

/**
 * Log security event
 * @param {string} eventType - Type of security event
 * @param {object} details - Event details
 * @param {string} severity - Severity level
 */
export function logSecurityEvent(eventType, details = {}, severity = 'warn') {
  const maskedDetails = maskSensitiveFields(details);
  
  logger.log(severity, `SECURITY_EVENT: ${eventType}`, {
    eventType,
    details: maskedDetails,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Log authentication event
 * @param {string} action - Auth action (login, register, logout)
 * @param {string} userId - User ID
 * @param {boolean} success - Whether action succeeded
 * @param {object} metadata - Additional metadata
 */
export function logAuthEvent(action, userId, success, metadata = {}) {
  logSecurityEvent('AUTH_EVENT', {
    action,
    userId: userId || 'unknown',
    success,
    ip: metadata.ip,
    userAgent: metadata.userAgent,
  }, success ? 'info' : 'warn');
}

/**
 * Log authorization failure
 * @param {string} userId - User ID
 * @param {string} resource - Resource being accessed
 * @param {string} action - Action attempted
 * @param {object} metadata - Additional metadata
 */
export function logAuthzFailure(userId, resource, action, metadata = {}) {
  logSecurityEvent('AUTHZ_FAILURE', {
    userId,
    resource,
    action,
    ...metadata,
  }, 'warn');
}

/**
 * Log data access event
 * @param {string} userId - User ID
 * @param {string} resource - Resource accessed
 * @param {string} action - Action performed
 */
export function logDataAccess(userId, resource, action) {
  logger.info('DATA_ACCESS', {
    userId,
    resource,
    action,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Log error with context
 * @param {Error} error - Error object
 * @param {object} context - Error context
 */
export function logError(error, context = {}) {
  const maskedContext = maskSensitiveFields(context);
  
  logger.error('APPLICATION_ERROR', {
    message: error.message,
    stack: error.stack,
    context: maskedContext,
  });
}

/**
 * Log API request
 * @param {object} req - Express request object
 * @param {number} duration - Request duration in ms
 */
export function logRequest(req, duration) {
  logger.http('API_REQUEST', {
    method: req.method,
    path: req.path,
    statusCode: req.res?.statusCode,
    duration: `${duration}ms`,
    userId: req.user?.userId || 'anonymous',
    ip: req.ip,
  });
}

export { logger };

export default {
  logger,
  logSecurityEvent,
  logAuthEvent,
  logAuthzFailure,
  logDataAccess,
  logError,
  logRequest,
};
