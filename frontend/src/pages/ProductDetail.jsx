import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShieldCheck, Truck, RefreshCw, ShoppingCart, CreditCard, ChevronRight, HelpCircle, Star, Heart, CheckCircle2, User, MessageSquarePlus, Camera, Image as ImageIcon, X } from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { useWishlist } from '../context/WishlistContext.jsx';

// Comprehensive color palette with deterministic HSL fallback for any custom color
export const getColorStyle = (colorName) => {
  if (!colorName) return { backgroundColor: '#71717A' };
  
  // Clean string: lower case, single spaces, strip punctuation
  const raw = colorName.toLowerCase().trim();
  const c = raw.replace(/[-_]/g, ' ').replace(/\s+/g, ' ');
  
  // 1. Direct comprehensive fashion garment palette
  const palette = {
    // Whites & Creams
    white: '#FFFFFF',
    'off white': '#FAF9F6',
    offwhite: '#FAF9F6',
    cream: '#FFFDD0',
    ivory: '#FFFFF0',
    pearl: '#F8F6F0',
    vanilla: '#F3E5AB',

    // Blues
    'baby blue': '#89CFF0',
    'light baby blue': '#A0D6F5',
    'light blue': '#ADD8E6',
    'sky blue': '#87CEEB',
    'powder blue': '#B0E0E6',
    'ice blue': '#AFEEEE',
    blue: '#2563EB',
    'royal blue': '#1D4ED8',
    'navy blue': '#0A192F',
    navy: '#0A192F',
    'midnight blue': '#191970',
    'electric blue': '#0066FF',
    cobalt: '#0047AB',
    cyan: '#06B6D4',
    teal: '#0D9488',
    turquoise: '#40E0D0',
    aqua: '#00FFFF',

    // Pinks
    'light baby pink': '#FFD1DC',
    'baby pink': '#FFD1DC',
    'light pink': '#FFB6C1',
    'pastel pink': '#FFD1DC',
    pink: '#EC4899',
    'dusty pink': '#D4A5A5',
    'blush pink': '#FFD1DF',
    blush: '#DE5D83',
    rose: '#F43F5E',
    'dusty rose': '#DCAE96',
    'hot pink': '#FF69B4',
    magenta: '#FF00FF',
    fuchsia: '#FF00FF',

    // Purples & Lavenders
    lavender: '#C8B4F0',
    'light lavender': '#E6E6FA',
    lilac: '#C8A2C8',
    purple: '#7E22CE',
    violet: '#7C3AED',
    mauve: '#E0B0FF',
    plum: '#8E4585',
    indigo: '#4B0082',

    // Blacks & Greys
    black: '#121212',
    'jet black': '#0A0A0A',
    charcoal: '#27272A',
    'dark grey': '#3F3F46',
    'dark gray': '#3F3F46',
    grey: '#71717A',
    gray: '#71717A',
    'heather grey': '#9E9E9E',
    'heather gray': '#9E9E9E',
    'light grey': '#D1D5DB',
    'light gray': '#D1D5DB',
    silver: '#C0C0C0',

    // Greens
    green: '#16A34A',
    'olive green': '#556B2F',
    olive: '#556B2F',
    'army green': '#4B5320',
    'sage green': '#9CAF88',
    sage: '#9CAF88',
    mint: '#6EE7B7',
    'mint green': '#98FF98',
    'forest green': '#14532D',
    'bottle green': '#064E3B',
    'emerald green': '#10B981',
    emerald: '#10B981',
    'sea green': '#2E8B57',
    'neon green': '#39FF14',
    pista: '#93C572',
    'pista green': '#93C572',

    // Yellows & Golds
    yellow: '#FACC15',
    'lemon yellow': '#FFF44F',
    lemon: '#FFF44F',
    mustard: '#CA8A04',
    gold: '#EAB308',
    golden: '#FFD700',

    // Reds & Maroons
    red: '#DC2626',
    crimson: '#991B1B',
    maroon: '#800000',
    burgundy: '#6B1124',
    wine: '#722F37',
    ruby: '#E0115F',
    rust: '#B45309',

    // Browns & Beiges
    beige: '#E5D3B3',
    khaki: '#C3B091',
    tan: '#D2B48C',
    camel: '#C19A6B',
    sand: '#C2B280',
    taupe: '#483C32',
    brown: '#78350F',
    chocolate: '#451A03',
    coffee: '#6F4E37',
    mocha: '#967969',

    // Oranges & Peaches
    orange: '#EA580C',
    peach: '#FFDAB9',
    coral: '#F87171',
    apricot: '#FBCEB1'
  };

  // Direct match
  if (palette[c]) {
    const hex = palette[c];
    const isLight = ['#FFFFFF', '#FAF9F6', '#FFFDD0', '#FFFFF0', '#F8F6F0', '#F3E5AB', '#89CFF0', '#A0D6F5', '#ADD8E6', '#87CEEB', '#B0E0E6', '#AFEEEE', '#FFD1DC', '#FFB6C1', '#C8B4F0', '#E6E6FA', '#C8A2C8', '#E5D3B3', '#C3B091', '#D2B48C', '#FACC15', '#FFF44F', '#FFDAB9'].includes(hex);
    return {
      backgroundColor: hex,
      border: isLight ? '1px solid #E4E4E7' : '1px solid rgba(255,255,255,0.2)'
    };
  }

  // 2. Intelligent Multi-Word Semantic Detection for ANY future custom color
  let resolvedHex = null;
  if (c.includes('baby blue') || (c.includes('blue') && (c.includes('baby') || c.includes('sky') || c.includes('light') || c.includes('powder') || c.includes('ice')))) {
    resolvedHex = '#89CFF0';
  } else if (c.includes('navy') || (c.includes('blue') && (c.includes('dark') || c.includes('midnight')))) {
    resolvedHex = '#0A192F';
  } else if (c.includes('blue')) {
    resolvedHex = '#2563EB';
  } else if (c.includes('pink') && (c.includes('baby') || c.includes('light') || c.includes('pastel') || c.includes('soft'))) {
    resolvedHex = '#FFD1DC';
  } else if (c.includes('pink') || c.includes('rose') || c.includes('blush')) {
    resolvedHex = '#EC4899';
  } else if (c.includes('off white') || c.includes('offwhite') || c.includes('cream') || c.includes('ivory')) {
    resolvedHex = '#FAF9F6';
  } else if (c.includes('white')) {
    resolvedHex = '#FFFFFF';
  } else if (c.includes('lavender') || c.includes('lilac') || c.includes('violet') || c.includes('purple')) {
    resolvedHex = '#C8B4F0';
  } else if (c.includes('sage') || c.includes('pista')) {
    resolvedHex = '#9CAF88';
  } else if (c.includes('olive') || c.includes('army')) {
    resolvedHex = '#556B2F';
  } else if (c.includes('mint')) {
    resolvedHex = '#6EE7B7';
  } else if (c.includes('green')) {
    resolvedHex = '#16A34A';
  } else if (c.includes('lemon') || c.includes('yellow') || c.includes('gold')) {
    resolvedHex = '#FACC15';
  } else if (c.includes('maroon') || c.includes('burgundy') || c.includes('wine')) {
    resolvedHex = '#800000';
  } else if (c.includes('red') || c.includes('crimson')) {
    resolvedHex = '#DC2626';
  } else if (c.includes('peach') || c.includes('coral') || c.includes('apricot')) {
    resolvedHex = '#FFDAB9';
  } else if (c.includes('orange')) {
    resolvedHex = '#EA580C';
  } else if (c.includes('beige') || c.includes('khaki') || c.includes('tan') || c.includes('sand')) {
    resolvedHex = '#E5D3B3';
  } else if (c.includes('brown') || c.includes('chocolate') || c.includes('coffee') || c.includes('mocha') || c.includes('rust')) {
    resolvedHex = '#78350F';
  } else if (c.includes('black') || c.includes('noir')) {
    resolvedHex = '#121212';
  } else if (c.includes('charcoal')) {
    resolvedHex = '#27272A';
  } else if (c.includes('grey') || c.includes('gray') || c.includes('silver')) {
    resolvedHex = '#71717A';
  }

  if (resolvedHex) {
    const isLight = ['#FFFFFF', '#FAF9F6', '#89CFF0', '#FFD1DC', '#C8B4F0', '#E5D3B3', '#FACC15', '#FFDAB9', '#6EE7B7', '#9CAF88'].includes(resolvedHex);
    return {
      backgroundColor: resolvedHex,
      border: isLight ? '1px solid #E4E4E7' : '1px solid rgba(255,255,255,0.2)'
    };
  }

  // 3. Deterministic HSL generator as last resort (avoid pure red default 0° by offsetting base)
  let hash = 0;
  for (let i = 0; i < c.length; i++) {
    hash = c.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs((hash + 120) % 360);
  return {
    backgroundColor: `hsl(${hue}, 55%, 50%)`,
    border: '1px solid rgba(255,255,255,0.2)'
  };
};

const ProductDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Reviews State
  const [reviewsData, setReviewsData] = useState({
    reviews: [],
    totalReviews: 0,
    averageRating: 5.0,
    breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    fitStats: { 'True to Size': 0, 'Runs Large': 0, 'Runs Small': 0 }
  });
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    name: '',
    rating: 5,
    title: '',
    comment: '',
    fit: 'True to Size',
    photos: []
  });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState('');
  const [activeLightboxImage, setActiveLightboxImage] = useState(null);

  const handleReviewPhotoUpload = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = () => {
        setReviewForm((prev) => ({
          ...prev,
          photos: [...(prev.photos || []), reader.result]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeReviewPhoto = (index) => {
    setReviewForm((prev) => ({
      ...prev,
      photos: (prev.photos || []).filter((_, i) => i !== index)
    }));
  };

  // User Selections (Amazon/Flipkart Model)
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeViewIndex, setActiveViewIndex] = useState(0); // 0 = Front, 1 = Back

  // Details Tabs
  const [activeTab, setActiveTab] = useState('fabric');
  const [showSizeChart, setShowSizeChart] = useState(false);

  const fetchReviews = () => {
    fetch(`/api/reviews/product/${slug}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.reviews) {
          setReviewsData(data);
        }
      })
      .catch((err) => console.error('Error fetching reviews:', err));
  };

  useEffect(() => {
    fetch(`/api/products/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error('Product not found');
        return res.json();
      })
      .then((data) => {
        setProduct(data.product);
        setVariants(data.variants);
        
        // Default Selections
        if (data.variants && data.variants.length > 0) {
          setSelectedColor(data.variants[0].color);
          setSelectedSize(data.variants[0].size);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching product detail:', err);
        setError(err.message);
        setLoading(false);
      });

    fetchReviews();
  }, [slug]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewForm.name || !reviewForm.comment) {
      alert('Please provide your name and review comments.');
      return;
    }
    setSubmittingReview(true);
    try {
      const res = await fetch('/api/reviews/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product._id,
          name: reviewForm.name,
          rating: reviewForm.rating,
          title: reviewForm.title,
          comment: reviewForm.comment,
          fit: reviewForm.fit,
          photos: reviewForm.photos || []
        })
      });
      const data = await res.json();
      if (res.ok) {
        setReviewSuccessMsg('Your fit review was posted successfully!');
        setReviewForm({ name: '', rating: 5, title: '', comment: '', fit: 'True to Size', photos: [] });
        setShowReviewForm(false);
        fetchReviews();
        setTimeout(() => setReviewSuccessMsg(''), 5000);
      } else {
        throw new Error(data.message || 'Failed to submit review');
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  // Dynamic Color-Image Grouping with lookbookMap support
  const colorImageGroups = useMemo(() => {
    if (!product) return {};

    const groups = {};
    const allImages = (product.images && product.images.length > 0)
      ? product.images
      : (product.image ? [product.image] : []);

    const uniqueColors = [...new Set(variants.map((v) => v.color).filter(Boolean))];
    const lookbookMap = product.lookbookMap
      ? (product.lookbookMap instanceof Map ? Object.fromEntries(product.lookbookMap) : product.lookbookMap)
      : {};

    const defaultLookbooks = {
      white: '/images/model-lookbook-white.png',
      black: '/images/model-lookbook-black.jpg',
      lavender: '/images/model-lookbook-lavender.jpg'
    };

    if (uniqueColors.length === 0) {
      const primaryPhoto = (product.image && !product.image.includes('tempImages')) ? product.image : allImages[0];
      groups['Default'] = primaryPhoto ? [{ label: 'Model Photoshoot', url: primaryPhoto }] : [];
      return groups;
    }

    uniqueColors.forEach((color) => {
      const colorLower = color.toLowerCase().trim();
      const colorViews = [];

      // Only model photoshoot - no flat mockups (no front and no back)
      const lookbookUrl = lookbookMap[colorLower] 
        || (product.gender !== 'women' && defaultLookbooks[colorLower] ? defaultLookbooks[colorLower] : null)
        || (product.image && !product.image.includes('tempImages') ? product.image : null);

      if (lookbookUrl) {
        colorViews.push({ label: 'Model Photoshoot', url: lookbookUrl });
      } else if (allImages.length > 0 && !allImages[0].includes('tempImages')) {
        colorViews.push({ label: 'Model Photoshoot', url: allImages[0] });
      }

      groups[color] = colorViews;
    });

    return groups;
  }, [product, variants]);

  // Current active color images
  const currentColorImages = colorImageGroups[selectedColor] || (product ? [{ label: 'Model Photoshoot', url: product.image }] : []);
  const currentDisplayImage = currentColorImages[activeViewIndex]?.url || currentColorImages[0]?.url || product?.image;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <div className="w-8 h-8 border-2 border-[#F9F9FB] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center space-y-4">
        <h2 className="text-xl font-bold uppercase">Product Not Found</h2>
        <p className="text-xs text-[#8E8E93]">The t-shirt model you are requesting does not exist in our system.</p>
        <button onClick={() => navigate('/shop')} className="border border-white px-6 py-3 text-xs uppercase font-mono tracking-widest text-white">
          Back to Shop
        </button>
      </div>
    );
  }

  // Get available colors & sizes dynamically from the database
  const colors = [...new Set(variants.map((v) => v.color).filter(Boolean))];
  const sizes = ['S', 'M', 'L', 'XL', 'XXL'];

  // Find currently selected variant details
  const activeVariant = variants.find(
    (v) => v.color === selectedColor && v.size === selectedSize
  );

  const activeMrp = activeVariant?.mrp || 999;
  const activePrice = activeVariant?.price || 799;
  const discount = Math.round(((activeMrp - activePrice) / activeMrp) * 100);

  const handleColorChange = (newColor) => {
    setSelectedColor(newColor);
    const newGroup = colorImageGroups[newColor] || [];
    if (activeViewIndex >= newGroup.length) {
      setActiveViewIndex(0);
    }
  };

  const handleAddToCart = (redirectToCheck = false) => {
    if (!activeVariant) return;

    if (activeVariant.inventory <= 0) {
      alert('This size-color combination is currently out of stock.');
      return;
    }

    const item = {
      variantId: activeVariant._id,
      productId: product._id,
      name: product.name,
      image: currentColorImages[0]?.url || currentDisplayImage,
      color: selectedColor,
      size: selectedSize,
      price: activeVariant.price,
      mrp: activeVariant.mrp,
      sku: activeVariant.sku,
      quantity: quantity
    };

    addToCart(item);

    if (redirectToCheck) {
      navigate('/checkout');
    } else {
      navigate('/cart');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in space-y-16">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-[10px] uppercase font-mono tracking-widest text-[#555555]">
        <span className="hover:text-white cursor-pointer" onClick={() => navigate('/')}>Home</span>
        <ChevronRight size={10} />
        <span className="hover:text-white cursor-pointer" onClick={() => navigate('/shop')}>Shop</span>
        <ChevronRight size={10} />
        <span className="text-[#8E8E93]">{product.name}</span>
      </div>

      {/* Main product block */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Left Column: Amazon/Flipkart Model Image Stage */}
        <div className="space-y-6">
          {/* Main Display Stage */}
          <div className="relative aspect-square w-full bg-[#08080A] border border-[#1C1C1E] rounded-sm overflow-hidden flex items-center justify-center group shadow-2xl">
            <img
              src={currentDisplayImage}
              alt={`${product.name} - ${selectedColor}`}
              className="w-full h-full object-contain transition-opacity duration-300"
            />

            {/* Color & Model Indicator Pill */}
            <div className="absolute top-4 left-4 flex gap-2">
              <span className="bg-[#111113]/90 backdrop-blur-md border border-[#2C2C2E] text-[10px] font-mono uppercase tracking-widest px-3 py-1 text-white">
                {selectedColor} &bull; Model Photoshoot
              </span>
            </div>
          </div>

          {/* Additional Photoshoot Views (Only shown if multiple model photos exist) */}
          {currentColorImages.length > 1 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono tracking-widest text-[#555555]">
                  {selectedColor} Photoshoot Views ({currentColorImages.length})
                </span>
              </div>
              
              <div className="flex gap-4">
                {currentColorImages.map((view, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveViewIndex(idx)}
                    className={`flex flex-col items-center gap-1.5 p-2 bg-[#08080A] border rounded-sm transition-all duration-200 ${
                      activeViewIndex === idx
                        ? 'border-white ring-1 ring-white shadow-lg'
                        : 'border-[#1C1C1E] opacity-70 hover:opacity-100 hover:border-[#333336]'
                    }`}
                  >
                    <div className="w-20 sm:w-24 aspect-square flex items-center justify-center overflow-hidden bg-[#050505]">
                      <img src={view.url} alt={view.label} className="w-full h-full object-cover" />
                    </div>
                    <span className={`text-[10px] font-mono uppercase tracking-wider ${
                      activeViewIndex === idx ? 'text-white font-bold' : 'text-[#8E8E93]'
                    }`}>
                      {view.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Configuring Selection */}
        <div className="space-y-8">
          <div className="space-y-3">
            <span className="text-xs uppercase tracking-widest text-[#8E8E93] font-mono">{product.category}</span>
            <h1 className="text-3xl md:text-4xl font-bold uppercase tracking-tight text-[#F9F9FB]">
              {product.name}
            </h1>

            {/* Star Rating & Social Proof Bar */}
            <div className="flex items-center gap-3 pt-1 text-xs">
              {reviewsData.totalReviews > 0 ? (
                <>
                  <div className="flex text-amber-400">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={14}
                        className={star <= Math.round(reviewsData.averageRating) ? 'fill-amber-400 text-amber-400' : 'text-zinc-700'}
                      />
                    ))}
                  </div>
                  <span className="font-bold text-white font-mono">{reviewsData.averageRating}</span>
                  <button
                    onClick={() => setActiveTab('reviews')}
                    className="text-[#8E8E93] hover:text-white underline font-mono text-[11px] transition"
                  >
                    ({reviewsData.totalReviews} {reviewsData.totalReviews === 1 ? 'Review' : 'Reviews'})
                  </button>
                  <span className="text-zinc-600">&bull;</span>
                  <span className="text-green-400 font-mono text-[10px] uppercase font-semibold">
                    {reviewsData.fitPercentages?.trueToSize ?? 100}% True to Size
                  </span>
                </>
              ) : (
                <button
                  onClick={() => {
                    setActiveTab('reviews');
                    setShowReviewForm(true);
                  }}
                  className="text-xs font-mono text-[#8E8E93] hover:text-white flex items-center gap-1.5 transition"
                >
                  <span className="text-amber-400">★ ★ ★ ★ ★</span>
                  <span className="underline">No reviews yet &bull; Be the first to review</span>
                </button>
              )}
            </div>
            
            <div className="flex items-baseline space-x-3 pt-2">
              <span className="text-3xl font-bold text-[#F9F9FB]">₹{activeVariant?.price || 799}</span>
              <span className="text-base line-through text-[#555555]">₹{activeVariant?.mrp || 999}</span>
              <span className="text-xs font-bold text-green-400 font-mono">{discount}% OFF</span>
            </div>
            <p className="text-[10px] text-[#555555] uppercase font-mono">MRP inclusive of all taxes.</p>
          </div>

          <hr className="border-[#1C1C1E]" />

          {/* Dynamic Color Selector for ANY Color in Store */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs uppercase font-mono tracking-widest text-[#F9F9FB] font-semibold">
                Color: <span className="text-[#8E8E93] font-normal">{selectedColor}</span>
              </span>
            </div>
            <div className="flex flex-wrap gap-3">
              {colors.map((color) => {
                const isSelected = selectedColor === color;
                const style = getColorStyle(color);
                const colorVariants = variants.filter(v => v.color === color);
                const hasStockInColor = colorVariants.some(v => v.inventory > 0);

                return (
                  <button
                    key={color}
                    onClick={() => handleColorChange(color)}
                    className={`flex items-center gap-2.5 px-3.5 py-2 border rounded-sm transition-all ${
                      isSelected
                        ? 'border-white bg-[#1C1C1E] text-white shadow-md'
                        : 'border-[#2C2C2E] bg-[#0A0A0C] text-[#8E8E93] hover:border-white hover:text-white'
                    } ${!hasStockInColor ? 'opacity-60' : ''}`}
                  >
                    <span className="w-4 h-4 rounded-full" style={style}></span>
                    <span className="text-xs font-mono uppercase tracking-wider">{color}</span>
                    {!hasStockInColor && (
                      <span className="text-[8px] font-mono text-red-400 uppercase bg-red-950/60 px-1 py-0.2 border border-red-500/20">
                        Sold Out
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Size Selector */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs uppercase font-mono tracking-widest text-[#F9F9FB] font-semibold">
                Size: <span className="text-[#8E8E93] font-normal">{selectedSize}</span>
              </span>
              <button
                onClick={() => setShowSizeChart(true)}
                className="text-[10px] uppercase font-mono tracking-widest text-indigo-400 flex items-center gap-1 hover:text-white"
              >
                <HelpCircle size={12} /> Size Chart
              </button>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {sizes.map((size) => {
                const matches = variants.find((v) => v.color === selectedColor && v.size === size);
                const isOutOfStock = matches ? matches.inventory <= 0 : true;

                return (
                  <button
                    key={size}
                    disabled={isOutOfStock}
                    onClick={() => setSelectedSize(size)}
                    className={`relative border py-3.5 text-xs font-mono transition-all duration-200 ${
                      isOutOfStock
                        ? 'border-dashed border-red-950/40 bg-red-950/10 text-red-400/50 cursor-not-allowed line-through'
                        : selectedSize === size
                        ? 'bg-[#F9F9FB] border-white text-[#0A0A0A] font-bold shadow'
                        : 'border-[#2C2C2E] text-[#8E8E93] hover:border-[#F9F9FB] hover:text-white'
                    }`}
                  >
                    {size}
                    {isOutOfStock && (
                      <span className="block text-[7px] uppercase font-mono text-red-500/80">Out</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity and Actions */}
          <div className="space-y-4 pt-4">
            {activeVariant && activeVariant.inventory > 0 && (
              <div className="flex items-center space-x-4">
                <span className="text-xs uppercase font-mono tracking-widest text-[#8E8E93]">Quantity:</span>
                <div className="flex items-center border border-[#2C2C2E] font-mono">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-1.5 hover:bg-[#1C1C1E] text-sm text-[#8E8E93] hover:text-white"
                  >
                    -
                  </button>
                  <span className="px-4 text-xs font-semibold">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(activeVariant.inventory, quantity + 1))}
                    className="px-3 py-1.5 hover:bg-[#1C1C1E] text-sm text-[#8E8E93] hover:text-white"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Live Inventory Status Indicators */}
            {activeVariant && activeVariant.inventory <= 0 ? (
              <div className="bg-red-950/30 border border-red-500/30 p-3 rounded-sm">
                <p className="text-xs text-red-400 font-mono uppercase font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                  Out of Stock in {selectedColor} ({selectedSize})
                </p>
                <p className="text-[10px] text-[#8E8E93] mt-1 font-mono">
                  This specific size and color is currently sold out. Please select another size or color.
                </p>
              </div>
            ) : activeVariant && activeVariant.inventory < 15 ? (
              <p className="text-[10px] text-orange-400 font-mono uppercase flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
                Only {activeVariant.inventory} items left in stock. Order soon!
              </p>
            ) : (
              <p className="text-[10px] text-green-400 font-mono uppercase flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                In Stock &bull; Ready for instant dispatch
              </p>
            )}

            <div className="pt-2">
              {activeVariant && activeVariant.inventory <= 0 ? (
                <div className="flex gap-3">
                  <button
                    disabled
                    className="flex-1 bg-red-950/20 border border-red-900/40 text-red-400 text-xs font-bold uppercase tracking-widest py-4.5 cursor-not-allowed font-mono opacity-80"
                  >
                    Sold Out &bull; Unavailable
                  </button>
                  <button
                    onClick={() => toggleWishlist(product)}
                    className={`px-5 py-4.5 border transition-all flex items-center justify-center ${
                      isInWishlist(product._id || product.slug)
                        ? 'border-red-500 bg-red-950/30 text-red-400'
                        : 'border-[#2C2C2E] bg-[#0A0A0C] text-[#8E8E93] hover:text-white hover:border-white'
                    }`}
                    title="Save to Wishlist"
                  >
                    <Heart size={18} className={isInWishlist(product._id || product.slug) ? 'fill-red-500 text-red-500' : ''} />
                  </button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={() => handleAddToCart(false)}
                      className="flex items-center justify-center gap-2 border border-white text-xs font-bold uppercase tracking-widest text-white py-4.5 hover:bg-white hover:text-[#0A0A0A] transition-all duration-300"
                    >
                      <ShoppingCart size={15} /> Add to Cart
                    </button>
                    <button
                      onClick={() => handleAddToCart(true)}
                      className="flex items-center justify-center gap-2 bg-[#F9F9FB] text-[#0A0A0A] text-xs font-bold uppercase tracking-widest py-4.5 hover:bg-[#E6E6FA] transition-all duration-300"
                    >
                      <CreditCard size={15} /> Buy Now
                    </button>
                  </div>
                  <button
                    onClick={() => toggleWishlist(product)}
                    className={`px-5 py-4.5 border transition-all flex items-center justify-center ${
                      isInWishlist(product._id || product.slug)
                        ? 'border-red-500 bg-red-950/30 text-red-400'
                        : 'border-[#2C2C2E] bg-[#0A0A0C] text-[#8E8E93] hover:text-white hover:border-white'
                    }`}
                    title={isInWishlist(product._id || product.slug) ? 'Remove from Wishlist' : 'Add to Wishlist'}
                  >
                    <Heart size={18} className={isInWishlist(product._id || product.slug) ? 'fill-red-500 text-red-500' : ''} />
                  </button>
                </div>
              )}
            </div>
          </div>

          <hr className="border-[#1C1C1E]" />

          {/* Details Accordion / Tabs */}
          <div className="space-y-4">
            <div className="flex border-b border-[#1C1C1E] overflow-x-auto text-[10px] font-mono uppercase tracking-widest">
              {[
                { id: 'fabric', label: 'Fabric' },
                { id: 'fit', label: 'Fit Info' },
                { id: 'shipping', label: 'Shipping' },
                { id: 'returns', label: 'Returns' },
                { id: 'reviews', label: `Reviews (${reviewsData.totalReviews})` }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2.5 px-4 border-b-2 whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'border-[#F9F9FB] text-[#F9F9FB] font-bold'
                      : 'border-transparent text-[#555555] hover:text-[#8E8E93]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="text-xs text-[#8E8E93] leading-relaxed font-light py-2">
              {activeTab === 'fabric' && (
                <p>Constructed from premium 240 GSM heavy-weight French Terry cotton. 100% combed cotton, loopback knit structure, double-needle stitched cuffs and hem. Bio-washed and pre-shrunk for zero post-wash shrinkage.</p>
              )}
              {activeTab === 'fit' && (
                <p>Designed with an intentional boxy, oversized streetwear fit. Features drop shoulders, wider chest drapes, and a thick rib-knit crew neck collar that holds its structure. We recommend ordering your true size for the intended boxy aesthetic.</p>
              )}
              {activeTab === 'shipping' && (
                <p>Orders are dispatched from our warehouse within 2-3 business days. Courier partners include Delhivery, Xpressbees, and BlueDart. Nationwide shipping across India is free on all orders.</p>
              )}
              {activeTab === 'returns' && (
                <p>We provide a 7-day hassle-free replacement or return window if the garment is unworn, unwashed, and still has all tags intact. Standard refund requests will be processed to the original payment source.</p>
              )}

              {/* Reviews Tab Content */}
              {activeTab === 'reviews' && (
                <div className="space-y-6 pt-2">
                  {/* Rating Summary Bar */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#08080A] border border-[#1C1C1E] p-4">
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-bold text-white font-mono">{reviewsData.averageRating}</span>
                          <span className="text-xs text-[#555555]">/ 5.0</span>
                        </div>
                        <div className="flex text-amber-400">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} size={14} className={s <= Math.round(reviewsData.averageRating) ? 'fill-amber-400 text-amber-400' : 'text-zinc-700'} />
                          ))}
                        </div>
                        <p className="text-[10px] font-mono text-[#8E8E93] uppercase">
                          Based on {reviewsData.totalReviews} verified {reviewsData.totalReviews === 1 ? 'rating' : 'ratings'}
                        </p>
                      </div>

                      {/* Dynamic 5-to-1 Star Distribution Bars */}
                      <div className="space-y-1 pt-1 font-mono text-[10px]">
                        {[5, 4, 3, 2, 1].map((starNum) => {
                          const count = reviewsData.breakdown?.[starNum] || 0;
                          const pct = reviewsData.totalReviews > 0
                            ? Math.round((count / reviewsData.totalReviews) * 100)
                            : 0;
                          return (
                            <div key={starNum} className="flex items-center gap-2 text-[#8E8E93]">
                              <span className="w-3 text-right">{starNum}★</span>
                              <div className="flex-1 bg-[#1C1C1E] h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-amber-400 h-full transition-all duration-500 rounded-full"
                                  style={{ width: `${pct}%` }}
                                ></div>
                              </div>
                              <span className="w-8 text-right text-[9px] text-[#555555]">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-3 font-mono justify-between flex flex-col border-t md:border-t-0 md:border-l border-[#1C1C1E] md:pl-6 pt-3 md:pt-0">
                      <div className="space-y-1.5">
                        <span className="text-[#555555] uppercase text-[10px]">Fit Consensus:</span>
                        <p className="text-white font-bold text-xs leading-relaxed">
                          {reviewsData.fitPercentages?.trueToSize ?? 100}% True to Size &bull; {reviewsData.fitPercentages?.runsLarge ?? 0}% Runs Large &bull; {reviewsData.fitPercentages?.runsSmall ?? 0}% Runs Small
                        </p>
                        <p className="text-[10px] text-[#8E8E93] font-light font-sans">
                          Ratings are calculated dynamically in real time based on actual buyer submissions.
                        </p>
                      </div>

                      <button
                        onClick={() => setShowReviewForm(!showReviewForm)}
                        className="bg-[#1C1C1E] hover:bg-white hover:text-black text-white text-[10px] font-bold uppercase tracking-wider py-2.5 px-4 transition flex items-center justify-center gap-1.5 rounded-sm border border-[#2C2C2E]"
                      >
                        <MessageSquarePlus size={13} /> {showReviewForm ? 'Close Review Form' : '+ Write a Dynamic Review'}
                      </button>
                    </div>
                  </div>

                  {reviewSuccessMsg && (
                    <div className="bg-green-950/40 border border-green-500/30 p-3 text-xs font-mono text-green-400 flex items-center gap-2">
                      <CheckCircle2 size={14} /> {reviewSuccessMsg}
                    </div>
                  )}

                  {/* Write Review Form */}
                  {showReviewForm && (
                    <form onSubmit={handleSubmitReview} className="bg-[#050505] border border-[#2C2C2E] p-5 space-y-4 animate-fade-in">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-white">Share Your Review</h4>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-mono text-[#8E8E93]">Your Name *</label>
                          <input
                            type="text"
                            value={reviewForm.name}
                            onChange={(e) => setReviewForm({ ...reviewForm, name: e.target.value })}
                            placeholder="e.g. Partha M."
                            required
                            className="w-full bg-[#0A0A0C] border border-[#1C1C1E] text-xs text-white p-2.5 focus:border-white focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-mono text-[#8E8E93]">Rating *</label>
                          <div className="flex gap-2 items-center pt-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                                className="text-amber-400 p-1 hover:scale-110 transition"
                              >
                                <Star size={18} className={star <= reviewForm.rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-700'} />
                              </button>
                            ))}
                            <span className="text-xs font-mono text-white ml-2">{reviewForm.rating} Stars</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-mono text-[#8E8E93]">Review Comments *</label>
                        <textarea
                          rows={3}
                          value={reviewForm.comment}
                          onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                          placeholder="Tell us about the fabric weight, collar feel, and print quality..."
                          required
                          className="w-full bg-[#0A0A0C] border border-[#1C1C1E] text-xs text-white p-2.5 focus:border-white focus:outline-none"
                        />
                      </div>

                      {/* Fit Check Outfit Photos Upload */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] uppercase font-mono text-[#8E8E93] flex items-center gap-1.5">
                            <Camera size={12} /> Add Fit Pic / Outfit Photos (Optional)
                          </label>
                          <span className="text-[9px] font-mono text-zinc-500">Show how you wear it</span>
                        </div>

                        <div className="flex flex-wrap gap-3 items-center">
                          <label className="flex items-center gap-2 border border-dashed border-[#2C2C2E] hover:border-white px-3.5 py-2 bg-[#0A0A0C] cursor-pointer text-xs font-mono text-zinc-300 hover:text-white transition rounded-sm">
                            <Camera size={13} className="text-zinc-400" />
                            <span>+ Choose Photos</span>
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={handleReviewPhotoUpload}
                              className="hidden"
                            />
                          </label>

                          {reviewForm.photos?.map((photo, pIdx) => (
                            <div key={pIdx} className="relative w-12 h-14 border border-[#2C2C2E] overflow-hidden rounded-sm group bg-black">
                              <img src={photo} alt="Fit pic preview" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => removeReviewPhoto(pIdx)}
                                className="absolute top-0.5 right-0.5 bg-red-600/90 hover:bg-red-600 text-white rounded-full p-0.5"
                                title="Remove photo"
                              >
                                <X size={9} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={submittingReview}
                        className="bg-white text-black font-bold text-xs uppercase tracking-widest px-6 py-3 hover:bg-indigo-100 transition disabled:opacity-50"
                      >
                        {submittingReview ? 'Submitting...' : 'Post Review'}
                      </button>
                    </form>
                  )}

                  {/* Customer Fit Pics Gallery Carousel */}
                  {(() => {
                    const reviewsWithPhotos = reviewsData.reviews.filter((r) => r.photos && r.photos.length > 0);
                    const totalPhotosCount = reviewsWithPhotos.reduce((sum, r) => sum + r.photos.length, 0);
                    if (totalPhotosCount === 0) return null;

                    return (
                      <div className="space-y-3 bg-[#08080A] border border-[#1C1C1E] p-4 rounded-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono uppercase tracking-widest text-white font-bold flex items-center gap-2">
                            <Camera size={13} className="text-zinc-400" /> Customer Fit Pics ({totalPhotosCount})
                          </span>
                          <span className="text-[10px] font-mono text-[#8E8E93]">Click photo to inspect fit</span>
                        </div>
                        <div className="flex gap-3 overflow-x-auto pb-1">
                          {reviewsWithPhotos.map((rev) =>
                            rev.photos.map((pUrl, pIdx) => (
                              <button
                                key={`${rev._id}-${pIdx}`}
                                type="button"
                                onClick={() =>
                                  setActiveLightboxImage({
                                    url: pUrl,
                                    author: rev.name,
                                    rating: rev.rating,
                                    fit: rev.fit,
                                    title: rev.title,
                                    comment: rev.comment
                                  })
                                }
                                className="relative flex-shrink-0 w-24 h-28 sm:w-28 sm:h-32 bg-black border border-[#222225] hover:border-white transition overflow-hidden group rounded-sm"
                              >
                                <img
                                  src={pUrl}
                                  alt={`Fit pic by ${rev.name}`}
                                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                />
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-1.5 text-left">
                                  <span className="text-[9px] font-mono text-zinc-200 font-bold block truncate">
                                    {rev.name}
                                  </span>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Reviews List */}
                  {reviewsData.reviews.length === 0 ? (
                    <div className="text-center py-8 text-xs font-mono text-[#8E8E93] border border-dashed border-[#1C1C1E]">
                      No reviews submitted yet. Be the first to review this streetwear drop!
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {reviewsData.reviews.map((rev) => (
                        <div key={rev._id} className="border border-[#1C1C1E] bg-[#0A0A0C] p-4 space-y-2.5">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white text-xs">{rev.name}</span>
                                {rev.verifiedBuyer && (
                                  <span className="text-[9px] font-mono text-green-400 flex items-center gap-0.5 bg-green-950/40 px-1.5 py-0.2 border border-green-500/20">
                                    <CheckCircle2 size={9} /> Verified Buyer
                                  </span>
                                )}
                              </div>
                              <div className="flex text-amber-400 mt-1">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star key={s} size={11} className={s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-700'} />
                                ))}
                              </div>
                            </div>
                            <span className="text-[9px] font-mono text-[#555555]">
                              {new Date(rev.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                            </span>
                          </div>

                          <p className="text-xs text-[#8E8E93] leading-relaxed">{rev.comment}</p>

                          {/* Customer Fit Check Photos Thumbnail Row */}
                          {rev.photos && rev.photos.length > 0 && (
                            <div className="flex gap-2 pt-1">
                              {rev.photos.map((p, pIdx) => (
                                <button
                                  key={pIdx}
                                  type="button"
                                  onClick={() =>
                                    setActiveLightboxImage({
                                      url: p,
                                      author: rev.name,
                                      rating: rev.rating,
                                      fit: rev.fit,
                                      title: rev.title,
                                      comment: rev.comment
                                    })
                                  }
                                  className="w-14 h-16 sm:w-16 sm:h-18 bg-black border border-[#222225] hover:border-white transition rounded-sm overflow-hidden flex-shrink-0"
                                >
                                  <img src={p} alt="Fit pic thumbnail" className="w-full h-full object-cover" />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Size Chart Modal */}
      {showSizeChart && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#0F0F11] border border-[#1C1C1E] max-w-lg w-full p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-[#1C1C1E] pb-3">
              <h3 className="text-sm font-bold uppercase tracking-widest text-[#F9F9FB]">Oversized Tee Size Guide</h3>
              <button onClick={() => setShowSizeChart(false)} className="text-xs uppercase font-mono tracking-widest text-[#8E8E93] hover:text-white">
                Close
              </button>
            </div>
            
            <p className="text-[10px] text-[#8E8E93] leading-relaxed">
              *Measurements are in inches. Our oversized t-shirts have a relaxed, slouchy shoulder, and running wider than standard sizes.
            </p>

            <table className="w-full border-collapse border border-[#2C2C2E] text-left text-xs font-mono">
              <thead>
                <tr className="bg-[#1C1C1E] text-white">
                  <th className="border border-[#2C2C2E] p-2">Size</th>
                  <th className="border border-[#2C2C2E] p-2">Chest (Width)</th>
                  <th className="border border-[#2C2C2E] p-2">Length</th>
                  <th className="border border-[#2C2C2E] p-2">Sleeve Length</th>
                </tr>
              </thead>
              <tbody className="text-[#8E8E93]">
                <tr>
                  <td className="border border-[#2C2C2E] p-2 font-bold text-white">S</td>
                  <td className="border border-[#2C2C2E] p-2">42</td>
                  <td className="border border-[#2C2C2E] p-2">27.5</td>
                  <td className="border border-[#2C2C2E] p-2">8.5</td>
                </tr>
                <tr>
                  <td className="border border-[#2C2C2E] p-2 font-bold text-white">M</td>
                  <td className="border border-[#2C2C2E] p-2">44</td>
                  <td className="border border-[#2C2C2E] p-2">28.5</td>
                  <td className="border border-[#2C2C2E] p-2">9.0</td>
                </tr>
                <tr>
                  <td className="border border-[#2C2C2E] p-2 font-bold text-white">L</td>
                  <td className="border border-[#2C2C2E] p-2">46</td>
                  <td className="border border-[#2C2C2E] p-2">29.5</td>
                  <td className="border border-[#2C2C2E] p-2">9.5</td>
                </tr>
                <tr>
                  <td className="border border-[#2C2C2E] p-2 font-bold text-white">XL</td>
                  <td className="border border-[#2C2C2E] p-2">48</td>
                  <td className="border border-[#2C2C2E] p-2">30.5</td>
                  <td className="border border-[#2C2C2E] p-2">10.0</td>
                </tr>
                <tr>
                  <td className="border border-[#2C2C2E] p-2 font-bold text-white">XXL</td>
                  <td className="border border-[#2C2C2E] p-2">50</td>
                  <td className="border border-[#2C2C2E] p-2">31.5</td>
                  <td className="border border-[#2C2C2E] p-2">10.5</td>
                </tr>
              </tbody>
            </table>

            <div className="pt-2 text-center">
              <button
                onClick={() => setShowSizeChart(false)}
                className="bg-[#F9F9FB] text-[#0A0A0A] text-xs font-bold uppercase tracking-widest w-full py-3 hover:bg-[#E6E6FA] transition-all"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Fit Pic Lightbox Modal */}
      {activeLightboxImage && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative bg-[#0D0D10] border border-[#2C2C2E] max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl rounded-sm animate-fade-in">
            <div className="flex justify-between items-center p-4 border-b border-[#1C1C1E] bg-[#111114]">
              <div className="flex items-center gap-2">
                <Camera size={14} className="text-zinc-400" />
                <span className="text-xs font-bold uppercase text-white font-mono">
                  {activeLightboxImage.author}&apos;s Photo Review
                </span>
              </div>
              <button
                onClick={() => setActiveLightboxImage(null)}
                className="text-[#8E8E93] hover:text-white p-1 transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 bg-black flex items-center justify-center overflow-hidden p-3 max-h-[60vh]">
              <img
                src={activeLightboxImage.url}
                alt="Customer photo review"
                className="max-h-full max-w-full object-contain rounded-sm"
              />
            </div>

            <div className="p-4 border-t border-[#1C1C1E] bg-[#0A0A0C] space-y-1 text-xs">
              <div className="flex text-amber-400">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={12}
                    className={s <= activeLightboxImage.rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-700'}
                  />
                ))}
              </div>
              {activeLightboxImage.comment && (
                <p className="text-[#8E8E93] text-xs leading-relaxed pt-1">{activeLightboxImage.comment}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
