/**
 * Order Controller
 */

import axios from 'axios';
import { asyncHandler, ValidationError, NotFoundError } from '../../../shared/middleware/errorHandler.js';
import { validateInput, validationSchemas } from '../../../shared/utils/validation.js';
import { logDataAccess } from '../../../shared/utils/logger.js';
import orderModel from '../models/order.model.js';
import { ROLES } from '../../../shared/middleware/rbac.js';

const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002';

const createOrder = asyncHandler(async (req, res) => {
  const validation = validateInput(req.body, validationSchemas.order);
  if (!validation.valid) {
    throw new ValidationError('Validation failed', validation.errors);
  }

  const { productId, quantity } = validation.sanitized;

  // Fetch product details
  const productResponse = await axios.get(`${PRODUCT_SERVICE_URL}/products/${productId}`);
  const product = productResponse.data.data.product;

  if (!product) {
    throw new NotFoundError('Product not found');
  }

  if (product.stock < quantity) {
    throw new ValidationError('Insufficient stock');
  }

  const totalAmount = product.price * quantity;

  const order = await orderModel.create({
    userId: req.user.userId,
    productId,
    quantity,
    totalAmount,
  });

  logDataAccess(req.user.userId, 'order', 'create');

  res.status(201).json({
    success: true,
    message: 'Order created successfully',
    data: { order },
  });
});

const getUserOrders = asyncHandler(async (req, res) => {
  const orders = await orderModel.findByUser(req.user.userId);
  res.json({
    success: true,
    data: { orders },
  });
});

const getOrderById = asyncHandler(async (req, res) => {
  const order = await orderModel.findById(req.params.id);
  if (!order) {
    throw new NotFoundError('Order not found');
  }

  // Check ownership
  if (req.user.role !== ROLES.ADMIN && order.user_id !== req.user.userId) {
    throw new ValidationError('Access denied');
  }

  res.json({
    success: true,
    data: { order },
  });
});

const getAllOrders = asyncHandler(async (req, res) => {
  const orders = await orderModel.findAll();
  res.json({
    success: true,
    data: { orders },
  });
});

export default { createOrder, getUserOrders, getOrderById, getAllOrders };
