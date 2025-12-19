/**
 * Product Routes
 * Implements RBAC for product operations
 */

import express from 'express';
import productController from '../controllers/product.controller.js';
import { authenticate } from '../../../shared/middleware/auth.js';
import { authorize, ROLES } from '../../../shared/middleware/rbac.js';

const router = express.Router();

/**
 * @route   GET /products
 * @desc    Get all products (public)
 * @access  Public
 */
router.get('/', productController.getAllProducts);

/**
 * @route   GET /products/:id
 * @desc    Get product by ID
 * @access  Public
 */
router.get('/:id', productController.getProductById);

/**
 * @route   POST /products
 * @desc    Create new product
 * @access  Private (SELLER, ADMIN)
 */
router.post(
  '/',
  authenticate,
  authorize(ROLES.SELLER, ROLES.ADMIN),
  productController.createProduct
);

/**
 * @route   PUT /products/:id
 * @desc    Update product
 * @access  Private (SELLER - own products, ADMIN)
 */
router.put(
  '/:id',
  authenticate,
  authorize(ROLES.SELLER, ROLES.ADMIN),
  productController.updateProduct
);

/**
 * @route   DELETE /products/:id
 * @desc    Delete product
 * @access  Private (SELLER - own products, ADMIN)
 */
router.delete(
  '/:id',
  authenticate,
  authorize(ROLES.SELLER, ROLES.ADMIN),
  productController.deleteProduct
);

/**
 * @route   GET /products/seller/:sellerId
 * @desc    Get products by seller
 * @access  Public
 */
router.get('/seller/:sellerId', productController.getProductsBySeller);

export default router;
