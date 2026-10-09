import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext.jsx';
import { useCart } from '../context/CartContext.jsx';

const Wishlist = () => {
  const navigate = useNavigate();
  const { wishlistItems, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  const handleMoveToBag = (product) => {
    navigate(`/product/${product.slug}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 animate-fade-in">
      {/* Title */}
      <div className="border-b border-[#1C1C1E] pb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-widest text-[#F9F9FB] flex items-center gap-3">
            <Heart size={26} className="text-red-500 fill-red-500" /> Wishlist
          </h1>
          <p className="text-xs text-[#8E8E93] mt-2 font-mono uppercase">
            Saved Drops &bull; {wishlistItems.length} {wishlistItems.length === 1 ? 'Piece' : 'Pieces'}
          </p>
        </div>
      </div>

      {wishlistItems.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-[#2C2C2E] space-y-6 bg-[#0A0A0C]">
          <div className="inline-flex p-4 rounded-full bg-red-950/20 border border-red-900/30 text-red-400">
            <Heart size={40} />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold uppercase tracking-widest text-white">Your wishlist is empty</h2>
            <p className="text-xs text-[#8E8E93] max-w-sm mx-auto">
              You haven't saved any streetwear pieces yet. Click the heart icon on any drop to save it here.
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 bg-[#F9F9FB] text-[#0A0A0A] text-xs font-bold uppercase tracking-widest px-8 py-4 hover:bg-[#E6E6FA] transition-all duration-300"
            >
              Explore Collection <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {wishlistItems.map((product) => {
            const isSoldOut = product.totalStock === 0 || product.inStock === false;
            const discount = product.mrp
              ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
              : 0;

            return (
              <div
                key={product._id || product.slug}
                className="group relative flex flex-col justify-between border border-[#1C1C1E] bg-[#0A0A0C] overflow-hidden transition-all duration-300 hover:border-[#333336] shadow-xl"
              >
                {/* Lookbook Model Image */}
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#08080A] border-b border-[#1C1C1E] flex items-center justify-center p-3">
                  <Link to={`/product/${product.slug}`} className="w-full h-full">
                    <img
                      src={product.image || product.images?.[0]}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </Link>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeFromWishlist(product._id || product.slug)}
                    className="absolute top-3 right-3 p-2 bg-black/80 backdrop-blur-md border border-[#2C2C2E] text-[#8E8E93] hover:text-red-400 hover:border-red-500/40 transition-colors rounded-sm"
                    title="Remove from Wishlist"
                  >
                    <Trash2 size={14} />
                  </button>

                  <div className="absolute top-3 left-3 bg-[#F9F9FB] text-[#0A0A0A] text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 font-mono">
                    {product.category || 'Oversized Tee'}
                  </div>

                  {isSoldOut && (
                    <div className="absolute bottom-3 left-3 bg-red-600 text-white text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 font-mono">
                      SOLD OUT
                    </div>
                  )}
                </div>

                {/* Details & Actions */}
                <div className="p-5 space-y-4">
                  <div className="space-y-1">
                    <Link
                      to={`/product/${product.slug}`}
                      className="block text-base font-bold uppercase tracking-tight text-[#F9F9FB] hover:text-indigo-300 transition-colors"
                    >
                      {product.name}
                    </Link>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-sm font-bold text-[#F9F9FB]">₹{product.price}</span>
                      {product.mrp && <span className="text-xs line-through text-[#555555]">₹{product.mrp}</span>}
                      {discount > 0 && (
                        <span className="text-[10px] font-bold text-green-400 font-mono">{discount}% OFF</span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleMoveToBag(product)}
                      className="flex-1 flex items-center justify-center gap-2 bg-[#111113] border border-[#222225] text-xs font-bold uppercase tracking-widest text-[#F9F9FB] py-3 hover:bg-[#F9F9FB] hover:text-[#0A0A0A] transition-all duration-300"
                    >
                      <ShoppingBag size={14} /> View & Buy
                    </button>
                    <button
                      onClick={() => removeFromWishlist(product._id || product.slug)}
                      className="p-3 border border-[#222225] bg-[#111113] text-[#8E8E93] hover:text-red-400 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
