import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const SHIPROCKET_EMAIL = process.env.SHIPROCKET_EMAIL;
const SHIPROCKET_PASSWORD = process.env.SHIPROCKET_PASSWORD;
const SHIPROCKET_BASE_URL = 'https://apiv2.shiprocket.in/v1/external';

let cachedToken = null;
let tokenExpiry = null;

/**
 * Checks if Shiprocket is configured with real credentials.
 */
export const isShiprocketConfigured = () => {
  return (
    SHIPROCKET_EMAIL &&
    SHIPROCKET_EMAIL !== 'your_shiprocket_email' &&
    SHIPROCKET_PASSWORD &&
    SHIPROCKET_PASSWORD !== 'your_shiprocket_password'
  );
};

/**
 * Authenticates with Shiprocket to get a Bearer Token.
 */
export const getShiprocketToken = async () => {
  if (!isShiprocketConfigured()) {
    console.log('[Shiprocket] Using Mock Token (Credentials not configured)');
    return 'mock_shiprocket_token_98765';
  }

  // Token cache check (tokens usually expire in 10 days, let's cache for 24h)
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  try {
    const response = await axios.post(`${SHIPROCKET_BASE_URL}/auth/login`, {
      email: SHIPROCKET_EMAIL,
      password: SHIPROCKET_PASSWORD
    });

    if (response.data && response.data.token) {
      cachedToken = response.data.token;
      tokenExpiry = Date.now() + 24 * 60 * 60 * 1000; // cache 24 hours
      return cachedToken;
    } else {
      throw new Error('Authentication response empty');
    }
  } catch (error) {
    console.error('[Shiprocket Auth] Login failed:', error.message);
    throw new Error(`Shiprocket Login Failed: ${error.message}`);
  }
};

/**
 * Creates an adhoc order in Shiprocket logistics.
 * @param {Object} order - Order document from database
 */
export const createShiprocketOrder = async (order) => {
  const isConfigured = isShiprocketConfigured();
  console.log(`[Shiprocket] Creating logistics shipment for ${order.orderNumber}. Configured: ${isConfigured}`);

  const nameParts = order.customer.name.trim().split(/\s+/);
  const first_name = nameParts[0] || 'Customer';
  const last_name = nameParts.slice(1).join(' ') || ' ';

  // Structure the Shiprocket adhoc order payload
  const payload = {
    order_id: order.orderNumber,
    order_date: new Date(order.createdAt).toISOString().replace('T', ' ').substring(0, 16),
    pickup_location: process.env.SHIPROCKET_PICKUP_LOCATION || 'Primary Warehouse',
    billing_customer_name: first_name,
    billing_last_name: last_name,
    billing_address: order.shippingAddress.streetAddress,
    billing_city: order.shippingAddress.city,
    billing_pincode: order.shippingAddress.pincode,
    billing_state: order.shippingAddress.state,
    billing_country: 'India',
    billing_email: order.customer.email,
    billing_phone: order.customer.phone,
    shipping_is_billing: true,
    order_items: order.items.map(item => ({
      name: item.name,
      sku: item.sku,
      units: item.quantity,
      selling_price: item.price
    })),
    payment_method: order.paymentGateway === 'COD' ? 'COD' : 'Prepaid',
    sub_total: order.totalAmount,
    length: 15, // standard shirt box packaging length in cm
    width: 15,
    height: 5,
    weight: 0.25 * order.items.reduce((sum, item) => sum + item.quantity, 0) // estimate 250g per t-shirt
  };

  if (!isConfigured) {
    console.log('[Shiprocket] [MOCK MODE] Simulated shipment payload:', JSON.stringify(payload, null, 2));
    const mockShipmentId = Math.floor(1000000 + Math.random() * 9000000);
    const mockOrderId = Math.floor(1000000 + Math.random() * 9000000);
    return {
      success: true,
      mode: 'MOCK',
      shipmentId: mockShipmentId,
      shiprocketOrderId: mockOrderId,
      awbCode: `AWB-SR-${mockShipmentId}`,
      message: 'Shipment created successfully in Mock Sandbox'
    };
  }

  try {
    const token = await getShiprocketToken();
    const response = await axios.post(`${SHIPROCKET_BASE_URL}/orders/create/adhoc`, payload, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data && response.data.status_code === 1) {
      const orderDetails = response.data;
      
      // Attempt to auto-assign AWB courier tracking
      let awbCode = null;
      try {
        const awbResponse = await axios.post(`${SHIPROCKET_BASE_URL}/courier/assign/awb`, {
          shipment_id: orderDetails.shipment_id
        }, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (awbResponse.data && awbResponse.data.awb_assign_status === 1) {
          awbCode = awbResponse.data.response.data.awb_code;
        }
      } catch (awbError) {
        console.warn('[Shiprocket AWB] Could not auto-assign AWB:', awbError.message);
      }

      return {
        success: true,
        mode: 'LIVE',
        shipmentId: orderDetails.shipment_id,
        shiprocketOrderId: orderDetails.order_id,
        awbCode,
        message: 'Order created successfully on Shiprocket'
      };
    } else {
      return {
        success: false,
        message: response.data.message || 'Failed to create Shiprocket logistics order'
      };
    }
  } catch (error) {
    console.error('[Shiprocket API] Order Creation Error:', error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message
    };
  }
};
