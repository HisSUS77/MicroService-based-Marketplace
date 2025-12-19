/**
 * Payment Routes
 */

import express from 'express';
import paymentController from '../controllers/payment.controller.js';
import { authenticate } from '../../../shared/middleware/auth.js';
import { authorize, ROLES } from '../../../shared/middleware/rbac.js';

const router = express.Router();

// Process payment (mock)
router.post('/process', authenticate, authorize(ROLES.BUYER, ROLES.ADMIN), paymentController.processPayment);

// Get payment by order ID
router.get('/order/:orderId', authenticate, paymentController.getPaymentByOrderId);

export default router;
