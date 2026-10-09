import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ArrowLeft, CreditCard, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';

const Cart = () => {
  const navigate = useNavigate();
  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    cartTotal,
    cartMrpTotal
  } = useCart();

  const discountSavings = cartMrpTotal - cartTotal;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 animate-fade-in">
      {/* Title */}
      <div className="border-b border-[#1C1C1E] pb-6">
        <h1 className="text-3xl font-bold uppercase tracking-widest text-[#F9F9FB]">Your Bag</h1>
        <p className="text-xs text-[#8E8E93] mt-2 font-mono uppercase">Review items &bull; Ready for checkout</p>
      </div>

      {cartItems.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-[#2C2C2E] space-y-6">
          <ShoppingBag className="mx-auto text-[#555555]" size={48} strokeWidth={1} />
          <div className="space-y-1">
            <h2 className="text-sm font-bold uppercase tracking-widest">Your bag is empty</h2>
            <p className="text-xs text-[#8E8E93]">It looks like you haven't added any premium pieces to your bag yet.</p>
          </div>
          <div className="pt-2">
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 bg-[#F9F9FB] text-[#0A0A0A] text-xs font-bold uppercase tracking-widest px-8 py-4 hover:bg-[#E6E6FA] transition-all"
            >
              Start Shopping
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          {/* Cart Items List */}
          <div className="lg:col-span-2 space-y-6">
            {cartItems.map((item) => (
              <div
                key={item.variantId}
                className="flex flex-col sm:flex-row gap-6 border border-[#1C1C1E] p-4 bg-[#0A0A0C]"
              >
                {/* Thumb */}
                <div className="w-full sm:w-28 aspect-[3/4] bg-[#050505] border border-[#1C1C1E] overflow-hidden flex-shrink-0">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>

                {/* Details */}
                <div className="flex-grow flex flex-col justify-between space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold uppercase tracking-tight text-[#F9F9FB]">
                        {item.name}
                      </h3>
                      <div className="flex gap-2 text-[10px] font-mono text-[#8E8E93] uppercase">
                        <span>Color: {item.color}</span>
                        <span>|</span>
                        <span>Size: {item.size}</span>
                      </div>
                      <p className="text-[10px] font-mono text-[#555555] uppercase mt-1">SKU: {item.sku}</p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.variantId)}
                      className="text-[#555555] hover:text-red-400 p-1 transition-colors"
                      title="Remove item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="flex justify-between items-end">
                    {/* Quantity Selector */}
                    <div className="flex items-center border border-[#2C2C2E] font-mono">
                      <button
                        onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                        className="px-2.5 py-1 hover:bg-[#1C1C1E] text-xs text-[#8E8E93] hover:text-white"
                      >
                        -
                      </button>
                      <span className="px-3 text-xs font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                        className="px-2.5 py-1 hover:bg-[#1C1C1E] text-xs text-[#8E8E93] hover:text-white"
                      >
                        +
                      </button>
                    </div>

                    {/* Price details */}
                    <div className="text-right space-y-0.5">
                      <div className="flex items-baseline justify-end space-x-2">
                        <span className="text-sm font-bold text-[#F9F9FB]">₹{item.price * item.quantity}</span>
                      </div>
                      <div className="text-[10px] text-[#555555] line-through">
                        ₹{item.mrp * item.quantity}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={() => navigate('/shop')}
              className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[#8E8E93] hover:text-white transition-colors pt-2 font-mono"
            >
              <ArrowLeft size={12} /> Continue Shopping
            </button>
          </div>

          {/* Cart Summary Card */}
          <div className="border border-[#1C1C1E] bg-[#0A0A0C] p-6 space-y-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[#F9F9FB] border-b border-[#1C1C1E] pb-3">
              Order Summary
            </h2>

            <div className="space-y-3 text-xs font-mono text-[#8E8E93]">
              <div className="flex justify-between">
                <span>Subtotal (MRP)</span>
                <span>₹{cartMrpTotal}</span>
              </div>
              <div className="flex justify-between text-green-400 font-semibold">
                <span>Bag Discount</span>
                <span>- ₹{discountSavings}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="text-[#F9F9FB] uppercase text-[10px]">Free</span>
              </div>
            </div>

            <hr className="border-[#1C1C1E]" />

            <div className="flex justify-between items-baseline">
              <span className="text-xs uppercase font-bold tracking-widest text-white">Total Amount</span>
              <span className="text-xl font-bold text-white">₹{cartTotal}</span>
            </div>

            <div className="pt-2">
              <button
                onClick={() => navigate('/checkout')}
                className="flex items-center justify-center gap-2 bg-[#F9F9FB] text-[#0A0A0A] text-xs font-bold uppercase tracking-widest w-full py-4.5 hover:bg-[#E6E6FA] transition-all duration-300"
              >
                <CreditCard size={14} /> Proceed to Checkout
              </button>
            </div>

            {discountSavings > 0 && (
              <div className="bg-[#1C1C1E]/50 border border-green-500/20 p-3 text-center">
                <p className="text-[10px] text-green-400 font-mono uppercase font-semibold">
                  You are saving ₹{discountSavings} on this order!
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
