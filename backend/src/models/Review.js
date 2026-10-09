import mongoose from 'mongoose';

const ReviewSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, default: '' },
    comment: { type: String, required: true },
    fit: { type: String, enum: ['True to Size', 'Runs Large', 'Runs Small'], default: 'True to Size' },
    verifiedBuyer: { type: Boolean, default: true },
    photos: [{ type: String }]
  },
  { timestamps: true }
);

export default mongoose.models.Review || mongoose.model('Review', ReviewSchema);
