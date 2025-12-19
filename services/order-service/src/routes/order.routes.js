/**
 * Order Routes
 */

import express from 'express';
import orderController from '../controllers/order.controller.js';
import { authenticate } from '../../../shared/middleware/auth.js';
import { authorize, ROLES } from '../../../shared/middleware/rbac.js';

const router = express.Router();

// Create new order
router.post('/', authenticate, authorize(ROLES.BUYER, ROLES.ADMIN), orderController.createOrder);

// Get user's orders
router.get('/', authenticate, orderController.getUserOrders);

// Get order by ID
router.get('/:id', authenticate, orderController.getOrderById);

// Get all orders (admin only)
router.get('/all/admin', authenticate, authorize(ROLES.ADMIN), orderController.getAllOrders);

export default router;
