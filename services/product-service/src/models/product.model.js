/**
 * Product Model
 * Handles product data operations
 */

import { query } from '../config/database.js';

/**
 * Create new product
 */
async function create(productData) {
  const { name, description, price, stock, sellerId, category, imageUrl } = productData;

  const result = await query(
    `INSERT INTO products (name, description, price, stock, seller_id, category, image_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [name, description, price, stock, sellerId, category || null, imageUrl || null]
  );

  return result.rows[0];
}

/**
 * Find all products with filters
 */
async function findAll(filters = {}, limit = 20, offset = 0) {
  let queryText = 'SELECT * FROM products WHERE is_active = true';
  const params = [];
  let paramCount = 0;

  if (filters.category) {
    paramCount++;
    queryText += ` AND category = $${paramCount}`;
    params.push(filters.category);
  }

  if (filters.minPrice !== undefined) {
    paramCount++;
    queryText += ` AND price >= $${paramCount}`;
    params.push(filters.minPrice);
  }

  if (filters.maxPrice !== undefined) {
    paramCount++;
    queryText += ` AND price <= $${paramCount}`;
    params.push(filters.maxPrice);
  }

  if (filters.search) {
    paramCount++;
    queryText += ` AND (name ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
    params.push(`%${filters.search}%`);
  }

  queryText += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
  params.push(limit, offset);

  const result = await query(queryText, params);
  return result.rows;
}

/**
 * Count products with filters
 */
async function count(filters = {}) {
  let queryText = 'SELECT COUNT(*) FROM products WHERE is_active = true';
  const params = [];
  let paramCount = 0;

  if (filters.category) {
    paramCount++;
    queryText += ` AND category = $${paramCount}`;
    params.push(filters.category);
  }

  if (filters.minPrice !== undefined) {
    paramCount++;
    queryText += ` AND price >= $${paramCount}`;
    params.push(filters.minPrice);
  }

  if (filters.maxPrice !== undefined) {
    paramCount++;
    queryText += ` AND price <= $${paramCount}`;
    params.push(filters.maxPrice);
  }

  if (filters.search) {
    paramCount++;
    queryText += ` AND (name ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
    params.push(`%${filters.search}%`);
  }

  const result = await query(queryText, params);
  return parseInt(result.rows[0].count);
}

/**
 * Find product by ID
 */
async function findById(id) {
  const result = await query(
    'SELECT * FROM products WHERE id = $1 AND is_active = true',
    [id]
  );
  return result.rows[0] || null;
}

/**
 * Find products by seller
 */
async function findBySeller(sellerId, limit = 20, offset = 0) {
  const result = await query(
    `SELECT * FROM products 
     WHERE seller_id = $1 AND is_active = true 
     ORDER BY created_at DESC 
     LIMIT $2 OFFSET $3`,
    [sellerId, limit, offset]
  );
  return result.rows;
}

/**
 * Count products by seller
 */
async function countBySeller(sellerId) {
  const result = await query(
    'SELECT COUNT(*) FROM products WHERE seller_id = $1 AND is_active = true',
    [sellerId]
  );
  return parseInt(result.rows[0].count);
}

/**
 * Update product
 */
async function update(id, productData) {
  const { name, description, price, stock } = productData;

  const result = await query(
    `UPDATE products 
     SET name = COALESCE($1, name),
         description = COALESCE($2, description),
         price = COALESCE($3, price),
         stock = COALESCE($4, stock),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $5 AND is_active = true
     RETURNING *`,
    [name, description, price, stock, id]
  );

  return result.rows[0];
}

/**
 * Soft delete product
 */
async function softDelete(id) {
  await query(
    'UPDATE products SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
    [id]
  );
}

/**
 * Update stock
 */
async function updateStock(id, quantity) {
  const result = await query(
    `UPDATE products 
     SET stock = stock + $1,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $2 AND is_active = true
     RETURNING *`,
    [quantity, id]
  );
  return result.rows[0];
}

/**
 * Check if product has sufficient stock
 */
async function hasStock(id, quantity) {
  const result = await query(
    'SELECT stock FROM products WHERE id = $1 AND is_active = true',
    [id]
  );
  
  if (result.rows.length === 0) return false;
  return result.rows[0].stock >= quantity;
}

export default {
  create,
  findAll,
  count,
  findById,
  findBySeller,
  countBySeller,
  update,
  softDelete,
  updateStock,
  hasStock,
};
