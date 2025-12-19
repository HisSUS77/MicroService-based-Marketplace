import { query } from '../config/database.js';

async function create(paymentData) {
  const { orderId, userId, amount, encryptedCard, transactionId, status } = paymentData;
  const result = await query(
    `INSERT INTO payments (order_id, user_id, amount, encrypted_card, transaction_id, status)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [orderId, userId, amount, encryptedCard, transactionId, status]
  );
  return result.rows[0];
}

async function findByOrderId(orderId) {
  const result = await query('SELECT * FROM payments WHERE order_id = $1', [orderId]);
  return result.rows[0] || null;
}

async function findById(id) {
  const result = await query('SELECT * FROM payments WHERE id = $1', [id]);
  return result.rows[0] || null;
}

export default { create, findByOrderId, findById };
