/**
 * Input Validation Utilities
 * OWASP ASVS v5 Section 5: Validation, Sanitization and Encoding
 * Prevents SQL Injection, XSS, Command Injection
 */

import validator from 'validator';
import { sanitizeInput } from './crypto.js';

/**
 * Validation schemas for different entities
 */
export const validationSchemas = {
  user: {
    email: {
      required: true,
      type: 'email',
      maxLength: 255,
    },
    password: {
      required: true,
      type: 'password',
      minLength: 8,
      maxLength: 128,
    },
    role: {
      required: true,
      type: 'enum',
      values: ['ADMIN', 'SELLER', 'BUYER'],
    },
  },
  product: {
    name: {
      required: true,
      type: 'string',
      minLength: 3,
      maxLength: 200,
    },
    description: {
      required: true,
      type: 'string',
      minLength: 10,
      maxLength: 2000,
    },
    price: {
      required: true,
      type: 'number',
      min: 0,
      max: 1000000,
    },
    stock: {
      required: true,
      type: 'integer',
      min: 0,
      max: 100000,
    },
  },
  order: {
    productId: {
      required: true,
      type: 'uuid',
    },
    quantity: {
      required: true,
      type: 'integer',
      min: 1,
      max: 1000,
    },
  },
  payment: {
    orderId: {
      required: true,
      type: 'uuid',
    },
    amount: {
      required: true,
      type: 'number',
      min: 0,
      max: 1000000,
    },
    cardNumber: {
      required: true,
      type: 'creditcard',
    },
  },
};

/**
 * Validate input against schema
 * @param {object} data - Data to validate
 * @param {object} schema - Validation schema
 * @returns {object} - { valid: boolean, errors: array, sanitized: object }
 */
export function validateInput(data, schema) {
  const errors = [];
  const sanitized = {};

  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];

    // Required field check
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push(`${field} is required`);
      continue;
    }

    // Skip validation if field is optional and not provided
    if (!rules.required && (value === undefined || value === null || value === '')) {
      continue;
    }

    // Type validation
    switch (rules.type) {
      case 'email':
        if (!validator.isEmail(value)) {
          errors.push(`${field} must be a valid email`);
        } else {
          sanitized[field] = validator.normalizeEmail(value);
        }
        break;

      case 'password':
        if (typeof value !== 'string' || value.length < rules.minLength) {
          errors.push(`${field} must be at least ${rules.minLength} characters`);
        } else if (value.length > rules.maxLength) {
          errors.push(`${field} must not exceed ${rules.maxLength} characters`);
        } else {
          // Check password complexity
          if (!/[a-z]/.test(value) || !/[A-Z]/.test(value) || !/[0-9]/.test(value)) {
            errors.push(`${field} must contain uppercase, lowercase, and numbers`);
          } else {
            sanitized[field] = value;
          }
        }
        break;

      case 'string':
        if (typeof value !== 'string') {
          errors.push(`${field} must be a string`);
        } else if (rules.minLength && value.length < rules.minLength) {
          errors.push(`${field} must be at least ${rules.minLength} characters`);
        } else if (rules.maxLength && value.length > rules.maxLength) {
          errors.push(`${field} must not exceed ${rules.maxLength} characters`);
        } else {
          sanitized[field] = sanitizeInput(value);
        }
        break;

      case 'number':
        const num = Number(value);
        if (isNaN(num)) {
          errors.push(`${field} must be a number`);
        } else if (rules.min !== undefined && num < rules.min) {
          errors.push(`${field} must be at least ${rules.min}`);
        } else if (rules.max !== undefined && num > rules.max) {
          errors.push(`${field} must not exceed ${rules.max}`);
        } else {
          sanitized[field] = num;
        }
        break;

      case 'integer':
        const int = parseInt(value, 10);
        if (!Number.isInteger(int)) {
          errors.push(`${field} must be an integer`);
        } else if (rules.min !== undefined && int < rules.min) {
          errors.push(`${field} must be at least ${rules.min}`);
        } else if (rules.max !== undefined && int > rules.max) {
          errors.push(`${field} must not exceed ${rules.max}`);
        } else {
          sanitized[field] = int;
        }
        break;

      case 'uuid':
        if (!validator.isUUID(value)) {
          errors.push(`${field} must be a valid UUID`);
        } else {
          sanitized[field] = value;
        }
        break;

      case 'enum':
        if (!rules.values.includes(value)) {
          errors.push(`${field} must be one of: ${rules.values.join(', ')}`);
        } else {
          sanitized[field] = value;
        }
        break;

      case 'creditcard':
        // Remove spaces and dashes
        const cleanCard = value.replace(/[\s-]/g, '');
        if (!validator.isCreditCard(cleanCard)) {
          errors.push(`${field} must be a valid credit card number`);
        } else {
          sanitized[field] = cleanCard;
        }
        break;

      default:
        sanitized[field] = value;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitized,
  };
}

/**
 * SQL Injection prevention - parameterized query validator
 * @param {string} query - SQL query
 * @returns {boolean} - True if query is safe
 */
export function isSafeQuery(query) {
  const dangerousPatterns = [
    /;\s*(drop|delete|update|insert|create|alter)\s+/i,
    /union\s+select/i,
    /--/,
    /\/\*/,
    /xp_/i,
  ];

  return !dangerousPatterns.some((pattern) => pattern.test(query));
}

/**
 * Path traversal prevention
 * @param {string} path - File path
 * @returns {boolean} - True if path is safe
 */
export function isSafePath(path) {
  const dangerousPatterns = [
    /\.\./,
    /~\//,
    /^\//,
    /\\/,
  ];

  return !dangerousPatterns.some((pattern) => pattern.test(path));
}

export default {
  validateInput,
  validationSchemas,
  isSafeQuery,
  isSafePath,
};
