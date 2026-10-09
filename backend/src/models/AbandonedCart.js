import mongoose from 'mongoose';

const AbandonedCartSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true
    },
    phone: {
      type: String,
      default: '',
      trim: true
    },
    name: {
      type: String,
      default: '',
      trim: true
    },
    items: [
      {
        variantId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant' },
        sku: String,
        name: String,
        color: String,
        size: String,
        price: Number,
        mrp: Number,
        quantity: Number,
        image: String
      }
    ],
    totalAmount: {
      type: Number,
      required: true
    },
    shippingAddress: {
      streetAddress: String,
      city: String,
      state: String,
      pincode: String
    },
    status: {
      type: String,
      enum: ['ABANDONED', 'RECOVERED'],
      default: 'ABANDONED',
      index: true
    },
    emailSent: {
      type: Boolean,
      default: false
    },
    emailSentAt: {
      type: Date
    },
    recoveryToken: {
      type: String
    }
  },
  { timestamps: true }
);

export default mongoose.models.AbandonedCart || mongoose.model('AbandonedCart', AbandonedCartSchema);
