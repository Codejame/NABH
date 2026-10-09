import express from 'express';
import Product from '../models/Product.js';
import ProductVariant from '../models/ProductVariant.js';

const router = express.Router();

/**
 * @route GET /api/products
 * @desc Get all active products (with optional ?inStockOnly=true filter)
 */
router.get('/', async (req, res) => {
  try {
    const { inStockOnly } = req.query;
    const products = await Product.find({ active: true });
    
    // For each product, attach color/size options, total stock, and minimum price
    const enrichedProducts = await Promise.all(
      products.map(async (product) => {
        const variants = await ProductVariant.find({ productId: product._id });
        
        const colors = [...new Set(variants.map(v => v.color))];
        const sizes = [...new Set(variants.map(v => v.size))];
        
        // Calculate total inventory across all variants
        const totalStock = variants.reduce((sum, v) => sum + (v.inventory || 0), 0);
        const inStock = totalStock > 0 && variants.some(v => v.inventory > 0);

        // Find minimum selling price
        const minPrice = variants.reduce((min, v) => v.price < min ? v.price : min, variants[0]?.price || 0);
        const maxMrp = variants.reduce((max, v) => v.mrp > max ? v.mrp : max, variants[0]?.mrp || 0);

        const plainProduct = product.toObject();
        if (product.lookbookMap && product.lookbookMap instanceof Map) {
          plainProduct.lookbookMap = Object.fromEntries(product.lookbookMap);
        }

        const colorMockupMap = {};
        variants.forEach((v) => {
          const c = v.color ? v.color.toLowerCase().trim() : '';
          if (c && v.image && !colorMockupMap[c]) {
            colorMockupMap[c] = v.image;
          }
        });

        return {
          ...plainProduct,
          colors,
          sizes,
          colorMockupMap,
          totalStock,
          inStock,
          price: minPrice,
          mrp: maxMrp
        };
      })
    );

    // If inStockOnly is requested, filter out sold out products
    const filteredProducts = inStockOnly === 'true'
      ? enrichedProducts.filter(p => p.inStock)
      : enrichedProducts;

    res.json(filteredProducts);
  } catch (error) {
    res.status(500).json({ message: 'Server error retrieving products', error: error.message });
  }
});

/**
 * @route GET /api/products/:slug
 * @desc Get single product details with all associated variants
 */
router.get('/:slug', async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug, active: true });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const variants = await ProductVariant.find({ productId: product._id });
    const totalStock = variants.reduce((sum, v) => sum + (v.inventory || 0), 0);
    const inStock = totalStock > 0 && variants.some(v => v.inventory > 0);
    
    const plainProduct = product.toObject();
    if (product.lookbookMap && product.lookbookMap instanceof Map) {
      plainProduct.lookbookMap = Object.fromEntries(product.lookbookMap);
    }

    res.json({
      product: {
        ...plainProduct,
        totalStock,
        inStock
      },
      variants
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error retrieving product details', error: error.message });
  }
});

export default router;
