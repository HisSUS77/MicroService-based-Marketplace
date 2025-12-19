/**
 * Auth Routes
 * Defines authentication endpoints
 */

import express from 'express';
import authController from '../controllers/auth.controller.js';
import { authenticate } from '../../../shared/middleware/auth.js';
import { strictRateLimiter } from '../../../shared/middleware/security.js';

const router = express.Router();

/**
 * @route   POST /auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post('/register', strictRateLimiter, authController.register);

/**
 * @route   POST /auth/login
 * @desc    Authenticate user and get token
 * @access  Public
 */
router.post('/login', strictRateLimiter, authController.login);

/**
 * @route   POST /auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', authController.refreshToken);

/**
 * @route   POST /auth/logout
 * @desc    Logout user and invalidate tokens
 * @access  Private
 */
router.post('/logout', authenticate, authController.logout);

/**
 * @route   GET /auth/me
 * @desc    Get current user info
 * @access  Private
 */
router.get('/me', authenticate, authController.getCurrentUser);

/**
 * @route   PUT /auth/password
 * @desc    Change password
 * @access  Private
 */
router.put('/password', authenticate, authController.changePassword);

export default router;
