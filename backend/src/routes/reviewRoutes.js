import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Review from '../models/Review.js';
import Product from '../models/Product.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const reviewsImagesDir = path.resolve(__dirname, '../../../frontend/public/images/reviews');

if (!fs.existsSync(reviewsImagesDir)) {
  fs.mkdirSync(reviewsImagesDir, { recursive: true });
}

const router = express.Router();

/**
 * @route GET /api/reviews/product/:idOrSlug
 * @desc Get all reviews and rating breakdown for a product
 */
router.get('/product/:idOrSlug', async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    let product = null;

    if (idOrSlug.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(idOrSlug);
    }
    if (!product) {
      product = await Product.findOne({ slug: idOrSlug });
    }

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const reviews = await Review.find({ productId: product._id }).sort({ createdAt: -1 });

    // Calculate rating metrics
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
      : 5.0;

    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    const fitStats = { 'True to Size': 0, 'Runs Large': 0, 'Runs Small': 0 };

    reviews.forEach((r) => {
      if (breakdown[r.rating] !== undefined) breakdown[r.rating]++;
      if (fitStats[r.fit] !== undefined) fitStats[r.fit]++;
    });

    const fitPercentages = {
      trueToSize: totalReviews > 0 ? Math.round((fitStats['True to Size'] / totalReviews) * 100) : 100,
      runsLarge: totalReviews > 0 ? Math.round((fitStats['Runs Large'] / totalReviews) * 100) : 0,
      runsSmall: totalReviews > 0 ? Math.round((fitStats['Runs Small'] / totalReviews) * 100) : 0
    };

    res.json({
      reviews,
      totalReviews,
      averageRating: parseFloat(averageRating),
      breakdown,
      fitStats,
      fitPercentages
    });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving reviews', error: error.message });
  }
});

/**
 * @route POST /api/reviews/add
 * @desc Add a new customer review in real-time
 */
router.post('/add', async (req, res) => {
  try {
    const { productId, name, rating, title, comment, fit, photos = [] } = req.body;

    if (!productId || !name || !rating || !comment) {
      return res.status(400).json({ message: 'Missing required review fields (name, rating, comment, productId)' });
    }

    let product = null;
    if (productId.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(productId);
    }
    if (!product) {
      product = await Product.findOne({ slug: productId });
    }

    if (!product) {
      return res.status(404).json({ message: 'Target product not found' });
    }

    // Process review photos (save base64 images if provided)
    const savedPhotos = [];
    if (Array.isArray(photos)) {
      photos.forEach((photo, idx) => {
        if (!photo) return;
        if (typeof photo === 'string' && photo.startsWith('data:image')) {
          try {
            const matches = photo.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            const dataBuffer = matches ? Buffer.from(matches[2], 'base64') : Buffer.from(photo, 'base64');
            const filename = `fitcheck-${product.slug}-${Date.now()}-${idx}.png`;
            const targetPath = path.join(reviewsImagesDir, filename);
            fs.writeFileSync(targetPath, dataBuffer);
            savedPhotos.push(`/images/reviews/${filename}`);
          } catch (err) {
            console.error('[Review Photo Error]:', err.message);
          }
        } else if (typeof photo === 'string' && (photo.startsWith('http') || photo.startsWith('/'))) {
          savedPhotos.push(photo.trim());
        }
      });
    }

    const review = await Review.create({
      productId: product._id,
      name: name.trim(),
      rating: Math.max(1, Math.min(5, parseInt(rating) || 5)),
      title: title?.trim() || '',
      comment: comment.trim(),
      fit: fit || 'True to Size',
      photos: savedPhotos,
      verifiedBuyer: true
    });

    res.json({
      success: true,
      message: 'Thank you! Your fit review has been published in real time.',
      review
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating review', error: error.message });
  }
});

/**
 * @route DELETE /api/reviews/:id
 * @desc Delete a review (Admin moderation)
 */
router.delete('/:id', async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    res.json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting review', error: error.message });
  }
});

export default router;
