import mongoose from 'mongoose';
import Product from './models/Product.js';
import ProductVariant from './models/ProductVariant.js';
import { connectDB } from './lib/db.js';

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing
    await Product.deleteMany({});
    await ProductVariant.deleteMany({});

    console.log('Cleared existing product and variant data.');

    // Create featured product
    const product = await Product.create({
      name: 'NABH Oversized T-Shirt',
      description: 'Elevate your daily wear with the NABH Oversized T-Shirt. Engineered from premium 240 GSM heavy-weight French Terry cotton. This tee features an optimized drop-shoulder drape, a snug crew neck collar that won\'t stretch out over time, and a minimal, ultra-clean streetwear aesthetic.',
      slug: 'nabh-oversized-t-shirt',
      category: 'Oversized T-shirt',
      // Main product image (Lavender)
      image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
      images: [
        'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80', // Lavender
        'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&auto=format&fit=crop&q=80', // Black
        'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&auto=format&fit=crop&q=80'  // White
      ]
    });

    console.log(`Product created: ${product.name} (${product._id})`);

    // Colors and sizes
    const colors = [
      { name: 'Lavender', code: 'LAV', qikinkColor: 'lavender' },
      { name: 'Black', code: 'BLK', qikinkColor: 'black' },
      { name: 'White', code: 'WHT', qikinkColor: 'white' }
    ];
    const sizes = ['S', 'M', 'L', 'XL', 'XXL'];

    const colorImages = {
      Lavender: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
      Black: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&auto=format&fit=crop&q=80',
      White: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&auto=format&fit=crop&q=80'
    };

    const variants = [];

    for (const color of colors) {
      for (const size of sizes) {
        variants.push({
          productId: product._id,
          sku: `NABH-OVS-${color.code}-${size}`,
          color: color.name,
          size: size,
          price: 799,
          mrp: 999,
          inventory: 100,
          qikinkSku: `QIK-TSE-OVS-${color.code}-${size}`,
          image: colorImages[color.name] || product.image
        });
      }
    }

    await ProductVariant.insertMany(variants);
    console.log(`Successfully seeded ${variants.length} variants.`);

    mongoose.connection.close();
    console.log('Seeding script completed and database connection closed.');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
