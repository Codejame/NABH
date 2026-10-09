import express from 'express';
import mongoose from 'mongoose';
import Product from '../models/Product.js';
import ProductVariant from '../models/ProductVariant.js';
import crypto from 'crypto';
import axios from 'axios';

const router = express.Router();

// Helper: Safely extract a single image URL from various formats
const extractImageUrl = (img) => {
  if (!img) return null;
  if (typeof img === 'string') return img.trim();
  if (img.src && typeof img.src === 'string') return img.src.trim();
  if (img.url && typeof img.url === 'string') return img.url.trim();
  if (img.image && typeof img.image === 'string') return img.image.trim();
  if (img.mockup && typeof img.mockup === 'string') return img.mockup.trim();
  return null;
};

// Helper: Safely extract an array of image URLs
const extractImagesArray = (images, fallback = null) => {
  const list = [];
  if (Array.isArray(images)) {
    for (const item of images) {
      const url = extractImageUrl(item);
      if (url && !list.includes(url)) list.push(url);
    }
  } else if (images) {
    const url = extractImageUrl(images);
    if (url && !list.includes(url)) list.push(url);
  }
  // Only use fallback if no valid images were extracted
  if (list.length === 0 && fallback) {
    const fallbackUrl = extractImageUrl(fallback);
    if (fallbackUrl && !list.includes(fallbackUrl)) {
      list.push(fallbackUrl);
    }
  }
  return list;
};

// Helper: Find product by Mongo ID, numeric ID, or slug
const findProductByIdOrNumeric = async (productId) => {
  if (!productId) return null;
  const queries = [];
  if (mongoose.Types.ObjectId.isValid(productId)) {
    queries.push({ _id: productId });
  }
  const num = parseInt(productId, 10);
  if (!isNaN(num)) {
    queries.push({ numericId: num });
  }
  queries.push({ slug: productId.toString() });
  return await Product.findOne({ $or: queries });
};

// Helper: Map WooCommerce color & size attributes
const parseAttributes = (attributes) => {
  let colorName = 'Default';
  let sizeName = 'M';

  if (attributes && Array.isArray(attributes)) {
    const colorAttr = attributes.find(
      (attr) => attr.name && (attr.name.toLowerCase() === 'color' || attr.name.toLowerCase() === 'colour')
    );
    const sizeAttr = attributes.find(
      (attr) => attr.name && attr.name.toLowerCase() === 'size'
    );

    if (colorAttr) colorName = colorAttr.option || colorAttr.name || colorName;
    if (sizeAttr) sizeName = sizeAttr.option || sizeAttr.name || sizeName;
  }

  const colorCodes = {
    white: 'WHT',
    black: 'BLK',
    lavender: 'LAV',
    navy: 'NVY',
    'navy blue': 'NVY',
    blue: 'BLU',
    grey: 'GRY',
    gray: 'GRY',
    red: 'RED',
    yellow: 'YLW',
    green: 'GRN',
    beige: 'BGE',
    olive: 'OLV',
    'olive green': 'OLV'
  };

  const colorKey = colorName.toLowerCase().trim();
  const colorCode = colorCodes[colorKey] || colorKey.replace(/[^a-z0-9]/gi, '').substring(0, 3).toUpperCase() || 'DEF';

  return { colorName, sizeName, colorCode };
};

// Mock connection check
router.get('/', (req, res) => {
  res.json({
    name: "NABH Wear Custom Store (Emulated)",
    version: "8.0.0",
    description: "WooCommerce API Emulator for Qikink Auto-Sync",
    home: "http://localhost:5000"
  });
});

// Mock connection check products list
router.get('/products', async (req, res) => {
  try {
    const products = await Product.find({ active: true });
    res.json(products.map(p => ({
      id: p.numericId || 100000,
      name: p.name,
      slug: p.slug,
      images: (p.images || [p.image]).map(img => ({ src: img }))
    })));
  } catch {
    res.json([]);
  }
});

// Mock empty settings categories/attributes for Qikink onboarding check
router.get('/products/categories', (req, res) => {
  res.json([]);
});

router.get('/products/attributes', (req, res) => {
  res.json([]);
});

router.get('/shipping/zones', (req, res) => {
  res.json([]);
});

router.get('/payment_gateways', (req, res) => {
  res.json([]);
});

router.get('/taxes', (req, res) => {
  res.json([]);
});

// GET /wp-json/wc/v3/products/:productId -> Retrieve single product
router.get('/products/:productId', async (req, res) => {
  try {
    const dbProduct = await findProductByIdOrNumeric(req.params.productId);
    if (!dbProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const images = (dbProduct.images && dbProduct.images.length > 0)
      ? dbProduct.images.map((src, i) => ({ id: i + 1, src }))
      : [{ id: 1, src: dbProduct.image }];

    res.json({
      id: dbProduct.numericId || 100000,
      name: dbProduct.name,
      slug: dbProduct.slug,
      type: 'variable',
      status: 'publish',
      description: dbProduct.description,
      images: images
    });
  } catch (error) {
    console.error('[WC Emulator] Error getting product:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

// POST /wp-json/wc/v3/products -> Create Product
router.post('/products', async (req, res) => {
  try {
    const { name, description, images, type } = req.body;

    console.log(`[WC Emulator] Received product creation request: ${name}`);

    // Generate unique slug
    let baseSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/^-+|-+$/g, '');

    let slug = baseSlug;
    let counter = 1;
    while (await Product.findOne({ slug })) {
      counter++;
      slug = `${baseSlug}-${counter}`;
    }

    // Strip HTML tags from description
    const cleanDescription = description
      ? description.replace(/<[^>]*>/g, '')
      : 'Auto-synced from Qikink.';

    // Extract all gallery images safely
    const galleryImages = extractImagesArray(images, 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800');
    const mainImage = galleryImages[0] || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800';

    // Generate a unique 6-digit numeric ID for WooCommerce standard response compatibility
    const numericId = Math.floor(100000 + Math.random() * 900000);

    // Intelligent Gender & Category detection
    const nameLower = name.toLowerCase();
    let detectedGender = 'unisex';
    if (nameLower.includes('women') || nameLower.includes('woman') || nameLower.includes('girl') || nameLower.includes('ladies') || nameLower.includes('crop')) {
      detectedGender = 'women';
    } else if (nameLower.includes('men') && !nameLower.includes('women') && !nameLower.includes('unisex')) {
      detectedGender = 'men';
    }

    dbProduct = await Product.create({
      name,
      description: cleanDescription,
      slug,
      category: req.body.categories?.[0]?.name || 'Oversized T-shirt',
      gender: detectedGender,
      image: mainImage,
      images: galleryImages,
      active: true,
      numericId
    });

    console.log(`[WC Emulator] Product created in database: ${dbProduct.name} (Mongo ID: ${dbProduct._id}, Numeric ID: ${numericId}, ${galleryImages.length} images)`);

    const formattedAttributes = (req.body.attributes || []).map((attr, idx) => ({
      id: attr.id || idx + 1,
      name: attr.name || (idx === 0 ? 'Color' : 'Size'),
      position: attr.position !== undefined ? attr.position : idx,
      visible: attr.visible !== undefined ? attr.visible : true,
      variation: attr.variation !== undefined ? attr.variation : true,
      options: Array.isArray(attr.options) ? attr.options : (attr.option ? [attr.option] : [])
    }));

    // Return mock WooCommerce Product details (must return numeric id for Qikink client parsing)
    res.status(201).json({
      id: numericId,
      name: dbProduct.name,
      slug: dbProduct.slug,
      permalink: `http://localhost:5173/product/${dbProduct.slug}`,
      type: type || 'variable',
      status: req.body.status || 'publish',
      featured: false,
      catalog_visibility: 'visible',
      description: dbProduct.description,
      short_description: req.body.short_description || '',
      sku: req.body.sku || '',
      price: req.body.regular_price || '799',
      regular_price: req.body.regular_price || '799',
      sale_price: req.body.sale_price || '',
      manage_stock: false,
      stock_quantity: null,
      stock_status: 'instock',
      images: galleryImages.map((src, idx) => ({ id: idx + 1, src, name: `image_${idx + 1}`, alt: '' })),
      attributes: formattedAttributes,
      default_attributes: [],
      variations: []
    });
  } catch (error) {
    console.error('[WC Emulator] Error creating product:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

// PUT /wp-json/wc/v3/products/:productId or POST update -> Update product (handles full image sync)
const handleProductUpdate = async (req, res) => {
  try {
    const { productId } = req.params;
    const { name, description, images } = req.body;

    const dbProduct = await findProductByIdOrNumeric(productId);
    if (!dbProduct) {
      console.error(`[WC Emulator] Product lookup failed for update ID: ${productId}`);
      return res.status(404).json({ message: 'Product not found' });
    }

    if (name) dbProduct.name = name;
    if (description) dbProduct.description = description.replace(/<[^>]*>/g, '');

    if (images) {
      const incomingImages = extractImagesArray(images);
      for (const imgUrl of incomingImages) {
        if (!dbProduct.images.includes(imgUrl)) {
          dbProduct.images.push(imgUrl);
        }
      }
      if (dbProduct.images.length > 0 && (!dbProduct.image || dbProduct.image.includes('unsplash'))) {
        dbProduct.image = dbProduct.images[0];
      }
    }

    await dbProduct.save();
    console.log(`[WC Emulator] Updated product ${dbProduct.name}, images total: ${dbProduct.images.length}`);

    res.json({
      id: dbProduct.numericId || 100000,
      name: dbProduct.name,
      slug: dbProduct.slug,
      type: 'variable',
      status: 'publish',
      description: dbProduct.description,
      images: dbProduct.images.map((src, idx) => ({ id: idx + 1, src }))
    });
  } catch (error) {
    console.error('[WC Emulator] Error updating product:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

router.put('/products/:productId', handleProductUpdate);
router.post('/products/:productId', handleProductUpdate);

// POST /wp-json/wc/v3/products/:productId/variations -> Create variation
router.post('/products/:productId/variations', async (req, res) => {
  try {
    const { productId } = req.params;
    const { sku, regular_price, sale_price, stock_quantity, attributes } = req.body;

    console.log(`[WC Emulator] Creating variation for product ${productId} with SKU: ${sku}`);

    // Look up the product by Mongo ID or numeric ID
    const dbProduct = await findProductByIdOrNumeric(productId);

    if (!dbProduct) {
      console.error(`[WC Emulator] Product lookup failed for ID: ${productId}`);
      return res.status(404).json({ message: 'Product lookup failed' });
    }

    const resolvedMongoProductId = dbProduct._id;

    // Extract variation image if provided and add to parent product's images gallery
    let variationImageSrc = extractImageUrl(req.body.image) || extractImageUrl(req.body.images?.[0]) || req.body.image_url;

    if (variationImageSrc) {
      if (!dbProduct.images.includes(variationImageSrc)) {
        dbProduct.images.push(variationImageSrc);
        // If main image was a placeholder, replace it with first real image
        if (!dbProduct.image || dbProduct.image.includes('unsplash')) {
          dbProduct.image = variationImageSrc;
        }
        await dbProduct.save();
        console.log(`[WC Emulator] Appended variation image to parent product gallery: ${variationImageSrc}`);
      }
    }

    // Also extract all images in req.body.images if multiple provided
    if (Array.isArray(req.body.images)) {
      for (const item of req.body.images) {
        const extraImg = extractImageUrl(item);
        if (extraImg && !dbProduct.images.includes(extraImg)) {
          dbProduct.images.push(extraImg);
          await dbProduct.save();
        }
      }
    }

    // Map WooCommerce color and size attributes
    const { colorName, sizeName, colorCode } = parseAttributes(attributes);

    // Construct a unique internal SKU scoped to this product
    const internalSku = `NABH-${dbProduct.numericId || 'TEE'}-${colorCode}-${sizeName}`;

    // Ensure we delete any existing variant with this internal SKU to avoid duplicate index key error
    await ProductVariant.deleteOne({ sku: internalSku });

    // Look up if an existing variant of the SAME color already has an image
    let colorFallbackImage = null;
    if (!variationImageSrc) {
      const sameColorVariant = await ProductVariant.findOne({
        productId: resolvedMongoProductId,
        color: colorName,
        image: { $exists: true, $ne: '' }
      });
      if (sameColorVariant && sameColorVariant.image) {
        colorFallbackImage = sameColorVariant.image;
      }
    }

    const incomingVarImages = [];
    if (variationImageSrc) incomingVarImages.push(variationImageSrc);
    if (Array.isArray(req.body.images)) {
      for (const itm of req.body.images) {
        const u = extractImageUrl(itm);
        if (u && !incomingVarImages.includes(u)) incomingVarImages.push(u);
      }
    }

    // Create the ProductVariant
    const newVariant = await ProductVariant.create({
      productId: resolvedMongoProductId,
      sku: internalSku,
      color: colorName,
      size: sizeName,
      price: parseInt(sale_price || regular_price, 10) || 799,
      mrp: parseInt(regular_price, 10) || 999,
      inventory: stock_quantity !== undefined ? stock_quantity : 100,
      qikinkSku: sku || internalSku,
      image: variationImageSrc || colorFallbackImage || dbProduct.image,
      images: incomingVarImages.length > 0 ? incomingVarImages : (colorFallbackImage ? [colorFallbackImage] : [dbProduct.image])
    });

    console.log(`[WC Emulator] Variation created: ${colorName} / ${sizeName} (Internal SKU: ${internalSku}, Qikink SKU: ${sku}, Images: ${incomingVarImages.length})`);

    const variationNumericId = Math.floor(100000 + Math.random() * 900000);
    const parentNumericId = dbProduct.numericId || parseInt(productId, 10) || 100000;

    const formattedVarAttributes = (attributes || []).map((attr, idx) => ({
      id: attr.id || idx + 1,
      name: attr.name,
      option: attr.option
    }));

    res.status(201).json({
      id: variationNumericId,
      parent_id: parentNumericId,
      status: 'publish',
      purchasable: true,
      sku: sku || newVariant.sku,
      price: newVariant.price.toString(),
      regular_price: newVariant.mrp.toString(),
      sale_price: newVariant.price.toString(),
      stock_quantity: newVariant.inventory,
      stock_status: 'instock',
      manage_stock: true,
      image: {
        id: variationNumericId,
        src: newVariant.image,
        name: `var_img_${variationNumericId}`,
        alt: ''
      },
      attributes: formattedVarAttributes
    });
  } catch (error) {
    console.error('[WC Emulator] Error creating variation:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

// POST /wp-json/wc/v3/products/:productId/variations/batch -> Batch create variations
router.post('/products/:productId/variations/batch', async (req, res) => {
  try {
    const { productId } = req.params;
    const { create = [], update = [] } = req.body;

    console.log(`[WC Emulator] Batch variation request for product ${productId}: ${create.length} create, ${update.length} update`);

    const dbProduct = await findProductByIdOrNumeric(productId);
    if (!dbProduct) {
      return res.status(404).json({ message: 'Product lookup failed' });
    }

    const createdResults = [];

    for (const item of create) {
      const { sku, regular_price, sale_price, stock_quantity, attributes } = item;
      const variationImageSrc = extractImageUrl(item.image) || extractImageUrl(item.images?.[0]) || item.image_url;

      if (variationImageSrc && !dbProduct.images.includes(variationImageSrc)) {
        dbProduct.images.push(variationImageSrc);
        if (!dbProduct.image || dbProduct.image.includes('unsplash')) {
          dbProduct.image = variationImageSrc;
        }
      }

      const { colorName, sizeName, colorCode } = parseAttributes(attributes);
      const internalSku = `NABH-${dbProduct.numericId || 'TEE'}-${colorCode}-${sizeName}`;

      await ProductVariant.deleteOne({ sku: internalSku });

      const incomingBatchImages = [];
      if (variationImageSrc) incomingBatchImages.push(variationImageSrc);
      if (Array.isArray(item.images)) {
        for (const itm of item.images) {
          const u = extractImageUrl(itm);
          if (u && !incomingBatchImages.includes(u)) incomingBatchImages.push(u);
        }
      }

      const newVariant = await ProductVariant.create({
        productId: dbProduct._id,
        sku: internalSku,
        color: colorName,
        size: sizeName,
        price: parseInt(sale_price || regular_price, 10) || 799,
        mrp: parseInt(regular_price, 10) || 999,
        inventory: stock_quantity !== undefined ? stock_quantity : 100,
        qikinkSku: sku || internalSku,
        image: variationImageSrc || dbProduct.image,
        images: incomingBatchImages.length > 0 ? incomingBatchImages : [dbProduct.image]
      });

      const variationNumericId = Math.floor(100000 + Math.random() * 900000);
      createdResults.push({
        id: variationNumericId,
        parent_id: dbProduct.numericId,
        status: 'publish',
        purchasable: true,
        sku: sku || newVariant.sku,
        price: newVariant.price.toString(),
        regular_price: newVariant.mrp.toString(),
        sale_price: newVariant.price.toString(),
        stock_quantity: newVariant.inventory,
        stock_status: 'instock',
        manage_stock: true,
        image: {
          id: variationNumericId,
          src: newVariant.image,
          name: `var_img_${variationNumericId}`,
          alt: ''
        },
        attributes: (attributes || []).map((attr, idx) => ({
          id: attr.id || idx + 1,
          name: attr.name,
          option: attr.option
        }))
      });
    }

    await dbProduct.save();
    console.log(`[WC Emulator] Batch variation completed. Product now has ${dbProduct.images.length} gallery images.`);

    res.status(200).json({
      create: createdResults,
      update: [],
      delete: []
    });
  } catch (error) {
    console.error('[WC Emulator] Error batch creating variations:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

// GET /wp-json/wc/v3/products/:productId/variations -> List product variations
router.get('/products/:productId/variations', async (req, res) => {
  try {
    const dbProduct = await findProductByIdOrNumeric(req.params.productId);
    if (!dbProduct) return res.json([]);

    const variants = await ProductVariant.find({ productId: dbProduct._id });
    res.json(variants.map(v => ({
      id: Math.floor(100000 + Math.random() * 900000),
      sku: v.qikinkSku,
      price: v.price.toString(),
      regular_price: v.mrp.toString(),
      sale_price: v.price.toString(),
      stock_quantity: v.inventory,
      image: { src: v.image || dbProduct.image },
      attributes: [
        { name: 'Color', option: v.color },
        { name: 'Size', option: v.size }
      ]
    })));
  } catch {
    res.json([]);
  }
});

// AES-128-CTR Encryptor matching Qikink PHP open_ssl encrypt
function qikinkEncryptor(params) {
  const jsonStr = JSON.stringify(params);
  
  // PHP open_ssl encrypt with AES-128-CTR and key "qikinkhuepress"
  // If key is less than 16 bytes, PHP null-pads it.
  const key = Buffer.alloc(16);
  key.write('qikinkhuepress');
  const iv = Buffer.from('8929770667187677');
  
  const cipher = crypto.createCipheriv('aes-128-ctr', key, iv);
  let encrypted = cipher.update(jsonStr, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return encrypted.trim();
}

// POST /wp-json/wc/v3/qikink/connect-step1 -> Request OTP
router.post('/qikink/connect-step1', async (req, res) => {
  try {
    const { email, storeUrl } = req.body;
    if (!email || !storeUrl) {
      return res.status(400).json({ success: false, message: 'Email and Store URL are required' });
    }

    const payload = {
      EmailId: email,
      store_url: storeUrl
    };

    const encryptedData = qikinkEncryptor(payload);
    
    const response = await axios.post('https://fulfilment.qikink.com/index.php/autoc/wp_plugin', 
      new URLSearchParams({ encrypted_data: encryptedData }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );

    const resData = response.data;
    if (resData.status) {
      res.json({ success: true, clientId: resData.client_id });
    } else {
      res.status(400).json({ success: false, message: resData.msg || 'Verification failed' });
    }
  } catch (error) {
    console.error('[Qikink Connector] Step 1 Error:', error.response?.data || error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /wp-json/wc/v3/qikink/connect-step2 -> Verify OTP and Send Keys
router.post('/qikink/connect-step2', async (req, res) => {
  try {
    const { otp, clientId, storeUrl } = req.body;
    if (!otp || !clientId || !storeUrl) {
      return res.status(400).json({ success: false, message: 'OTP, ClientId, and Store URL are required' });
    }

    const otpPayload = {
      otp: otp,
      client_id: clientId.toString()
    };

    const encryptedData = qikinkEncryptor(otpPayload);

    const otpResponse = await axios.post('https://fulfilment.qikink.com/index.php/autoc/wp_plugin_otp',
      new URLSearchParams({ encrypted_data: encryptedData }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );

    const resData = otpResponse.data;
    if (resData.status) {
      // Generate standard format WooCommerce keys
      const consumerKey = 'ck_' + crypto.randomBytes(20).toString('hex');
      const consumerSecret = 'cs_' + crypto.randomBytes(20).toString('hex');

      console.log(`[Qikink Connector] OTP Verified! Sending callback keys to Qikink...`);

      const callbackPayload = {
        consumer_key: consumerKey,
        consumer_secret: consumerSecret,
        user_id: clientId.toString()
      };

      await axios.post('https://fulfilment.qikink.com/index.php/Autoc/get_woocommerce_keys', callbackPayload, {
        headers: { 'Content-Type': 'application/json' }
      });

      console.log(`[Qikink Connector] Successfully linked Qikink to store ${storeUrl}!`);

      res.json({
        success: true,
        message: 'Your website is now successfully connected to Qikink!',
        consumerKey,
        consumerSecret
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid OTP code' });
    }
  } catch (error) {
    console.error('[Qikink Connector] Step 2 Error:', error.response?.data || error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
