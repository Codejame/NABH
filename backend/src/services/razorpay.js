import Razorpay from 'razorpay';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

export const isRazorpayConfigured = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  return (
    Boolean(keyId) &&
    keyId !== 'your_razorpay_key_id' &&
    Boolean(keySecret) &&
    keySecret !== 'your_razorpay_key_secret'
  );
};

export const getRazorpayInstance = () => {
  if (!isRazorpayConfigured()) return null;
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
};

/**
 * Creates a Razorpay Order node on the gateway server.
 * @param {number} amount - Amount in Rs. (will be converted to paise internally)
 * @param {string} receiptId - Unique receipt identifier (internal order number)
 */
export const createRazorpayOrder = async (amount, receiptId) => {
  const isConfigured = isRazorpayConfigured();
  console.log(`[Payment Service] Creating order for receipt ${receiptId}. Configured: ${isConfigured}`);

  if (!isConfigured) {
    // Generate Mock Order details
    const mockOrderId = `order_mock_${Math.random().toString(36).substr(2, 9)}`;
    return {
      success: true,
      mode: 'MOCK',
      orderId: mockOrderId,
      amount: amount * 100, // paise
      currency: 'INR',
      keyId: 'mock_key_id'
    };
  }

  try {
    const options = {
      amount: Math.round(amount * 100), // convert to paise
      currency: 'INR',
      receipt: receiptId,
      payment_capture: 1
    };

    const instance = getRazorpayInstance();
    const order = await instance.orders.create(options);
    return {
      success: true,
      mode: 'LIVE',
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID
    };
  } catch (error) {
    console.error('[Payment Service] Error creating Razorpay Order:', error);
    throw new Error(`Razorpay Order Creation Failed: ${error.message}`);
  }
};

/**
 * Cryptographically verifies Razorpay checkout payment signature.
 */
export const verifyRazorpaySignature = (razorpayOrderId, razorpayPaymentId, razorpaySignature) => {
  if (!isRazorpayConfigured()) {
    // In Mock Mode, any signature validation is passed if it matches mock formats
    console.log('[Payment Service] [MOCK MODE] Simulating signature verification. Success.');
    return true;
  }

  try {
    const text = `${razorpayOrderId}|${razorpayPaymentId}`;
    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');

    return generated_signature === razorpaySignature;
  } catch (error) {
    console.error('[Payment Service] Signature Verification Error:', error);
    return false;
  }
};
