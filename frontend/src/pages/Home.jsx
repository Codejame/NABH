import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Disc, Shield, ShieldCheck } from 'lucide-react';

const Home = () => {
  const [featuredProduct, setFeaturedProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        const product = data.find((p) => p.slug === 'nabh-signature-oversized-tee' || p.slug === 'nabh-womens-graphic-oversized-tee') || data[0];
        setFeaturedProduct(product);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching products:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-24 pb-20 animate-fade-in">
      {/* Premium Hero Section */}
      <section className="relative h-[85vh] flex items-center justify-center bg-brand-black overflow-hidden border-b border-[#1C1C1E]">
        {/* Subtle grid background pattern */}
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#333_1px,transparent_1px),linear-gradient(to_bottom,#333_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
        
        {/* Big ambient color bleed */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-900/10 rounded-full blur-[120px]"></div>

        <div className="relative max-w-7xl mx-auto px-4 text-center z-10 space-y-6">
          <p className="text-xs uppercase tracking-widest text-[#8E8E93] font-medium font-mono">
            NABH WEAR &bull; COLLECTION 01
          </p>
          <h1 className="text-5xl md:text-8xl font-bold tracking-tighter text-[#F9F9FB] leading-none uppercase">
            Wear Your <br />
            <span className="text-[#F9F9FB]">Identity.</span>
          </h1>
          <p className="text-sm md:text-base text-[#8E8E93] max-w-md mx-auto font-light leading-relaxed">
            Premium, minimal streetwear constructed in India. Heavy-weight fabrics, structural drapes, and identities made to be worn.
          </p>
          <div className="pt-4">
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 bg-[#F9F9FB] text-[#0A0A0A] text-xs uppercase tracking-widest font-bold px-8 py-4 hover:bg-[#E6E6FA] transition-all duration-300"
            >
              Shop Collection <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Product Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 space-y-2">
          <p className="text-xs tracking-widest uppercase text-[#8E8E93] font-mono">The Signature T-Shirt</p>
          <h2 className="text-2xl md:text-4xl font-bold uppercase tracking-tight text-[#F9F9FB]">Featured Drop</h2>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-96">
            <div className="w-8 h-8 border-2 border-[#F9F9FB] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : featuredProduct ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center bg-[#0F0F11] border border-[#1C1C1E] p-8 md:p-12">
            <div className="relative group overflow-hidden border border-[#1C1C1E] bg-[#050505]">
              <img
                src={featuredProduct.image || (featuredProduct.lookbookMap && Object.values(featuredProduct.lookbookMap)[0])}
                alt={featuredProduct.name}
                className="w-full h-[450px] object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <span className="absolute top-4 left-4 bg-[#F9F9FB] text-[#0A0A0A] text-[10px] font-bold uppercase tracking-widest px-3 py-1 font-mono">
                Featured
              </span>
              {(featuredProduct.totalStock === 0 || featuredProduct.inStock === false) && (
                <span className="absolute top-4 right-4 bg-red-600 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 font-mono">
                  SOLD OUT
                </span>
              )}
            </div>
            
            <div className="space-y-6">
              <span className="text-xs font-semibold uppercase tracking-widest text-[#8E8E93] font-mono">
                {featuredProduct.category}
              </span>
              <h3 className="text-3xl font-bold uppercase tracking-tight text-[#F9F9FB]">
                {featuredProduct.name}
              </h3>
              <div className="flex items-baseline space-x-3">
                <span className="text-2xl font-bold text-[#F9F9FB]">₹{featuredProduct.price}</span>
                <span className="text-sm line-through text-[#555555]">₹{featuredProduct.mrp}</span>
                <span className="text-xs font-bold text-green-400 font-mono">
                  {Math.round(((featuredProduct.mrp - featuredProduct.price) / featuredProduct.mrp) * 100)}% OFF
                </span>
              </div>
              
              <p className="text-xs md:text-sm text-[#8E8E93] font-light leading-relaxed">
                {featuredProduct.description}
              </p>

              {/* Color Availability */}
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-widest text-[#555555]">Colors Available:</p>
                <div className="flex gap-2">
                  {featuredProduct.colors?.map((color) => (
                    <span
                      key={color}
                      className="text-[10px] uppercase font-mono tracking-widest border border-[#2C2C2E] px-3 py-1 text-[#8E8E93]"
                    >
                      {color}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4">
                <Link
                  to={`/product/${featuredProduct.slug}`}
                  className="inline-flex items-center justify-center gap-2 bg-[#F9F9FB] text-[#0A0A0A] text-xs uppercase tracking-widest font-bold w-full sm:w-auto px-8 py-4 hover:bg-[#E6E6FA] transition-all duration-300"
                >
                  {(featuredProduct.totalStock === 0 || featuredProduct.inStock === false) ? 'Sold Out &bull; View Look' : 'Configure & Buy'}
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-[#8E8E93]">Product data unavailable. Please seed the database.</div>
        )}
      </section>

      {/* Why NABH - Quality Section */}
      <section className="bg-[#050505] border-y border-[#1C1C1E] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3 p-6 border border-[#1C1C1E] bg-[#0A0A0A]">
              <Disc className="text-[#8E8E93]" size={28} strokeWidth={1.5} />
              <h4 className="text-sm font-bold uppercase tracking-widest text-[#F9F9FB]">240 GSM heavy-weight</h4>
              <p className="text-xs text-[#8E8E93] font-light leading-relaxed">
                Thick, durable French Terry cotton constructed to keep its structured shape and boxy fit throughout countless washes.
              </p>
            </div>
            
            <div className="space-y-3 p-6 border border-[#1C1C1E] bg-[#0A0A0A]">
              <Shield className="text-[#8E8E93]" size={28} strokeWidth={1.5} />
              <h4 className="text-sm font-bold uppercase tracking-widest text-[#F9F9FB]">Drop-shoulder drape</h4>
              <p className="text-xs text-[#8E8E93] font-light leading-relaxed">
                Meticulously designed patterns creating the perfect slouchy silhouette for modern minimal streetwear looks.
              </p>
            </div>

            <div className="space-y-3 p-6 border border-[#1C1C1E] bg-[#0A0A0A]">
              <ShieldCheck className="text-[#8E8E93]" size={28} strokeWidth={1.5} />
              <h4 className="text-sm font-bold uppercase tracking-widest text-[#F9F9FB]">Print-on-demand ready</h4>
              <p className="text-xs text-[#8E8E93] font-light leading-relaxed">
                Order details are direct-linked with Qikink fulfillment systems, ensuring professional grade print and direct-to-home courier delivery.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Brand Motion / Video Showcase Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <a
            href="https://www.instagram.com/nabh.wear/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs tracking-widest uppercase text-[#8E8E93] hover:text-[#F9F9FB] transition-colors font-mono"
          >
            <span>@NABH.WEAR</span>
            <ArrowRight size={12} />
          </a>
          <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-tight text-[#F9F9FB]">
            Identity In Motion
          </h2>
          <p className="text-xs text-[#8E8E93] max-w-md mx-auto font-light leading-relaxed">
            Engineered in India. Experience the signature NABH Wear brand motion aesthetic.
          </p>
        </div>

        <div className="relative overflow-hidden border border-[#1C1C1E] bg-[#0A0A0A] shadow-2xl">
          <div className="relative aspect-video w-full bg-black flex items-center justify-center">
            <video
              src="/videos/logomotion-720p.mp4"
              autoPlay
              loop
              muted
              playsInline
              controls
              className="w-full h-full object-contain"
            >
              <source src="/videos/logomotion-720p.mp4" type="video/mp4" />
              <source src="/logomotion-720p.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>

        <div className="text-center pt-2">
          <a
            href="https://www.instagram.com/nabh.wear/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-widest font-mono text-[#8E8E93] hover:text-[#F9F9FB] transition-colors border-b border-[#2C2C2E] pb-1"
          >
            <span>Follow our drops on Instagram</span>
            <ArrowRight size={12} />
          </a>
        </div>
      </section>

    </div>
  );
};

export default Home;
