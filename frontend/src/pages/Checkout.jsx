import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { ShieldCheck, Loader2, CreditCard, CheckCircle2 } from 'lucide-react';

const Checkout = () => {
  const navigate = useNavigate();
  const { cartItems, cartTotal, clearCart } = useCart();
  const { user } = useAuth();

  // Form states
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    streetAddress: user?.addresses?.[0]?.streetAddress || '',
    city: user?.addresses?.[0]?.city || '',
    state: user?.addresses?.[0]?.state || '',
    pincode: user?.addresses?.[0]?.pincode || '',
  });

  const [selectedAddressId, setSelectedAddressId] = useState(
    user?.addresses?.find((a) => a.isDefault)?._id || user?.addresses?.[0]?._id || null
  );

  useEffect(() => {
    if (user) {
      const defaultAddr = user?.addresses?.find((a) => a.isDefault) || user?.addresses?.[0];
      setFormData((prev) => ({
        ...prev,
        name: prev.name || user.name || '',
        phone: prev.phone || user.phone || '',
        email: prev.email || user.email || '',
        streetAddress: prev.streetAddress || defaultAddr?.streetAddress || '',
        city: prev.city || defaultAddr?.city || '',
        state: prev.state || defaultAddr?.state || '',
        pincode: prev.pincode || defaultAddr?.pincode || '',
      }));
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr._id);
      }
    }
  }, [user]);

  // Sync abandoned cart session to backend when customer types contact details
  useEffect(() => {
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email) || cartItems.length === 0) return;

    const timer = setTimeout(() => {
      fetch('/api/orders/abandoned-cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          phone: formData.phone,
          name: formData.name,
          items: cartItems.map((item) => ({
            variantId: item.variantId,
            sku: item.sku,
            name: item.name,
            color: item.color,
            size: item.size,
            quantity: item.quantity,
            price: item.price,
            mrp: item.mrp,
            image: item.image
          })),
          totalAmount: cartTotal,
          shippingAddress: {
            streetAddress: formData.streetAddress,
            city: formData.city,
            state: formData.state,
            pincode: formData.pincode
          }
        })
      }).catch((err) => console.debug('[Abandoned Cart Sync]:', err.message));
    }, 1800);

    return () => clearTimeout(timer);
  }, [formData.email, formData.phone, formData.name, formData.streetAddress, cartItems, cartTotal]);

  const [paymentMethod, setPaymentMethod] = useState('ONLINE'); // 'ONLINE' or 'COD'
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [paymentMode, setPaymentMode] = useState(null); // 'MOCK' or 'LIVE'
  const [paymentOrderData, setPaymentOrderData] = useState(null);
  const [internalOrder, setInternalOrder] = useState(null);

  if (cartItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center space-y-4">
        <h2 className="text-xl font-bold uppercase">Checkout</h2>
        <p className="text-xs text-[#8E8E93]">Your bag is currently empty. Add products before checking out.</p>
        <button onClick={() => navigate('/shop')} className="border border-white px-6 py-3 text-xs uppercase font-mono tracking-widest text-white">
          Return to Shop
        </button>
      </div>
    );
  }

  // Load Razorpay SDK Script dynamically
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Full name is required';
    if (!/^\d{10}$/.test(formData.phone.trim())) errors.phone = 'Enter a valid 10-digit mobile number';
    if (!/\S+@\S+\.\S+/.test(formData.email.trim())) errors.email = 'Enter a valid email address';
    if (!formData.streetAddress.trim()) errors.streetAddress = 'Address is required';
    if (!formData.city.trim()) errors.city = 'City is required';
    if (!formData.state.trim()) errors.state = 'State is required';
    if (!/^\d{6}$/.test(formData.pincode.trim())) errors.pincode = 'Enter a valid 6-digit pincode';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);

    const payload = {
      items: cartItems.map((item) => ({
        variantId: item.variantId,
        quantity: item.quantity
      })),
      customer: {
        name: formData.name,
        email: formData.email,
        phone: formData.phone
      },
      shippingAddress: {
        streetAddress: formData.streetAddress,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        country: 'India'
      }
    };

    try {
      // Online Payment via Razorpay Flow
      const res = await fetch('/api/orders/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to place order');
      }

      setInternalOrder(data.order);
      setPaymentOrderData(data.paymentOrder);
      setPaymentMode(data.paymentOrder.mode);

      if (data.paymentOrder.mode === 'LIVE') {
        // Trigger Live Razorpay Checkout Modal
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          throw new Error('Razorpay SDK failed to load. Are you connected to the internet?');
        }

        const options = {
          key: data.paymentOrder.keyId,
          amount: data.paymentOrder.amount,
          currency: data.paymentOrder.currency,
          name: 'NABH Wear',
          description: `Order #${data.order.orderNumber}`,
          order_id: data.paymentOrder.orderId,
          handler: async function (response) {
            setLoading(true);
            try {
              // Verify Live signature on server
              const verifyRes = await fetch('/api/orders/verify-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  orderId: data.order._id,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature
                })
              });
              const verifyData = await verifyRes.json();
              if (verifyData.success) {
                clearCart();
                navigate(`/order-success?orderId=${data.order._id}`);
              } else {
                throw new Error(verifyData.message || 'Signature verification failed');
              }
            } catch (err) {
              alert(`Payment Verification Error: ${err.message}`);
            } finally {
              setLoading(false);
            }
          },
          prefill: {
            name: formData.name,
            email: formData.email,
            contact: formData.phone
          },
          theme: {
            color: '#0A0A0A'
          },
          modal: {
            confirm_close: true
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
        setLoading(false);
      }
      
    } catch (err) {
      alert(`Checkout Error: ${err.message}`);
      setLoading(false);
    }
  };

  // Simulates verification in test mode
  const handleSimulatePayment = async () => {
    if (!internalOrder || !paymentOrderData) return;
    setLoading(true);

    try {
      const verifyRes = await fetch('/api/orders/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: internalOrder._id,
          razorpayOrderId: paymentOrderData.orderId,
          razorpayPaymentId: 'pay_mock_' + Math.random().toString(36).substr(2, 9),
          razorpaySignature: 'mock_cryptography_signature'
        })
      });
      const verifyData = await verifyRes.json();
      if (verifyData.success) {
        clearCart();
        navigate(`/order-success?orderId=${internalOrder._id}`);
      } else {
        throw new Error(verifyData.message || 'Simulation verification failed');
      }
    } catch (err) {
      alert(`Simulation Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in relative">
      {/* Page Title */}
      <div className="border-b border-[#1C1C1E] pb-6 mb-12">
        <h1 className="text-3xl font-bold uppercase tracking-widest text-[#F9F9FB]">Checkout</h1>
        <p className="text-xs text-[#8E8E93] mt-2 font-mono uppercase">Provide shipping &bull; Complete payment</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
        {/* Left Column: Form */}
        <div className="lg:col-span-2 bg-[#0A0A0C] border border-[#1C1C1E] p-6 md:p-8">
          <h2 className="text-sm font-bold uppercase tracking-widest text-[#F9F9FB] mb-6">Shipping Address</h2>

          {/* 1-Click Saved Addresses Picker */}
          {user?.addresses && user.addresses.length > 0 && (
            <div className="mb-6 space-y-2 pb-6 border-b border-[#1C1C1E]">
              <div className="flex justify-between items-center">
                <span className="text-xs uppercase font-mono tracking-wider text-[#8E8E93]">
                  Select Saved Delivery Address:
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAddressId(null);
                    setFormData({
                      name: user?.name || '',
                      phone: user?.phone || '',
                      email: user?.email || '',
                      streetAddress: '',
                      city: '',
                      state: '',
                      pincode: ''
                    });
                  }}
                  className="text-[10px] uppercase font-mono text-indigo-400 hover:text-white transition"
                >
                  + Enter New Address
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {user.addresses.map((addr) => (
                  <button
                    key={addr._id}
                    type="button"
                    onClick={() => {
                      setSelectedAddressId(addr._id);
                      setFormData((prev) => ({
                        ...prev,
                        name: addr.name || user?.name || prev.name,
                        phone: addr.phone || user?.phone || prev.phone,
                        streetAddress: addr.streetAddress || '',
                        city: addr.city || '',
                        state: addr.state || '',
                        pincode: addr.pincode || ''
                      }));
                    }}
                    className={`text-left p-3 border rounded-sm transition ${
                      selectedAddressId === addr._id
                        ? 'border-white bg-[#141418] shadow-md'
                        : 'border-[#222225] bg-[#070709] opacity-75 hover:opacity-100 hover:border-zinc-500'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] font-mono uppercase tracking-widest px-1.5 py-0.5 bg-zinc-800 text-zinc-300">
                        {addr.tag || 'Home'}
                      </span>
                      {addr.isDefault && (
                        <span className="text-[9px] font-mono text-green-400">Default</span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-white line-clamp-1">{addr.name || user?.name}</p>
                    <p className="text-[11px] text-[#8E8E93] line-clamp-1">{addr.streetAddress}</p>
                    <p className="text-[10px] font-mono text-zinc-500">{addr.city}, {addr.state} - {addr.pincode}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <form onSubmit={handlePlaceOrder} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono tracking-widest text-[#8E8E93]">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Rahul Sharma"
                  className={`w-full bg-[#050505] border text-sm text-[#F9F9FB] px-4 py-3 focus:outline-none focus:border-white transition ${
                    formErrors.name ? 'border-red-500' : 'border-[#2C2C2E]'
                  }`}
                />
                {formErrors.name && <p className="text-[10px] text-red-500 font-mono">{formErrors.name}</p>}
              </div>

              {/* Mobile Number */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono tracking-widest text-[#8E8E93]">Mobile Number</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="e.g. 9876543210"
                  className={`w-full bg-[#050505] border text-sm text-[#F9F9FB] px-4 py-3 focus:outline-none focus:border-white transition ${
                    formErrors.phone ? 'border-red-500' : 'border-[#2C2C2E]'
                  }`}
                />
                {formErrors.phone && <p className="text-[10px] text-red-500 font-mono">{formErrors.phone}</p>}
              </div>
            </div>

            {/* Email Address */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-mono tracking-widest text-[#8E8E93]">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="e.g. rahul@example.com"
                className={`w-full bg-[#050505] border text-sm text-[#F9F9FB] px-4 py-3 focus:outline-none focus:border-white transition ${
                  formErrors.email ? 'border-red-500' : 'border-[#2C2C2E]'
                }`}
              />
              {formErrors.email && <p className="text-[10px] text-red-500 font-mono">{formErrors.email}</p>}
            </div>

            {/* Complete Address */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-mono tracking-widest text-[#8E8E93]">Street Address</label>
              <input
                type="text"
                name="streetAddress"
                value={formData.streetAddress}
                onChange={handleChange}
                placeholder="Flat / House No. / Street Name"
                className={`w-full bg-[#050505] border text-sm text-[#F9F9FB] px-4 py-3 focus:outline-none focus:border-white transition ${
                  formErrors.streetAddress ? 'border-red-500' : 'border-[#2C2C2E]'
                }`}
              />
              {formErrors.streetAddress && <p className="text-[10px] text-red-500 font-mono">{formErrors.streetAddress}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* City */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono tracking-widest text-[#8E8E93]">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="City"
                  className={`w-full bg-[#050505] border text-sm text-[#F9F9FB] px-4 py-3 focus:outline-none focus:border-white transition ${
                    formErrors.city ? 'border-red-500' : 'border-[#2C2C2E]'
                  }`}
                />
                {formErrors.city && <p className="text-[10px] text-red-500 font-mono">{formErrors.city}</p>}
              </div>

              {/* State */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono tracking-widest text-[#8E8E93]">State</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="State"
                  className={`w-full bg-[#050505] border text-sm text-[#F9F9FB] px-4 py-3 focus:outline-none focus:border-white transition ${
                    formErrors.state ? 'border-red-500' : 'border-[#2C2C2E]'
                  }`}
                />
                {formErrors.state && <p className="text-[10px] text-red-500 font-mono">{formErrors.state}</p>}
              </div>

              {/* Pincode */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono tracking-widest text-[#8E8E93]">Pincode</label>
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  placeholder="Pincode"
                  className={`w-full bg-[#050505] border text-sm text-[#F9F9FB] px-4 py-3 focus:outline-none focus:border-white transition ${
                    formErrors.pincode ? 'border-red-500' : 'border-[#2C2C2E]'
                  }`}
                />
                {formErrors.pincode && <p className="text-[10px] text-red-500 font-mono">{formErrors.pincode}</p>}
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-3 pt-4 border-t border-[#1C1C1E]">
              <div className="flex justify-between items-center">
                <label className="text-[10px] uppercase font-mono tracking-widest text-[#F9F9FB] font-semibold">
                  Payment Method
                </label>
                <span className="text-[10px] font-mono text-zinc-500">100% Encrypted &amp; Secure</span>
              </div>

              {/* Online Payment Only Card */}
              <div className="border border-white/40 bg-[#121214] p-4.5 flex flex-col justify-between space-y-3 ring-1 ring-white/10 rounded-sm">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-xs font-bold text-white uppercase font-mono">
                    <CreditCard size={15} className="text-white" /> Online Payment (UPI, Cards, NetBanking)
                  </div>
                  <span className="bg-emerald-950/70 text-emerald-400 border border-emerald-500/30 text-[9px] font-mono px-2 py-0.5 font-bold uppercase">
                    Active
                  </span>
                </div>
                <p className="text-[11px] text-[#A1A1AA] leading-relaxed">
                  Fast, secure payments via Razorpay. Supports UPI (Google Pay, PhonePe, Paytm, BHIM), all major Credit &amp; Debit cards, and NetBanking.
                </p>
                <div className="flex items-center gap-3 pt-2 text-[9px] font-mono text-zinc-400 border-t border-[#1F1F23]">
                  <span className="flex items-center gap-1 text-emerald-400 font-semibold"><CheckCircle2 size={11} /> Automated Priority Dispatch</span>
                  <span>&bull;</span>
                  <span>Zero Transaction Surcharge</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 bg-[#F9F9FB] text-[#0A0A0A] text-xs font-bold uppercase tracking-widest w-full py-4.5 hover:bg-[#E6E6FA] transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-mono shadow-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={14} /> Processing Secure Payment...
                </>
              ) : (
                `Proceed to Online Payment (₹${cartTotal})`
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Order Summary */}
        <div className="space-y-6">
          <div className="border border-[#1C1C1E] bg-[#0A0A0C] p-6 space-y-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[#F9F9FB] border-b border-[#1C1C1E] pb-3">
              Order Review
            </h2>
            
            <div className="space-y-4 max-h-72 overflow-y-auto pr-2">
              {cartItems.map((item) => (
                <div key={item.variantId} className="flex gap-4">
                  <div className="w-14 aspect-[3/4] bg-[#050505] border border-[#1C1C1E] overflow-hidden flex-shrink-0">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-grow text-xs space-y-1">
                    <h4 className="font-bold text-[#F9F9FB] line-clamp-1">{item.name}</h4>
                    <p className="text-[#8E8E93] font-mono text-[9px] uppercase">
                      {item.color} / {item.size} x {item.quantity}
                    </p>
                    <p className="text-[#F9F9FB] font-mono text-[10px]">₹{item.price * item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>

            <hr className="border-[#1C1C1E]" />

            <div className="space-y-2 text-xs font-mono text-[#8E8E93]">
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="text-[#F9F9FB] uppercase text-[10px]">Free</span>
              </div>
              <div className="flex justify-between">
                <span>Total Items</span>
                <span>{cartItems.reduce((acc, item) => acc + item.quantity, 0)}</span>
              </div>
            </div>

            <hr className="border-[#1C1C1E]" />

            <div className="flex justify-between items-baseline">
              <span className="text-xs uppercase font-bold tracking-widest text-white">Amount Due</span>
              <span className="text-xl font-bold text-white">₹{cartTotal}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mock Payment Simulator Overlay Modal */}
      {paymentMode === 'MOCK' && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#0F0F11] border border-orange-500/30 max-w-md w-full p-8 text-center space-y-6">
            <div className="inline-flex p-3 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-full">
              <ShieldCheck size={36} />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold uppercase tracking-widest text-white">Gateway Simulator</h3>
              <p className="text-xs text-[#8E8E93] leading-relaxed">
                The Express backend detected that your <code className="bg-[#1C1C1E] px-1 py-0.5 rounded text-orange-400 text-[10px]">RAZORPAY_KEY_ID</code> is missing or set to mock.
              </p>
              <p className="text-xs text-[#8E8E93] leading-relaxed">
                You can simulate a successful Razorpay transaction callback securely. This will mark the order as PAID and trigger Qikink pod fulfillment.
              </p>
            </div>

            <div className="bg-[#050505] border border-[#1C1C1E] p-4 text-left font-mono text-[10px] space-y-1.5 text-[#555555]">
              <div><span className="text-[#8E8E93]">ORDER ID:</span> {internalOrder?.orderNumber}</div>
              <div><span className="text-[#8E8E93]">AMOUNT:</span> ₹{internalOrder?.totalAmount}</div>
              <div><span className="text-[#8E8E93]">MOCK GATEWAY ID:</span> {paymentOrderData?.orderId}</div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setPaymentMode(null);
                  setFormData((prev) => ({ ...prev, name: '' })); // reset trigger
                }}
                className="flex-1 border border-[#2C2C2E] text-xs font-mono uppercase tracking-widest text-[#8E8E93] py-4 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSimulatePayment}
                disabled={loading}
                className="flex-1 bg-green-500 text-black text-xs font-bold uppercase tracking-widest py-4 hover:bg-green-400 transition"
              >
                {loading ? 'Processing...' : 'Verify payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;
