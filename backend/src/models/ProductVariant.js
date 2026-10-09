import mongoose from 'mongoose';

const ProductVariantSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    sku: { type: String, required: true, unique: true },
    color: { type: String, required: true },
    size: { type: String, required: true },
    price: { type: Number, required: true },
    mrp: { type: Number, required: true },
    inventory: { type: Number, default: 100 },
    qikinkSku: { type: String, required: true },
    image: { type: String },
    images: [{ type: String }]
  },
  { timestamps: true }
);

export default mongoose.models.ProductVariant || mongoose.model('ProductVariant', ProductVariantSchema);
