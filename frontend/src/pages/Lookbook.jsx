import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Instagram, ArrowRight, ShoppingBag, Sparkles, Camera, CheckCircle2, Heart } from 'lucide-react';

const lookbookData = [
  {
    id: 'lb-1',
    handle: '@aarav.fits',
    city: 'Mumbai',
    category: 'Drop 01 - Signature',
    image: '/images/model-lookbook-white.png',
    productName: 'NABH Signature Oversized Tee',
    productSlug: 'nabh-oversized-t-shirt',
    color: 'White',
    quote: 'The 240 GSM heavy-weight fabric gives that authentic structured boxy drape without clinging.'
  },
  {
    id: 'lb-2',
    handle: '@kabir_raw',
    city: 'Delhi',
    category: 'Monochrome & Minimal',
    image: '/images/model-lookbook-black.jpg',
    productName: 'NABH Signature Oversized Tee',
    productSlug: 'nabh-oversized-t-shirt',
    color: 'Black',
    quote: 'Collar stays snug and tight all day. Best oversized black tee in India right now.'
  },
  {
    id: 'lb-3',
    handle: '@zara.aesthetic',
    city: 'Bangalore',
    category: 'Colorways',
    image: '/images/model-lookbook-lavender.jpg',
    productName: 'NABH Signature Oversized Tee',
    productSlug: 'nabh-oversized-t-shirt',
    color: 'Lavender',
    quote: 'The pastel lavender shade paired with charcoal denim is an absolute daily essential.'
  },
  {
    id: 'lb-4',
    handle: '@dev.street',
    city: 'Kolkata',
    category: 'Oversized Drapes',
    image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&auto=format&fit=crop&q=80',
    productName: 'NABH Signature Oversized Tee',
    productSlug: 'nabh-oversized-t-shirt',
    color: 'Black',
    quote: 'Slouchy drop-shoulder lines styled with silver chains and baggy cargo pants.'
  },
  {
    id: 'lb-5',
    handle: '@tanya_minimal',
    city: 'Pune',
    category: 'Drop 01 - Signature',
    image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&auto=format&fit=crop&q=80',
    productName: 'NABH Signature Oversized Tee',
    productSlug: 'nabh-oversized-t-shirt',
    color: 'White',
    quote: 'French Terry cotton breathability is incredible. Clean minimal streetwear constructed to last.'
  },
  {
    id: 'lb-6',
    handle: '@rohan.cuts',
    city: 'Hyderabad',
    category: 'Colorways',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
    productName: 'NABH Signature Oversized Tee',
    productSlug: 'nabh-oversized-t-shirt',
    color: 'Lavender',
    quote: 'Zero shrinkage after multiple washes. The collar doesn’t bacon or wrinkle.'
  }
];

const Lookbook = () => {
  const [filter, setFilter] = useState('All');
  const [activePhotoModal, setActivePhotoModal] = useState(null);

  const categories = ['All', 'Drop 01 - Signature', 'Oversized Drapes', 'Monochrome & Minimal', 'Colorways'];

  const filteredLooks = filter === 'All'
    ? lookbookData
    : lookbookData.filter((item) => item.category === filter);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16 animate-fade-in">
      {/* Editorial Page Header */}
      <div className="border-b border-[#1C1C1E] pb-8 text-center space-y-3">
        <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-[#8E8E93]">
          <Sparkles size={11} className="text-zinc-300" /> Community Fit Check &bull; Collection 01
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-tighter text-[#F9F9FB]">
          Tagged in #NABHWear
        </h1>
        <p className="text-xs sm:text-sm text-[#8E8E93] max-w-xl mx-auto font-light leading-relaxed">
          How our community styles their identity. Heavy-weight 240 GSM boxy drapes, drop-shoulder silhouettes, and minimal aesthetics constructed in India.
        </p>

        {/* Filter Bar */}
        <div className="pt-6 flex flex-wrap justify-center gap-2 font-mono text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-2 uppercase tracking-wider transition rounded-sm ${
                filter === cat
                  ? 'bg-white text-black font-bold shadow-md'
                  : 'bg-[#0A0A0C] border border-[#1C1C1E] text-[#8E8E93] hover:text-white hover:border-zinc-500'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Lookbook Masonry / Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredLooks.map((look) => (
          <div
            key={look.id}
            className="group bg-[#0A0A0C] border border-[#1C1C1E] hover:border-[#2C2C2E] overflow-hidden flex flex-col justify-between transition-all duration-300 shadow-xl"
          >
            {/* Image Canvas */}
            <div className="relative aspect-[3/4] w-full bg-[#050505] overflow-hidden">
              <img
                src={look.image}
                alt={`${look.productName} styled by ${look.handle}`}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />

              {/* Top Meta Pill */}
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <span className="bg-black/80 backdrop-blur-md border border-white/20 text-white text-[10px] font-mono px-2.5 py-1">
                  {look.handle}
                </span>
                <span className="bg-black/60 backdrop-blur-md border border-[#2C2C2E] text-zinc-400 text-[10px] font-mono px-2 py-1">
                  {look.city}
                </span>
              </div>

              {/* Color badge */}
              <div className="absolute top-3 right-3">
                <span className="bg-white/90 backdrop-blur-md text-black text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5">
                  {look.color}
                </span>
              </div>
            </div>

            {/* Look Details */}
            <div className="p-5 space-y-4 flex-grow flex flex-col justify-between">
              <div className="space-y-2">
                <blockquote className="text-xs text-[#8E8E93] italic leading-relaxed font-light">
                  &ldquo;{look.quote}&rdquo;
                </blockquote>
                <div className="pt-1 text-[11px] font-mono text-zinc-400">
                  Wearing: <span className="font-bold text-white uppercase">{look.productName}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-[#141416] flex items-center justify-between gap-3">
                <a
                  href="https://www.instagram.com/nabh.wear/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[11px] font-mono text-[#8E8E93] hover:text-white transition"
                >
                  <Instagram size={13} />
                  <span>Instagram</span>
                </a>

                <Link
                  to={`/product/${look.productSlug}`}
                  className="inline-flex items-center gap-1.5 bg-[#111114] border border-[#222225] hover:bg-white hover:text-black text-white text-xs font-mono font-bold uppercase tracking-wider px-3.5 py-2 transition rounded-sm"
                >
                  <ShoppingBag size={12} />
                  <span>Shop Look &rarr;</span>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Community Submission Callout Banner */}
      <div className="border border-[#1C1C1E] bg-[#0A0A0C] p-8 sm:p-12 text-center space-y-5 rounded-sm relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-60 h-60 bg-indigo-900/10 rounded-full blur-[90px]"></div>
        <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-indigo-900/10 rounded-full blur-[90px]"></div>

        <div className="relative space-y-2 max-w-xl mx-auto">
          <Camera size={28} className="mx-auto text-zinc-400 mb-2" />
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
            Get Featured In Our Lookbook
          </h2>
          <p className="text-xs sm:text-sm text-[#8E8E93] font-light leading-relaxed">
            Tag <span className="font-mono text-white font-bold">@nabh.wear</span> on Instagram with hashtag <span className="font-mono text-white font-bold">#NABHWear</span>, or upload a photo review when your package arrives. Selected community styles are featured on our homepage and rewarded with secret drop vouchers.
          </p>
        </div>

        <div className="relative pt-2 flex flex-wrap justify-center gap-4">
          <a
            href="https://www.instagram.com/nabh.wear/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white text-black font-bold text-xs uppercase font-mono tracking-widest px-6 py-3.5 hover:bg-zinc-200 transition"
          >
            <Instagram size={14} /> Follow @nabh.wear &rarr;
          </a>

          <Link
            to="/shop"
            className="inline-flex items-center gap-2 border border-[#2C2C2E] hover:border-white text-white font-bold text-xs uppercase font-mono tracking-widest px-6 py-3.5 transition"
          >
            Shop The Collection
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Lookbook;
