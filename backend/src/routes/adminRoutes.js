import express from 'express';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import ProductVariant from '../models/ProductVariant.js';
import { createQikinkOrder, getQikinkOrderStatus } from '../services/qikink.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendPublicImagesDir = path.resolve(__dirname, '../../../frontend/public/images');

const router = express.Router();

// Ensure images directory exists
if (!fs.existsSync(frontendPublicImagesDir)) {
  fs.mkdirSync(frontendPublicImagesDir, { recursive: true });
}

/**
 * @route POST /api/admin/upload-model-lookbook
 * @desc Upload model photoshoot picture for a product color and optionally set as main catalog image
 */
router.post('/upload-model-lookbook', async (req, res) => {
  try {
    const { productId, color, imageUrl, base64Data, setAsMainCatalogImage = true } = req.body;
    if (!productId || !color || (!imageUrl && !base64Data)) {
      return res.status(400).json({ success: false, message: 'ProductId, Color, and Image are required' });
    }

    const product = await Product.findById(productId) || await Product.findOne({ slug: productId });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const colorKey = color.toLowerCase().trim();
    let savedUrl = imageUrl;

    // Handle base64 upload
    if (base64Data) {
      const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      const dataBuffer = matches ? Buffer.from(matches[2], 'base64') : Buffer.from(base64Data, 'base64');
      const filename = `model-lookbook-${product.slug}-${colorKey}-${Date.now()}.png`;
      const targetPath = path.join(frontendPublicImagesDir, filename);

      fs.writeFileSync(targetPath, dataBuffer);
      savedUrl = `/images/${filename}`;
    }

    if (!product.lookbookMap) {
      product.lookbookMap = new Map();
    }

    product.lookbookMap.set(colorKey, savedUrl);

    // Update primary catalog image if requested or if current image is not a photoshoot
    if (setAsMainCatalogImage || !product.image || product.image.includes('unsplash') || product.image.includes('tempImages')) {
      product.image = savedUrl;
    }

    await product.save();

    // Also update variants with this color so their cart and checkout images match
    try {
      await ProductVariant.updateMany(
        { productId: product._id, color: new RegExp(`^${color.trim()}$`, 'i') },
        { image: savedUrl }
      );
    } catch (varErr) {
      console.warn('[Lookbook Uploader] Variant sync warning:', varErr.message);
    }

    res.json({
      success: true,
      message: `Model photoshoot for ${color} uploaded and added to catalog successfully!`,
      imageUrl: savedUrl,
      productImage: product.image,
      lookbookMap: Object.fromEntries(product.lookbookMap)
    });
  } catch (error) {
    console.error('[Lookbook Uploader] Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route POST /api/admin/set-primary-catalog-image
 * @desc Set a specific model photo as the primary catalog cover image for the product
 */
router.post('/set-primary-catalog-image', async (req, res) => {
  try {
    const { productId, imageUrl } = req.body;
    if (!productId || !imageUrl) {
      return res.status(400).json({ success: false, message: 'ProductId and Image URL are required' });
    }

    const product = await Product.findById(productId) || await Product.findOne({ slug: productId });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    product.image = imageUrl;
    await product.save();

    res.json({
      success: true,
      message: 'Primary catalog cover image updated successfully!',
      productImage: product.image
    });
  } catch (error) {
    console.error('[Set Primary Image] Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route POST /api/admin/delete-model-lookbook
 * @desc Remove custom model lookbook photo for a product color
 */
router.post('/delete-model-lookbook', async (req, res) => {
  try {
    const { productId, color } = req.body;
    const product = await Product.findById(productId) || await Product.findOne({ slug: productId });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const colorKey = color.toLowerCase().trim();
    let deletedUrl = null;
    if (product.lookbookMap && product.lookbookMap.has(colorKey)) {
      deletedUrl = product.lookbookMap.get(colorKey);
      product.lookbookMap.delete(colorKey);

      // If the deleted image was the primary catalog image, reassign to another lookbook if available
      if (product.image === deletedUrl) {
        const remainingLookbooks = Array.from(product.lookbookMap.values());
        if (remainingLookbooks.length > 0) {
          product.image = remainingLookbooks[0];
        } else if (product.images && product.images.length > 0) {
          product.image = product.images[0];
        }
      }

      await product.save();
    }

    res.json({
      success: true,
      message: `Model photoshoot for ${color} removed.`,
      productImage: product.image,
      lookbookMap: Object.fromEntries(product.lookbookMap || new Map())
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route GET /api/admin/metrics
 * @desc Get shop business metrics
 */
router.get('/metrics', async (req, res) => {
  try {
    const orders = await Order.find({ paymentStatus: 'PAID' });
    
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalOrdersCount = orders.length;
    
    const pendingFulfillments = await Order.countDocuments({
      paymentStatus: 'PAID',
      fulfillmentStatus: { $in: ['PENDING', 'PRINTING'] }
    });

    const lowStockVariants = await ProductVariant.find({ inventory: { $lt: 20 } }).populate('productId');

    res.json({
      totalRevenue,
      totalOrdersCount,
      pendingFulfillments,
      lowStockCount: lowStockVariants.length,
      lowStockVariants
    });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving metrics', error: error.message });
  }
});

/**
 * @route GET /api/admin/orders
 * @desc Get all orders
 */
router.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving orders', error: error.message });
  }
});

/**
 * @route PATCH /api/admin/orders/:id/status
 * @desc Update order fulfillment/payment status and tracking number
 */
router.patch('/orders/:id/status', async (req, res) => {
  try {
    const { fulfillmentStatus, trackingNumber, trackingStatus, paymentStatus } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (fulfillmentStatus) order.fulfillmentStatus = fulfillmentStatus;
    if (trackingNumber !== undefined) order.trackingNumber = trackingNumber;
    if (trackingStatus) order.trackingStatus = trackingStatus;
    if (paymentStatus) order.paymentStatus = paymentStatus;

    await order.save();
    res.json({ success: true, message: `Order #${order.orderNumber} updated successfully!`, order });
  } catch (error) {
    res.status(500).json({ message: 'Error updating order status', error: error.message });
  }
});

/**
 * @route GET /api/admin/products
 * @desc Get all products and variants for administration
 */
router.get('/products', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    const enriched = await Promise.all(
      products.map(async (prod) => {
        const variants = await ProductVariant.find({ productId: prod._id });
        const totalStock = variants.reduce((sum, v) => sum + (v.inventory || 0), 0);
        const inStock = totalStock > 0 && variants.some(v => v.inventory > 0);
        return {
          product: prod,
          variants,
          totalStock,
          inStock
        };
      })
    );
    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving products', error: error.message });
  }
});

/**
 * @route PATCH /api/admin/products/:id/toggle-active
 * @desc Toggle product active state (show/hide from storefront)
 */
router.patch('/products/:id/toggle-active', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    product.active = !product.active;
    await product.save();

    res.json({
      success: true,
      message: `Product is now ${product.active ? 'LIVE on website' : 'HIDDEN from website'}`,
      product
    });
  } catch (error) {
    res.status(500).json({ message: 'Error toggling product status', error: error.message });
  }
});

/**
 * @route PATCH /api/admin/products/:id/set-stock
 * @desc Bulk set inventory across all variants of a product (e.g. 0 to mark finished/out of stock, or restock)
 */
router.patch('/products/:id/set-stock', async (req, res) => {
  try {
    const { inventory = 0 } = req.body;
    const stockVal = Math.max(0, parseInt(inventory) || 0);

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await ProductVariant.updateMany(
      { productId: product._id },
      { $set: { inventory: stockVal } }
    );

    const updatedVariants = await ProductVariant.find({ productId: product._id });
    const totalStock = updatedVariants.reduce((sum, v) => sum + (v.inventory || 0), 0);

    res.json({
      success: true,
      message: stockVal === 0 
        ? `All variants for ${product.name} set to OUT OF STOCK (0 units).`
        : `All variants for ${product.name} restocked to ${stockVal} units each.`,
      totalStock,
      variants: updatedVariants
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating stock levels', error: error.message });
  }
});

/**
 * @route DELETE /api/admin/products/:id
 * @desc Delete a product and all of its associated variants
 */
router.delete('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await ProductVariant.deleteMany({ productId: product._id });
    await Product.findByIdAndDelete(product._id);

    res.json({
      success: true,
      message: `Product "${product.name}" and its variants deleted successfully.`
    });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting product', error: error.message });
  }
});

/**
 * @route PUT /api/admin/products/:id
 * @desc Update product details (name, description, category, active status)
 */
router.put('/products/:id', async (req, res) => {
  try {
    const { name, description, category, active, image } = req.body;
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (active !== undefined) updateData.active = active;
    if (image !== undefined) updateData.image = image;

    const product = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ success: true, message: 'Product updated', product });
  } catch (error) {
    res.status(500).json({ message: 'Error updating product', error: error.message });
  }
});

/**
 * @route PUT /api/admin/variants/:id
 * @desc Update inventory/prices for a specific variant
 */
router.put('/variants/:id', async (req, res) => {
  try {
    const { price, mrp, inventory, qikinkSku } = req.body;
    
    const variant = await ProductVariant.findByIdAndUpdate(
      req.params.id,
      { price, mrp, inventory, qikinkSku },
      { new: true }
    );

    if (!variant) {
      return res.status(404).json({ message: 'Variant not found' });
    }

    res.json({ message: 'Variant updated successfully', variant });
  } catch (error) {
    res.status(500).json({ message: 'Error updating variant', error: error.message });
  }
});

/**
 * @route POST /api/admin/orders/:id/sync-qikink
 * @desc Manually push an order to Qikink (useful if initial payment-web sync failed)
 */
router.post('/orders/:id/sync-qikink', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.paymentStatus !== 'PAID' && order.paymentGateway !== 'COD') {
      return res.status(400).json({ message: 'Only paid or COD orders can be synced to Qikink' });
    }

    const qikinkResult = await createQikinkOrder(order);

    if (qikinkResult.success) {
      order.fulfillmentStatus = 'SENT_TO_QIKINK';
      order.qikinkOrderId = qikinkResult.qikinkOrderId;
      order.trackingNumber = qikinkResult.trackingNumber;
      order.trackingStatus = qikinkResult.trackingStatus || 'Pending Print';
      await order.save();
      
      res.json({ success: true, message: 'Synced successfully', order });
    } else {
      res.status(400).json({ success: false, message: qikinkResult.message });
    }
  } catch (error) {
    res.status(500).json({ message: 'Sync error', error: error.message });
  }
});

/**
 * @route POST /api/admin/products/add
 * @desc Add a new product
 */
router.post('/products/add', async (req, res) => {
  try {
    const { name, description, slug, category, image, images } = req.body;

    const existingProduct = await Product.findOne({ slug });
    if (existingProduct) {
      return res.status(400).json({ message: 'Slug already exists' });
    }

    let parsedImages = [];
    if (Array.isArray(images)) {
      parsedImages = images;
    } else if (typeof images === 'string' && images.trim()) {
      parsedImages = images.split(',').map(s => s.trim()).filter(Boolean);
    }
    if (parsedImages.length === 0 && image) {
      parsedImages = [image];
    }

    const newProduct = await Product.create({
      name,
      description,
      slug,
      category: category || 'Oversized T-shirt',
      image: image || parsedImages[0] || '',
      images: parsedImages
    });

    res.json({ message: 'Product created successfully', product: newProduct });
  } catch (error) {
    res.status(500).json({ message: 'Error creating product', error: error.message });
  }
});

/**
 * @route POST /api/admin/products/:productId/variants/add
 * @desc Add a variant to an existing product
 */
router.post('/products/:productId/variants/add', async (req, res) => {
  try {
    const { sku, color, size, price, mrp, inventory, qikinkSku, image } = req.body;
    const { productId } = req.params;

    const existingVariant = await ProductVariant.findOne({ sku });
    if (existingVariant) {
      return res.status(400).json({ message: 'SKU already exists' });
    }

    const newVariant = await ProductVariant.create({
      productId,
      sku,
      color,
      size,
      price,
      mrp,
      inventory: inventory !== undefined ? inventory : 100,
      qikinkSku,
      image
    });

    res.json({ message: 'Variant added successfully', variant: newVariant });
  } catch (error) {
    res.status(500).json({ message: 'Error creating variant', error: error.message });
  }
});

/**
 * @route POST /api/admin/products/bulk-create
 * @desc Bulk create a product and its mapped Qikink variants
 */
router.post('/products/bulk-create', async (req, res) => {
  try {
    const {
      name,
      description,
      slug,
      category,
      image,
      images,
      price,
      mrp,
      inventory,
      qikinkBaseSku,
      internalSkuPrefix,
      colors,
      sizes
    } = req.body;

    const existingProduct = await Product.findOne({ slug });
    if (existingProduct) {
      return res.status(400).json({ message: 'Product slug already exists' });
    }

    const newProduct = await Product.create({
      name,
      description,
      slug,
      category: category || 'Oversized T-shirt',
      image,
      images: images || [image]
    });

    const variants = [];
    const prefix = internalSkuPrefix || 'NABH-TEE';

    for (const color of colors) {
      for (const size of sizes) {
        variants.push({
          productId: newProduct._id,
          sku: `${prefix}-${color.code}-${size}`,
          color: color.name,
          size: size,
          price: price || 799,
          mrp: mrp || 999,
          inventory: inventory !== undefined ? inventory : 100,
          qikinkSku: `${qikinkBaseSku}-${color.qikinkCode}-${size}`
        });
      }
    }

    await ProductVariant.insertMany(variants);

    res.json({
      success: true,
      message: `Product and ${variants.length} variants created successfully`,
      product: newProduct
    });
  } catch (error) {
    res.status(500).json({ message: 'Error in bulk product creation', error: error.message });
  }
});

export default router;
