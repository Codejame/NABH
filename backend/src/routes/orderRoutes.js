import express from 'express';
import Order from '../models/Order.js';
import ProductVariant from '../models/ProductVariant.js';
import AbandonedCart from '../models/AbandonedCart.js';
import { createRazorpayOrder, verifyRazorpaySignature } from '../services/razorpay.js';
import { createQikinkOrder, getQikinkOrderStatus } from '../services/qikink.js';
import { createShiprocketOrder } from '../services/shiprocket.js';
import { sendSMS } from '../services/twilio.js';
import { sendAbandonedCartEmail, sendOrderConfirmationEmail } from '../services/emailService.js';

const router = express.Router();

/**
 * Helper to generate order numbers
 */
const generateOrderNumber = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `NABH-${dateStr}-${rand}`;
};

/**
 * @route POST /api/orders/create-payment
 * @desc Validate cart, create internal order, and create Razorpay payment order
 */
router.post('/create-payment', async (req, res) => {
  try {
    const { items, customer, shippingAddress } = req.body;

    if (!items || items.length === 0 || !customer || !shippingAddress) {
      return res.status(400).json({ message: 'Missing order details' });
    }

    // Server-side price validation
    let totalAmount = 0;
    const validatedItems = [];

    for (const item of items) {
      const variant = await ProductVariant.findById(item.variantId).populate('productId');
      if (!variant) {
        return res.status(404).json({ message: `Product variant not found: ${item.variantId}` });
      }

      if (variant.inventory < item.quantity) {
        return res.status(400).json({ message: `Insufficient inventory for variant SKU: ${variant.sku}` });
      }

      const itemTotal = variant.price * item.quantity;
      totalAmount += itemTotal;

      validatedItems.push({
        variantId: variant._id,
        sku: variant.sku,
        name: variant.productId.name,
        color: variant.color,
        size: variant.size,
        quantity: item.quantity,
        price: variant.price,
        mrp: variant.mrp
      });
    }

    const orderNumber = generateOrderNumber();

    // Create the Razorpay Order node
    const paymentOrder = await createRazorpayOrder(totalAmount, orderNumber);

    if (!paymentOrder.success) {
      return res.status(500).json({ message: 'Failed to initialize payment gateway' });
    }

    // Save initial Order record (PENDING)
    const newOrder = await Order.create({
      orderNumber,
      customer,
      shippingAddress,
      items: validatedItems,
      totalAmount,
      paymentStatus: 'PENDING',
      paymentGateway: 'RAZORPAY',
      paymentId: paymentOrder.orderId, // Temp store razorpay order id
      fulfillmentStatus: 'PENDING'
    });

    res.json({
      success: true,
      order: newOrder,
      paymentOrder // Contains orderId, amount, currency, keyId
    });

  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ message: 'Failed to initiate order', error: error.message });
  }
});

/**
 * @route POST /api/orders/verify-payment
 * @desc Verify gateway signature, mark order as PAID, and push to Qikink
 */
router.post('/verify-payment', async (req, res) => {
  try {
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order record not found' });
    }

    // Cryptographic signature check
    const isSignatureValid = verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);

    if (!isSignatureValid) {
      order.paymentStatus = 'FAILED';
      await order.save();
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    // 1. Update local database order status to PAID
    order.paymentStatus = 'PAID';
    order.paymentId = razorpayPaymentId;
    await order.save();

    // 2. Reduce Variant Inventory levels
    for (const item of order.items) {
      await ProductVariant.findByIdAndUpdate(item.variantId, {
        $inc: { inventory: -item.quantity }
      });
    }

    // 3. Immediately dispatch order to fulfillment provider
    const provider = process.env.FULFILLMENT_PROVIDER || 'QIKINK';

    if (provider.toUpperCase() === 'SHIPROCKET') {
      const shiprocketResult = await createShiprocketOrder(order);
      if (shiprocketResult.success) {
        order.fulfillmentStatus = 'SENT_TO_QIKINK'; // using standard label for UI
        order.qikinkOrderId = `SR-${shiprocketResult.shiprocketOrderId}`;
        order.trackingNumber = shiprocketResult.awbCode || `SR-SHIP-${shiprocketResult.shipmentId}`;
        order.trackingStatus = 'AWB Assigned';
        await order.save();
        console.log(`[Orders API] Order ${order.orderNumber} successfully sent to Shiprocket. Shipment ID: ${shiprocketResult.shipmentId}`);
      } else {
        order.fulfillmentStatus = 'PENDING';
        await order.save();
        console.error(`[Orders API] Shiprocket placement failed for ${order.orderNumber}: ${shiprocketResult.message}`);
      }
    } else {
      const qikinkResult = await createQikinkOrder(order);
      if (qikinkResult.success) {
        order.fulfillmentStatus = 'SENT_TO_QIKINK';
        order.qikinkOrderId = qikinkResult.qikinkOrderId;
        order.trackingNumber = qikinkResult.trackingNumber;
        order.trackingStatus = qikinkResult.trackingStatus || 'Pending Print';
        await order.save();
        console.log(`[Orders API] Order ${order.orderNumber} successfully sent to Qikink. Qikink ID: ${qikinkResult.qikinkOrderId}`);
      } else {
        order.fulfillmentStatus = 'PENDING';
        await order.save();
        console.error(`[Orders API] Qikink order placement failed for ${order.orderNumber}: ${qikinkResult.message}`);
      }
    }

    // 4. Send SMS & Email Confirmation (Asynchronous/Non-blocking)
    if (order.paymentStatus === 'PAID') {
      const messageBody = `Hi ${order.customer.name}, your NABH Wear order ${order.orderNumber} of Rs. ${order.totalAmount} is confirmed! Tracking: ${order.trackingNumber || 'Awaiting dispatch'}. Wear Your Identity!`;
      sendSMS(order.customer.phone, messageBody).catch(err => console.error('[SMS Trigger] Error sending text:', err.message));
      
      // Branded HTML Invoice Email
      if (order.customer?.email) {
        sendOrderConfirmationEmail(order).catch(err => console.error('[Email Trigger] Error sending invoice email:', err.message));
      }
    }

    // 5. Mark any matching abandoned carts as recovered
    if (order.customer?.email) {
      AbandonedCart.updateMany(
        { email: order.customer.email.toLowerCase().trim(), status: 'ABANDONED' },
        { $set: { status: 'RECOVERED' } }
      ).catch(e => console.warn('[Abandoned Cart Recover Sync]:', e.message));
    }

    res.json({
      success: true,
      message: 'Payment verified and order processed',
      order
    });

  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ message: 'Verification error', error: error.message });
  }
});

/**
 * @route GET /api/orders/track-lookup
 * @desc Search order by orderNumber, phone, or email and sync tracking details
 */
router.get('/track-lookup', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ message: 'Search query required' });
    }

    const trimmed = query.trim();
    // Search by orderNumber, phone, or email
    const order = await Order.findOne({
      $or: [
        { orderNumber: { $regex: new RegExp(`^${trimmed}$`, 'i') } },
        { 'customer.phone': trimmed },
        { 'customer.email': { $regex: new RegExp(`^${trimmed}$`, 'i') } }
      ]
    }).sort({ createdAt: -1 });

    if (!order) {
      return res.status(404).json({ message: 'No order found matching your search' });
    }

    if (order.qikinkOrderId) {
      const trackingInfo = await getQikinkOrderStatus(order.orderNumber, order.qikinkOrderId);
      if (trackingInfo.success) {
        order.trackingStatus = trackingInfo.status;
        if (trackingInfo.trackingNumber) {
          order.trackingNumber = trackingInfo.trackingNumber;
        }
        const qkStatus = trackingInfo.status.toLowerCase();
        if (qkStatus.includes('print') || qkStatus.includes('processing')) {
          order.fulfillmentStatus = 'PRINTING';
        } else if (qkStatus.includes('ship') || qkStatus.includes('transit')) {
          order.fulfillmentStatus = 'SHIPPED';
        } else if (qkStatus.includes('deliv')) {
          order.fulfillmentStatus = 'DELIVERED';
        } else if (qkStatus.includes('cancel')) {
          order.fulfillmentStatus = 'CANCELLED';
        }
        await order.save();
      }
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Error searching order', error: error.message });
  }
});

/**
 * @route GET /api/orders/:id
 * @desc Get order details
 */
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error retrieving order', error: error.message });
  }
});

/**
 * @route POST /api/orders/stripe/create-session
 * @desc Create a Stripe checkout session
 */
router.post('/stripe/create-session', async (req, res) => {
  try {
    const { items, customer, shippingAddress } = req.body;

    if (!items || items.length === 0 || !customer || !shippingAddress) {
      return res.status(400).json({ message: 'Missing order details' });
    }

    // Validate pricing
    let totalAmount = 0;
    const validatedItems = [];

    for (const item of items) {
      const variant = await ProductVariant.findById(item.variantId).populate('productId');
      if (!variant) return res.status(404).json({ message: 'Variant not found' });
      
      totalAmount += variant.price * item.quantity;
      validatedItems.push({
        variantId: variant._id,
        sku: variant.sku,
        name: variant.productId.name,
        color: variant.color,
        size: variant.size,
        quantity: item.quantity,
        price: variant.price,
        mrp: variant.mrp
      });
    }

    const orderNumber = `NABH-${Date.now()}`;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    // Save order as PENDING
    const newOrder = await Order.create({
      orderNumber,
      customer,
      shippingAddress,
      items: validatedItems,
      totalAmount,
      paymentStatus: 'PENDING',
      paymentGateway: 'STRIPE',
      fulfillmentStatus: 'PENDING'
    });

    const session = await createStripeSession(newOrder, frontendUrl);

    // Save sessionId to order temporarily
    newOrder.paymentId = session.sessionId;
    await newOrder.save();

    res.json({
      success: true,
      url: session.url,
      order: newOrder
    });

  } catch (error) {
    res.status(500).json({ message: 'Stripe setup failed', error: error.message });
  }
});

/**
 * @route POST /api/orders/stripe/verify-payment
 * @desc Confirm Stripe payment, trigger stock deductions, fulfillments, and SMS alerts
 */
router.post('/stripe/verify-payment', async (req, res) => {
  try {
    const { orderId, sessionId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Validate payment session status
    let isPaid = false;
    if (!isStripeConfigured()) {
      isPaid = true; // sandbox mock validation
    } else {
      const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
      const session = await stripeInstance.checkout.sessions.retrieve(sessionId);
      if (session.payment_status === 'paid') {
        isPaid = true;
      }
    }

    if (!isPaid) {
      order.paymentStatus = 'FAILED';
      await order.save();
      return res.status(400).json({ success: false, message: 'Stripe payment not verified' });
    }

    // 1. Mark as PAID
    order.paymentStatus = 'PAID';
    order.paymentId = sessionId;
    await order.save();

    // 2. Reduce Variant Inventory
    for (const item of order.items) {
      await ProductVariant.findByIdAndUpdate(item.variantId, {
        $inc: { inventory: -item.quantity }
      });
    }

    // 3. Fulfill order
    const provider = process.env.FULFILLMENT_PROVIDER || 'QIKINK';
    if (provider.toUpperCase() === 'SHIPROCKET') {
      const shiprocketResult = await createShiprocketOrder(order);
      if (shiprocketResult.success) {
        order.fulfillmentStatus = 'SENT_TO_QIKINK';
        order.qikinkOrderId = `SR-${shiprocketResult.shiprocketOrderId}`;
        order.trackingNumber = shiprocketResult.awbCode || `SR-SHIP-${shiprocketResult.shipmentId}`;
        order.trackingStatus = 'AWB Assigned';
        await order.save();
      }
    } else {
      const qikinkResult = await createQikinkOrder(order);
      if (qikinkResult.success) {
        order.fulfillmentStatus = 'SENT_TO_QIKINK';
        order.qikinkOrderId = qikinkResult.qikinkOrderId;
        order.trackingNumber = qikinkResult.trackingNumber;
        order.trackingStatus = qikinkResult.trackingStatus || 'Pending Print';
        await order.save();
      }
    }

    // 4. Twilio Notification
    const messageBody = `Hi ${order.customer.name}, your NABH Wear order ${order.orderNumber} of Rs. ${order.totalAmount} is confirmed via Stripe! Wear Your Identity!`;
    sendSMS(order.customer.phone, messageBody).catch(err => console.error('[Stripe SMS] Error:', err.message));

    // 5. Mark abandoned cart recovered
    if (order.customer?.email) {
      AbandonedCart.updateMany(
        { email: order.customer.email.toLowerCase().trim(), status: 'ABANDONED' },
        { $set: { status: 'RECOVERED' } }
      ).catch(e => console.warn('[Abandoned Cart Recover Sync]:', e.message));
    }

    res.json({ success: true, message: 'Stripe checkout verified', order });
  } catch (error) {
    res.status(500).json({ message: 'Stripe verify failed', error: error.message });
  }
});

/**
 * @route POST /api/orders/create-cod
 * @desc Cash on Delivery is disabled - only online payments are accepted
 */
router.post('/create-cod', (req, res) => {
  return res.status(403).json({
    success: false,
    message: 'Cash on Delivery is currently disabled. Please use Online Payment (UPI, Cards, NetBanking).'
  });
});

/**
 * @route POST /api/orders/create-cod-disabled
 */
router.post('/create-cod-disabled', async (req, res) => {
  try {
    const { items, customer, shippingAddress } = req.body;

    if (!items || items.length === 0 || !customer || !shippingAddress) {
      return res.status(400).json({ message: 'Missing order details' });
    }

    // Validate inventory & calculate total
    let totalAmount = 0;
    const validatedItems = [];

    for (const item of items) {
      const variant = await ProductVariant.findById(item.variantId).populate('productId');
      if (!variant) {
        return res.status(404).json({ message: `Product variant not found: ${item.variantId}` });
      }

      if (variant.inventory < item.quantity) {
        return res.status(400).json({ message: `Insufficient inventory for variant SKU: ${variant.sku}` });
      }

      const itemTotal = variant.price * item.quantity;
      totalAmount += itemTotal;

      validatedItems.push({
        variantId: variant._id,
        sku: variant.sku,
        name: variant.productId.name,
        color: variant.color,
        size: variant.size,
        quantity: item.quantity,
        price: variant.price,
        mrp: variant.mrp
      });
    }

    const orderNumber = generateOrderNumber();

    // 1. Create COD Order
    const newOrder = await Order.create({
      orderNumber,
      customer,
      shippingAddress,
      items: validatedItems,
      totalAmount,
      paymentStatus: 'PENDING',
      paymentGateway: 'COD',
      fulfillmentStatus: 'PENDING'
    });

    // 2. Reduce Variant Inventory
    for (const item of validatedItems) {
      await ProductVariant.findByIdAndUpdate(item.variantId, {
        $inc: { inventory: -item.quantity }
      });
    }

    // 3. Dispatch to fulfillment provider (Qikink / Shiprocket with COD flag)
    const provider = process.env.FULFILLMENT_PROVIDER || 'QIKINK';

    if (provider.toUpperCase() === 'SHIPROCKET') {
      const shiprocketResult = await createShiprocketOrder(newOrder);
      if (shiprocketResult.success) {
        newOrder.fulfillmentStatus = 'SENT_TO_QIKINK';
        newOrder.qikinkOrderId = `SR-${shiprocketResult.shiprocketOrderId}`;
        newOrder.trackingNumber = shiprocketResult.awbCode || `SR-SHIP-${shiprocketResult.shipmentId}`;
        newOrder.trackingStatus = 'AWB Assigned';
        await newOrder.save();
      }
    } else {
      const qikinkResult = await createQikinkOrder(newOrder);
      if (qikinkResult.success) {
        newOrder.fulfillmentStatus = 'SENT_TO_QIKINK';
        newOrder.qikinkOrderId = qikinkResult.qikinkOrderId;
        newOrder.trackingNumber = qikinkResult.trackingNumber;
        newOrder.trackingStatus = qikinkResult.trackingStatus || 'Pending Print';
        await newOrder.save();
      }
    }

    // 4. Send SMS Confirmation (Non-blocking)
    const messageBody = `Hi ${newOrder.customer.name}, your NABH Wear COD order ${newOrder.orderNumber} of Rs. ${newOrder.totalAmount} is confirmed! Please keep cash ready at delivery. Wear Your Identity!`;
    sendSMS(newOrder.customer.phone, messageBody).catch(err => console.error('[COD SMS] Error:', err.message));

    // 5. Mark abandoned cart recovered
    if (newOrder.customer?.email) {
      AbandonedCart.updateMany(
        { email: newOrder.customer.email.toLowerCase().trim(), status: 'ABANDONED' },
        { $set: { status: 'RECOVERED' } }
      ).catch(e => console.warn('[Abandoned Cart Recover Sync]:', e.message));
    }

    res.json({
      success: true,
      message: 'COD order placed successfully',
      order: newOrder
    });

  } catch (error) {
    console.error('COD placement error:', error);
    res.status(500).json({ message: 'Failed to place COD order', error: error.message });
  }
});

/**
 * @route POST /api/orders/abandoned-cart
 * @desc Upsert an abandoned cart snapshot when customer enters checkout details
 */
router.post('/abandoned-cart', async (req, res) => {
  try {
    const { email, phone, name, items, totalAmount, shippingAddress } = req.body;
    if (!email || !items || items.length === 0) {
      return res.status(400).json({ message: 'Email and cart items are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const recoveryToken = Math.random().toString(36).substring(2, 12);

    const cart = await AbandonedCart.findOneAndUpdate(
      { email: normalizedEmail, status: 'ABANDONED' },
      {
        email: normalizedEmail,
        phone: phone || '',
        name: name || '',
        items,
        totalAmount: totalAmount || items.reduce((sum, i) => sum + (i.price * i.quantity), 0),
        shippingAddress: shippingAddress || {},
        recoveryToken,
        status: 'ABANDONED'
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ success: true, cartId: cart._id });
  } catch (err) {
    console.error('[Abandoned Cart Save Error]:', err.message);
    res.status(500).json({ message: 'Failed to record cart', error: err.message });
  }
});

/**
 * @route GET /api/orders/abandoned-carts
 * @desc Get abandoned carts list for admin analysis
 */
router.get('/abandoned-carts', async (req, res) => {
  try {
    const carts = await AbandonedCart.find().sort({ updatedAt: -1 }).limit(100);
    res.json(carts);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch abandoned carts', error: err.message });
  }
});

/**
 * @route POST /api/orders/abandoned-cart/:id/send-recovery
 * @desc Trigger an abandoned cart recovery email
 */
router.post('/abandoned-cart/:id/send-recovery', async (req, res) => {
  try {
    const cart = await AbandonedCart.findById(req.params.id);
    if (!cart) {
      return res.status(404).json({ message: 'Abandoned cart record not found' });
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const checkoutUrl = `${frontendUrl}/checkout?recover=${cart._id}`;

    const emailResult = await sendAbandonedCartEmail(
      cart.email,
      cart.name,
      cart.items,
      cart.totalAmount,
      checkoutUrl
    );

    cart.emailSent = true;
    cart.emailSentAt = new Date();
    await cart.save();

    res.json({
      success: true,
      message: `Recovery email sent to ${cart.email}`,
      emailResult
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to send recovery email', error: err.message });
  }
});

export default router;
