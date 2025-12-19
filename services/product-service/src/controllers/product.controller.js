/**
 * Product Controller
 * Implements secure product management with RBAC
 */

import { asyncHandler, ValidationError, NotFoundError, AuthorizationError } from '../../../shared/middleware/errorHandler.js';
import { validateInput, validationSchemas } from '../../../shared/utils/validation.js';
import { logDataAccess, logAuthzFailure } from '../../../shared/utils/logger.js';
import productModel from '../models/product.model.js';
import { ROLES } from '../../../shared/middleware/rbac.js';

/**
 * Get all products
 * @route GET /products
 */
const getAllProducts = asyncHandler(async (req, res) => {
  const { category, minPrice, maxPrice, search, page = 1, limit = 20 } = req.query;

  const filters = {
    category,
    minPrice: minPrice ? parseFloat(minPrice) : undefined,
    maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
    search,
  };

  const offset = (parseInt(page) - 1) * parseInt(limit);

  const products = await productModel.findAll(filters, parseInt(limit), offset);
  const total = await productModel.count(filters);

  res.json({
    success: true,
    data: {
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    },
  });
});

/**
 * Get product by ID
 * @route GET /products/:id
 */
const getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const product = await productModel.findById(id);

  if (!product) {
    throw new NotFoundError('Product not found');
  }

  res.json({
    success: true,
    data: { product },
  });
});

/**
 * Create new product
 * @route POST /products
 */
const createProduct = asyncHandler(async (req, res) => {
  // Validate input
  const validation = validateInput(req.body, validationSchemas.product);

  if (!validation.valid) {
    throw new ValidationError('Validation failed', validation.errors);
  }

  const productData = {
    ...validation.sanitized,
    sellerId: req.user.userId,
  };

  const product = await productModel.create(productData);

  logDataAccess(req.user.userId, 'product', 'create');

  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    data: { product },
  });
});

/**
 * Update product
 * @route PUT /products/:id
 */
const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if product exists
  const existingProduct = await productModel.findById(id);

  if (!existingProduct) {
    throw new NotFoundError('Product not found');
  }

  // Check ownership (sellers can only update their own products)
  if (req.user.role === ROLES.SELLER && existingProduct.seller_id !== req.user.userId) {
    logAuthzFailure(req.user.userId, `product/${id}`, 'update', {
      reason: 'Not product owner',
    });
    throw new AuthorizationError('You can only update your own products');
  }

  // Validate input
  const validation = validateInput(req.body, {
    name: validationSchemas.product.name,
    description: validationSchemas.product.description,
    price: validationSchemas.product.price,
    stock: validationSchemas.product.stock,
  });

  if (!validation.valid) {
    throw new ValidationError('Validation failed', validation.errors);
  }

  const product = await productModel.update(id, validation.sanitized);

  logDataAccess(req.user.userId, `product/${id}`, 'update');

  res.json({
    success: true,
    message: 'Product updated successfully',
    data: { product },
  });
});

/**
 * Delete product
 * @route DELETE /products/:id
 */
const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if product exists
  const existingProduct = await productModel.findById(id);

  if (!existingProduct) {
    throw new NotFoundError('Product not found');
  }

  // Check ownership
  if (req.user.role === ROLES.SELLER && existingProduct.seller_id !== req.user.userId) {
    logAuthzFailure(req.user.userId, `product/${id}`, 'delete', {
      reason: 'Not product owner',
    });
    throw new AuthorizationError('You can only delete your own products');
  }

  await productModel.softDelete(id);

  logDataAccess(req.user.userId, `product/${id}`, 'delete');

  res.json({
    success: true,
    message: 'Product deleted successfully',
  });
});

/**
 * Get products by seller
 * @route GET /products/seller/:sellerId
 */
const getProductsBySeller = asyncHandler(async (req, res) => {
  const { sellerId } = req.params;
  const { page = 1, limit = 20 } = req.query;

  const offset = (parseInt(page) - 1) * parseInt(limit);

  const products = await productModel.findBySeller(sellerId, parseInt(limit), offset);
  const total = await productModel.countBySeller(sellerId);

  res.json({
    success: true,
    data: {
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    },
  });
});

export default {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsBySeller,
};
