import { query } from '../config/database.js';

async function create(orderData) {
  const { userId, productId, quantity, totalAmount, shippingAddress } = orderData;
  const result = await query(
    `INSERT INTO orders (user_id, product_id, quantity, total_amount, shipping_address, status)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [userId, productId, quantity, totalAmount, shippingAddress || '', 'PENDING']
  );
  return result.rows[0];
}

async function findByUser(userId) {
  const result = await query(
    'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return result.rows;
}

async function findById(id) {
  const result = await query('SELECT * FROM orders WHERE id = $1', [id]);
  return result.rows[0] || null;
}

async function findAll() {
  const result = await query('SELECT * FROM orders ORDER BY created_at DESC');
  return result.rows;
}

async function updateStatus(id, status) {
  const result = await query(
    'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
    [status, id]
  );
  return result.rows[0];
}

export default { create, findByUser, findById, findAll, updateStatus };
