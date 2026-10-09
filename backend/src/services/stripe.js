import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

let stripeInstance = null;

/**
 * Checks if Stripe is configured with real credentials.
 */
export const isStripeConfigured = () => {
  return (
    STRIPE_SECRET_KEY &&
    STRIPE_SECRET_KEY !== 'your_stripe_secret'
  );
};

if (isStripeConfigured()) {
  stripeInstance = new Stripe(STRIPE_SECRET_KEY);
}

/**
 * Creates a Stripe Checkout Session for order payments.
 * @param {Object} order - Order document from database
 * @param {string} frontendUrl - The base URL of the frontend client (for redirects)
 */
export const createStripeSession = async (order, frontendUrl = 'http://localhost:5173') => {
  const isConfigured = isStripeConfigured();
  console.log(`[Stripe Service] Creating payment session for ${order.orderNumber}. Configured: ${isConfigured}`);

  if (!isConfigured) {
    // Return mock success session link redirecting to verify page
    const mockSessionId = `cs_mock_${Math.random().toString(36).substr(2, 9)}`;
    return {
      success: true,
      mode: 'MOCK',
      url: `${frontendUrl}/order-success?orderId=${order._id}&gateway=STRIPE&sessionId=${mockSessionId}`,
      sessionId: mockSessionId
    };
  }

  try {
    const lineItems = order.items.map(item => ({
      price_data: {
        currency: 'inr',
        product_data: {
          name: item.name,
          description: `Color: ${item.color} | Size: ${item.size}`,
          metadata: {
            sku: item.sku,
            variantId: item.variantId.toString()
          }
        },
        unit_amount: Math.round(item.price * 100) // Stripe expects unit price in cents/paise
      },
      quantity: item.quantity
    }));

    const session = await stripeInstance.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      client_reference_id: order._id.toString(),
      customer_email: order.customer.email,
      success_url: `${frontendUrl}/order-success?orderId=${order._id}&gateway=STRIPE&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/cart`,
      metadata: {
        orderNumber: order.orderNumber
      }
    });

    return {
      success: true,
      mode: 'LIVE',
      url: session.url,
      sessionId: session.id
    };
  } catch (error) {
    console.error('[Stripe Service] Error creating checkout session:', error.message);
    throw new Error(`Stripe Payment Session Creation Failed: ${error.message}`);
  }
};
