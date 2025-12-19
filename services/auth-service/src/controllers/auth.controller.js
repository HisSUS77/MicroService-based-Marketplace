/**
 * Auth Controller
 * Handles authentication and authorization logic
 * OWASP ASVS Section 2: Authentication Verification Requirements
 */

import { asyncHandler, ValidationError, AuthenticationError, ConflictError } from '../../../shared/middleware/errorHandler.js';
import { validateInput, validationSchemas } from '../../../shared/utils/validation.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../../shared/utils/jwt.js';
import { logAuthEvent, logSecurityEvent } from '../../../shared/utils/logger.js';
import userModel from '../models/user.model.js';

/**
 * Register new user
 * @route POST /auth/register
 */
const register = asyncHandler(async (req, res) => {
  // Validate input
  const validation = validateInput(req.body, validationSchemas.user);
  
  if (!validation.valid) {
    throw new ValidationError('Validation failed', validation.errors);
  }

  const { email, password, role } = validation.sanitized;

  // Check if user already exists
  const existingUser = await userModel.findByEmail(email);
  if (existingUser) {
    throw new ConflictError('User already exists with this email');
  }

  // Create user
  const user = await userModel.create({ email, password, role });

  // Log auth event
  logAuthEvent('register', user.id, true, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Generate tokens
  const accessToken = generateAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  const refreshToken = generateRefreshToken({
    userId: user.id,
  });

  // Store refresh token
  await userModel.storeRefreshToken(user.id, refreshToken);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      accessToken,
      refreshToken,
    },
  });
});

/**
 * Login user
 * @route POST /auth/login
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    throw new ValidationError('Email and password are required');
  }

  // Find user
  const user = await userModel.findByEmail(email);
  
  if (!user) {
    logAuthEvent('login', 'unknown', false, {
      email,
      ip: req.ip,
      reason: 'User not found',
    });
    throw new AuthenticationError('Invalid credentials');
  }

  // Check if account is locked
  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    logSecurityEvent('ACCOUNT_LOCKED_LOGIN_ATTEMPT', {
      userId: user.id,
      ip: req.ip,
    }, 'warn');
    throw new AuthenticationError('Account is temporarily locked');
  }

  // Verify password
  const isValidPassword = await userModel.verifyPassword(user.id, password);
  
  if (!isValidPassword) {
    // Increment failed login attempts
    await userModel.incrementFailedLoginAttempts(user.id);
    
    logAuthEvent('login', user.id, false, {
      ip: req.ip,
      reason: 'Invalid password',
    });
    
    throw new AuthenticationError('Invalid credentials');
  }

  // Reset failed login attempts and update last login
  await userModel.resetFailedLoginAttempts(user.id);
  await userModel.updateLastLogin(user.id);

  // Log successful login
  logAuthEvent('login', user.id, true, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Generate tokens
  const accessToken = generateAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  const refreshToken = generateRefreshToken({
    userId: user.id,
  });

  // Store refresh token
  await userModel.storeRefreshToken(user.id, refreshToken);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      accessToken,
      refreshToken,
    },
  });
});

/**
 * Refresh access token
 * @route POST /auth/refresh
 */
const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new ValidationError('Refresh token is required');
  }

  // Verify refresh token
  const decoded = verifyRefreshToken(refreshToken);

  // Check if token is revoked
  const isValid = await userModel.validateRefreshToken(decoded.userId, refreshToken);
  
  if (!isValid) {
    throw new AuthenticationError('Invalid or revoked refresh token');
  }

  // Get user
  const user = await userModel.findById(decoded.userId);
  
  if (!user) {
    throw new AuthenticationError('User not found');
  }

  // Generate new access token
  const newAccessToken = generateAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  res.json({
    success: true,
    data: {
      accessToken: newAccessToken,
    },
  });
});

/**
 * Logout user
 * @route POST /auth/logout
 */
const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    // Revoke refresh token
    await userModel.revokeRefreshToken(req.user.userId, refreshToken);
  }

  logAuthEvent('logout', req.user.userId, true, {
    ip: req.ip,
  });

  res.json({
    success: true,
    message: 'Logout successful',
  });
});

/**
 * Get current user
 * @route GET /auth/me
 */
const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await userModel.findById(req.user.userId);

  if (!user) {
    throw new AuthenticationError('User not found');
  }

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        createdAt: user.created_at,
        lastLogin: user.last_login,
      },
    },
  });
});

/**
 * Change password
 * @route PUT /auth/password
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Validate input
  const validation = validateInput({ password: newPassword }, {
    password: validationSchemas.user.password,
  });

  if (!validation.valid) {
    throw new ValidationError('Validation failed', validation.errors);
  }

  // Verify current password
  const isValid = await userModel.verifyPassword(req.user.userId, currentPassword);
  
  if (!isValid) {
    logSecurityEvent('PASSWORD_CHANGE_FAILED', {
      userId: req.user.userId,
      reason: 'Invalid current password',
    }, 'warn');
    throw new AuthenticationError('Current password is incorrect');
  }

  // Update password
  await userModel.updatePassword(req.user.userId, newPassword);

  // Revoke all refresh tokens
  await userModel.revokeAllRefreshTokens(req.user.userId);

  logSecurityEvent('PASSWORD_CHANGED', {
    userId: req.user.userId,
  }, 'info');

  res.json({
    success: true,
    message: 'Password changed successfully',
  });
});

export default {
  register,
  login,
  refreshToken,
  logout,
  getCurrentUser,
  changePassword,
};
