/**
 * Payment Controller - Mock Payment Processing
 */

import { asyncHandler, ValidationError, NotFoundError } from '../../../shared/middleware/errorHandler.js';
import { validateInput, validationSchemas } from '../../../shared/utils/validation.js';
import { encrypt, generateToken } from '../../../shared/utils/crypto.js';
import { logSecurityEvent, logDataAccess } from '../../../shared/utils/logger.js';
import paymentModel from '../models/payment.model.js';

const processPayment = asyncHandler(async (req, res) => {
  const validation = validateInput(req.body, validationSchemas.payment);
  if (!validation.valid) {
    throw new ValidationError('Validation failed', validation.errors);
  }

  const { order_id, amount, card_number } = validation.sanitized;

  // Check if payment already exists for this order
  const existingPayment = await paymentModel.findByOrderId(order_id);
  if (existingPayment) {
    throw new ValidationError('Payment already processed for this order');
  }

  // Encrypt card number (AES-256-GCM)
  const encryptedCard = encrypt(card_number);

  // Generate mock transaction ID
  const transactionId = `TXN-${generateToken(16)}`;

  // Mock payment processing - always succeeds for demo
  const payment = await paymentModel.create({
    orderId: order_id,
    userId: req.user.userId,
    amount,
    encryptedCard,
    transactionId,
    status: 'COMPLETED',
  });

  logSecurityEvent('PAYMENT_PROCESSED', {
    userId: req.user.userId,
    orderId: order_id,
    amount,
    transactionId,
  }, 'info');

  logDataAccess(req.user.userId, 'payment', 'create');

  res.status(201).json({
    success: true,
    message: 'Payment processed successfully',
    data: {
      payment: {
        id: payment.id,
        orderId: payment.order_id,
        amount: payment.amount,
        status: payment.status,
        transactionId: payment.transaction_id,
        createdAt: payment.created_at,
      },
    },
  });
});

const getPaymentByOrderId = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const payment = await paymentModel.findByOrderId(orderId);

  if (!payment) {
    throw new NotFoundError('Payment not found');
  }

  // Hide encrypted card details
  const paymentData = {
    id: payment.id,
    orderId: payment.order_id,
    amount: payment.amount,
    status: payment.status,
    transactionId: payment.transaction_id,
    createdAt: payment.created_at,
  };

  res.json({
    success: true,
    data: { payment: paymentData },
  });
});

export default { processPayment, getPaymentByOrderId };
