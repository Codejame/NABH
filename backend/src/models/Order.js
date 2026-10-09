import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    customer: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
    },
    shippingAddress: {
      streetAddress: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      country: { type: String, default: 'India' },
    },
    items: [
      {
        variantId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant', required: true },
        sku: { type: String, required: true },
        name: { type: String, required: true },
        color: { type: String, required: true },
        size: { type: String, required: true },
        quantity: { type: Number, required: true, default: 1 },
        price: { type: Number, required: true },
        mrp: { type: Number, required: true },
      },
    ],
    totalAmount: { type: Number, required: true },
    paymentStatus: { type: String, required: true, default: 'PENDING' },
    paymentGateway: { type: String, required: true, default: 'RAZORPAY' },
    paymentId: { type: String },
    fulfillmentStatus: { type: String, required: true, default: 'PENDING' },
    qikinkOrderId: { type: String },
    trackingNumber: { type: String },
    trackingStatus: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);
