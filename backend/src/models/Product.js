import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    category: { type: String, required: true, default: 'Oversized T-shirt' },
    gender: { type: String, enum: ['men', 'women', 'unisex'], default: 'unisex' },
    image: { type: String, required: true },
    images: [{ type: String }],
    lookbookMap: { type: Map, of: String, default: {} },
    active: { type: Boolean, default: true },
    numericId: { type: Number }
  },
  { timestamps: true }
);

export default mongoose.models.Product || mongoose.model('Product', ProductSchema);
