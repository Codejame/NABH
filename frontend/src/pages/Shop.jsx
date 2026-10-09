import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, CheckCircle2, XCircle, Filter, Heart, Star } from 'lucide-react';
import { getColorStyle } from './ProductDetail.jsx';
import { useWishlist } from '../context/WishlistContext.jsx';

const ProductCard = ({ product }) => {
  const { isInWishlist, toggleWishlist } = useWishlist();

  const defaultModelMap = {
    white: '/images/model-lookbook-white.png',
    black: '/images/model-lookbook-black.jpg',
    lavender: '/images/model-lookbook-lavender.jpg'
  };

  const getInitialModelImage = () => {
    const lbMap = product.lookbookMap instanceof Map 
      ? Object.fromEntries(product.lookbookMap) 
      : (product.lookbookMap || {});
    const firstColor = product.colors?.[0]?.toLowerCase()?.trim();
    if (firstColor && lbMap[firstColor]) {
      return lbMap[firstColor];
    }
    const lbValues = Object.values(lbMap);
    if (lbValues.length > 0) {
      return lbValues[0];
    }
    return product.image || product.images?.[0];
  };

  const [activeImg, setActiveImg] = useState(getInitialModelImage());
  const [activeColor, setActiveColor] = useState(product.colors?.[0] || '');
  const discount = Math.round(((product.mrp - product.price) / product.mrp) * 100);

  useEffect(() => {
    setActiveImg(getInitialModelImage());
    setActiveColor(product.colors?.[0] || '');
  }, [product]);

  const isSoldOut = product.totalStock === 0 || product.inStock === false;
  const wishlisted = isInWishlist(product._id || product.slug);

  const handleColorHover = (col) => {
    const colLower = col.toLowerCase().trim();
    setActiveColor(col);
    
    // 1. Check product's dynamic uploaded model lookbookMap first
    const customLookbook = product.lookbookMap && (product.lookbookMap[colLower] || (product.lookbookMap instanceof Map && product.lookbookMap.get(colLower)));
    if (customLookbook) {
      setActiveImg(customLookbook);
      return;
    }

    // 2. Signature lookbook fallback if applicable
    if (defaultModelMap[colLower]) {
      setActiveImg(defaultModelMap[colLower]);
      return;
    }

    // 3. Product catalog image
    if (product.image) {
      setActiveImg(product.image);
      return;
    }

    // 4. Color mockup map
    if (product.colorMockupMap && product.colorMockupMap[colLower]) {
      setActiveImg(product.colorMockupMap[colLower]);
      return;
    }
  };

  return (
    <div className={`group relative flex flex-col justify-between border ${isSoldOut ? 'border-red-950/40 bg-[#08080A]' : 'border-[#1C1C1E] bg-[#0A0A0C]'} overflow-hidden transition-all duration-300 hover:border-[#333336] shadow-xl`}>
      {/* Lookbook Model Image Stage */}
      <div className="relative aspect-square w-full overflow-hidden bg-[#08080A] border-b border-[#1C1C1E] flex items-center justify-center">
        <Link to={`/product/${product.slug}`} className="w-full h-full block">
          <img
            src={activeImg}
            alt={product.name}
            className={`w-full h-full object-contain transition-opacity duration-200 ${isSoldOut ? 'opacity-70 grayscale-[30%]' : ''}`}
          />
        </Link>

        {/* Wishlist 1-Click Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            toggleWishlist(product);
          }}
          className={`absolute top-3 ${isSoldOut ? 'right-24' : 'right-3'} p-1.5 backdrop-blur-md border rounded-sm transition-all z-10 ${
            wishlisted
              ? 'bg-red-950/80 border-red-500 text-red-400'
              : 'bg-black/60 border-[#2C2C2E] text-[#8E8E93] hover:text-white hover:border-white'
          }`}
          title={wishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
        >
          <Heart size={14} className={wishlisted ? 'fill-red-500 text-red-500' : ''} />
        </button>

        {/* Live Stock / Sold Out Badge */}
        {isSoldOut ? (
          <div className="absolute top-3 right-3 bg-red-600/90 backdrop-blur-md text-white text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 font-mono shadow-lg border border-red-500/40">
            SOLD OUT
          </div>
        ) : (
          product.totalStock && product.totalStock < 20 && (
            <div className="absolute top-3 right-3 bg-amber-500/90 backdrop-blur-md text-black text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 font-mono">
              Low Stock
            </div>
          )
        )}

        {activeColor && (
          <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-sm border border-[#2C2C2E] text-[9px] font-mono uppercase px-2 py-0.5 text-zinc-300">
            {activeColor}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-5 space-y-3">
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-widest text-[#8E8E93]">
            <span>{product.category || 'Oversized T-shirt'}</span>
            <span className="flex items-center gap-1 text-amber-400 font-bold bg-[#141416] px-1.5 py-0.5 border border-[#2C2C2E] rounded-sm">
              <Star size={10} className="fill-amber-400 text-amber-400" />
              <span>4.9</span>
            </span>
          </div>
          <Link to={`/product/${product.slug}`} className="block text-base font-bold uppercase tracking-tight text-[#F9F9FB] hover:text-indigo-300 transition-colors">
            {product.name}
          </Link>
          <div className="flex items-baseline space-x-2">
            <span className="text-sm font-bold text-[#F9F9FB]">₹{product.price}</span>
            <span className="text-xs line-through text-[#555555]">₹{product.mrp}</span>
            <span className="text-[10px] font-bold text-green-400 font-mono">{discount}% OFF</span>
          </div>
        </div>

        {/* Dynamic Color Swatches on Catalog Card */}
        <div className="flex items-center space-x-2 pt-1">
          <span className="text-[9px] uppercase tracking-widest text-[#555555] font-mono">Colors:</span>
          <div className="flex gap-2 flex-wrap">
            {product.colors?.map((col) => {
              const isSelected = activeColor === col;
              return (
                <button
                  key={col}
                  onMouseEnter={() => handleColorHover(col)}
                  onClick={() => handleColorHover(col)}
                  title={`View ${col} model`}
                  style={getColorStyle(col)}
                  className={`w-4 h-4 rounded-full transition-transform ${
                    isSelected ? 'ring-2 ring-white scale-110' : 'opacity-80 hover:opacity-100 hover:scale-110'
                  }`}
                ></button>
              );
            })}
          </div>
        </div>

        {/* View Product CTA */}
        <div className="pt-2">
          {isSoldOut ? (
            <Link
              to={`/product/${product.slug}`}
              className="flex items-center justify-center bg-red-950/20 border border-red-900/40 text-xs font-bold uppercase tracking-widest text-red-400 py-3 hover:bg-red-950/40 transition-all duration-300 w-full"
            >
              Sold Out &bull; View Details
            </Link>
          ) : (
            <Link
              to={`/product/${product.slug}`}
              className="flex items-center justify-center bg-[#111113] border border-[#222225] text-xs font-bold uppercase tracking-widest text-[#F9F9FB] py-3 hover:bg-[#F9F9FB] hover:text-[#0A0A0A] transition-all duration-300 w-full"
            >
              View Product
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

const Shop = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState('all'); // 'all', 'in-stock', 'sold-out'

  useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching products:', err);
        setLoading(false);
      });
  }, []);

  // Filter products based on selected mode
  const filteredProducts = products.filter((p) => {
    const isSoldOut = p.totalStock === 0 || p.inStock === false;
    if (filterMode === 'in-stock') return !isSoldOut;
    if (filterMode === 'sold-out') return isSoldOut;
    return true;
  });

  const inStockCount = products.filter(p => !(p.totalStock === 0 || p.inStock === false)).length;
  const soldOutCount = products.length - inStockCount;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 animate-fade-in">
      {/* Page Title & Filter Bar */}
      <div className="border-b border-[#1C1C1E] pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-widest text-[#F9F9FB]">Shop Collection</h1>
          <p className="text-xs text-[#8E8E93] mt-2 font-mono uppercase">
            Oversized T-Shirts &bull; Real-time Stock Inventory
          </p>
        </div>

        {/* Stock Filter Controls */}
        <div className="flex items-center gap-2 bg-[#0A0A0C] border border-[#1C1C1E] p-1 text-xs font-mono">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 uppercase tracking-wider transition-all ${
              filterMode === 'all'
                ? 'bg-white text-black font-bold'
                : 'text-[#8E8E93] hover:text-white'
            }`}
          >
            All ({products.length})
          </button>
          <button
            onClick={() => setFilterMode('in-stock')}
            className={`px-3 py-1.5 uppercase tracking-wider flex items-center gap-1.5 transition-all ${
              filterMode === 'in-stock'
                ? 'bg-green-500 text-black font-bold'
                : 'text-[#8E8E93] hover:text-green-400'
            }`}
          >
            <CheckCircle2 size={12} /> In Stock ({inStockCount})
          </button>
          {soldOutCount > 0 && (
            <button
              onClick={() => setFilterMode('sold-out')}
              className={`px-3 py-1.5 uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                filterMode === 'sold-out'
                  ? 'bg-red-500 text-white font-bold'
                  : 'text-[#8E8E93] hover:text-red-400'
              }`}
            >
              <XCircle size={12} /> Sold Out ({soldOutCount})
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-96">
          <div className="w-8 h-8 border-2 border-[#F9F9FB] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-[#2C2C2E] space-y-4">
          <ShoppingBag className="mx-auto text-[#555555]" size={40} strokeWidth={1} />
          <p className="text-sm text-[#8E8E93]">No products are currently available in the catalog.</p>
          <p className="text-[10px] text-[#555555] uppercase font-mono">All products are either hidden or unlisted.</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-[#2C2C2E] space-y-4 bg-[#0A0A0C]">
          <ShoppingBag className="mx-auto text-red-400" size={40} strokeWidth={1} />
          <h3 className="text-base font-bold uppercase text-[#F9F9FB]">
            {filterMode === 'in-stock' ? 'No In-Stock Items' : 'No Items Found'}
          </h3>
          <p className="text-xs text-[#8E8E93] max-w-md mx-auto">
            {filterMode === 'in-stock'
              ? 'Our current collection is completely sold out. Follow our social channels for announcement of the next drop.'
              : 'No items match your active filter selection.'}
          </p>
          <button
            onClick={() => setFilterMode('all')}
            className="border border-white px-6 py-2.5 text-xs font-mono uppercase tracking-widest text-white hover:bg-white hover:text-black transition-all"
          >
            Show All Products
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Shop;
