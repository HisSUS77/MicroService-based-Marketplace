/**
 * Security Middleware
 * Implements defense-in-depth security controls
 * OWASP ASVS v5 Compliant
 */

import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import { logSecurityEvent } from '../utils/logger.js';

/**
 * Configure Helmet for security headers
 */
export function configureHelmet() {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    frameguard: {
      action: 'deny',
    },
    noSniff: true,
    xssFilter: true,
  });
}

/**
 * Rate limiting middleware - DDoS protection
 */
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later',
  handler: (req, res) => {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', {
      ip: req.ip,
      path: req.path,
      userAgent: req.get('user-agent'),
    }, 'warn');

    res.status(429).json({
      success: false,
      error: 'Too many requests',
      code: 'RATE_LIMIT_EXCEEDED',
    });
  },
});

/**
 * Strict rate limiter for sensitive endpoints (auth)
 */
export const strictRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  skipSuccessfulRequests: true,
  message: 'Too many failed attempts, please try again later',
});

/**
 * NoSQL injection prevention
 */
export function preventNoSQLInjection() {
  return mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
      logSecurityEvent('NOSQL_INJECTION_ATTEMPT', {
        ip: req.ip,
        path: req.path,
        key,
      }, 'warn');
    },
  });
}

/**
 * CORS configuration
 */
export function configureCORS() {
  return (req, res, next) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:8000',
    ];

    const origin = req.headers.origin;
    
    // In development/demo, allow all origins
    if (process.env.NODE_ENV === 'production' && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else if (process.env.NODE_ENV !== 'production') {
      // Allow all origins in non-production
      res.setHeader('Access-Control-Allow-Origin', origin || '*');
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours

    // Handle preflight
    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }

    next();
  };
}

/**
 * Request sanitization middleware
 */
export function sanitizeRequest(req, res, next) {
  // Remove any potential XSS in query parameters
  if (req.query) {
    Object.keys(req.query).forEach((key) => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = req.query[key].replace(/[<>]/g, '');
      }
    });
  }

  next();
}

/**
 * Security event logging middleware
 */
export function logSecurityEvents(req, res, next) {
  // Log suspicious patterns
  const suspiciousPatterns = [
    /(\.\.|~)/,  // Path traversal
    /<script/i,  // XSS
    /union.*select/i,  // SQL injection
    /javascript:/i,  // XSS
  ];

  const fullUrl = `${req.path}${req.url}`;
  const body = JSON.stringify(req.body);

  suspiciousPatterns.forEach((pattern) => {
    if (pattern.test(fullUrl) || pattern.test(body)) {
      logSecurityEvent('SUSPICIOUS_REQUEST', {
        ip: req.ip,
        path: req.path,
        method: req.method,
        pattern: pattern.toString(),
        userAgent: req.get('user-agent'),
      }, 'warn');
    }
  });

  next();
}

export default {
  configureHelmet,
  rateLimiter,
  strictRateLimiter,
  preventNoSQLInjection,
  configureCORS,
  sanitizeRequest,
  logSecurityEvents,
};
