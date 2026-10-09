import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, Truck, Calendar, ShoppingBag, ShieldCheck, Mail, Phone, RefreshCw, FileText } from 'lucide-react';
import InvoiceModal from '../components/InvoiceModal.jsx';

const OrderSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get('orderId');

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);

  const fetchOrder = () => {
    if (!orderId) return;
    fetch(`/api/orders/${orderId}`)
      .then((res) => res.json())
      .then((data) => {
        setOrder(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching success order:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const handleTrackShipment = async () => {
    if (!order) return;
    setSyncing(true);
    try {
      const res = await fetch(`/api/orders/track/${order.orderNumber}`);
      const data = await res.json();
      if (res.ok) {
        setOrder(data);
      }
    } catch (err) {
      console.error('Tracking sync error:', err);
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="w-8 h-8 border-2 border-[#F9F9FB] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center space-y-4">
        <h2 className="text-xl font-bold uppercase text-red-400">Order Record Missing</h2>
        <p className="text-xs text-[#8E8E93]">No order information matches this transaction identifier.</p>
        <button onClick={() => navigate('/shop')} className="border border-white px-6 py-3 text-xs uppercase font-mono tracking-widest text-white">
          Back to Shop
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-10 animate-fade-in">
      {/* Header check */}
      <div className="text-center space-y-4">
        <div className="inline-flex p-3 bg-green-500/10 border border-green-500/20 text-green-400 rounded-full">
          <CheckCircle2 size={44} />
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold uppercase tracking-widest text-white">Order Confirmed</h1>
          <p className="text-xs text-[#8E8E93]">
            Thank you for shopping with us. Your order will be processed and shipped shortly.
          </p>
        </div>
      </div>

      {/* Main Info Blocks */}
      <div className="border border-[#1C1C1E] bg-[#0A0A0C] divide-y divide-[#1C1C1E]">
        {/* Order Meta details */}
        <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6 font-mono text-[10px] uppercase text-[#8E8E93]">
          <div className="space-y-1">
            <span className="text-[#555555]">Order Number</span>
            <p className="font-bold text-white text-xs select-all">{order.orderNumber}</p>
          </div>
          <div className="space-y-1">
            <span className="text-[#555555]">Payment Status</span>
            <p className={`font-bold text-xs ${order.paymentStatus === 'PAID' ? 'text-green-400' : 'text-yellow-400'}`}>
              {order.paymentStatus}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-[#555555]">Fulfillment</span>
            <p className="font-bold text-white text-xs">{order.fulfillmentStatus.replace(/_/g, ' ')}</p>
          </div>
          <div className="space-y-1">
            <span className="text-[#555555]">Gateway ID</span>
            <p className="font-bold text-white text-xs truncate" title={order.paymentId}>{order.paymentId || 'N/A'}</p>
          </div>
        </div>

        {/* Tracking Details */}
        <div className="p-6 space-y-4 bg-[#0A0A0C]">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#F9F9FB] flex items-center gap-2">
              <Truck size={14} /> Fulfillment Status
            </h3>
            <button
              onClick={handleTrackShipment}
              disabled={syncing}
              className="text-[9px] uppercase font-mono tracking-widest text-indigo-400 hover:text-white flex items-center gap-1 disabled:opacity-50"
            >
              <RefreshCw size={10} className={syncing ? 'animate-spin' : ''} /> Sync Status
            </button>
          </div>

          <div className="border border-[#2C2C2E] p-4 space-y-4 bg-[#050505]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="space-y-1">
                <span className="text-[10px] text-[#555555] uppercase">Qikink Order ID:</span>
                <p className="text-white font-bold">{order.qikinkOrderId || 'Awaiting Qikink response'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-[#555555] uppercase">Tracking Number:</span>
                <p className="text-white font-bold select-all">{order.trackingNumber || 'Awaiting dispatch'}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-[#1C1C1E] flex items-center justify-between text-xs">
              <span className="text-[#8E8E93]">Current Shipping Status:</span>
              <span className="bg-[#1C1C1E] px-3 py-1 font-mono uppercase text-[9px] font-bold text-white">
                {order.trackingStatus || 'Pending Processing'}
              </span>
            </div>
          </div>
        </div>

        {/* Ordered items */}
        <div className="p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#F9F9FB] flex items-center gap-2">
            <ShoppingBag size={14} /> Items Ordered
          </h3>
          <div className="space-y-3">
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between items-center text-xs">
                <div className="space-y-1">
                  <span className="text-white font-semibold">{item.name}</span>
                  <div className="text-[9px] font-mono text-[#8E8E93] uppercase">
                    Color: {item.color} &bull; Size: {item.size} &bull; Qty: {item.quantity}
                  </div>
                </div>
                <span className="font-mono text-white">₹{item.price * item.quantity}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Shipping address & customer detail */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed">
          <div className="space-y-2">
            <h4 className="font-bold text-[#F9F9FB] uppercase tracking-widest text-[10px]">Customer Details</h4>
            <div className="space-y-1 text-[#8E8E93]">
              <div className="flex items-center gap-2"><Mail size={12} /> {order.customer.email}</div>
              <div className="flex items-center gap-2"><Phone size={12} /> {order.customer.phone}</div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-[#F9F9FB] uppercase tracking-widest text-[10px]">Shipping Address</h4>
            <div className="text-[#8E8E93]">
              <p className="font-semibold text-white">{order.customer.name}</p>
              <p>{order.shippingAddress.streetAddress}</p>
              <p>{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}</p>
              <p>{order.shippingAddress.country}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
        <button
          onClick={() => setShowInvoice(true)}
          className="w-full sm:w-auto bg-[#1C1C1E] border border-[#2C2C2E] text-white text-xs font-mono uppercase tracking-widest px-6 py-4 hover:bg-white hover:text-black flex items-center justify-center gap-2 transition"
        >
          <FileText size={14} /> Download / Print Invoice
        </button>

        <button
          onClick={() => navigate(`/track?order=${order.orderNumber}`)}
          className="w-full sm:w-auto bg-transparent border border-white text-white text-xs font-mono uppercase tracking-widest px-6 py-4 hover:bg-white hover:text-black flex items-center justify-center gap-2 transition"
        >
          <Truck size={14} /> Track Live Delivery
        </button>

        <button
          onClick={() => navigate('/shop')}
          className="w-full sm:w-auto bg-[#F9F9FB] text-[#0A0A0A] text-xs font-bold uppercase tracking-widest px-8 py-4 hover:bg-[#E6E6FA] transition-all font-mono"
        >
          Continue Shopping
        </button>
      </div>

      {/* Render Invoice Modal */}
      {showInvoice && (
        <InvoiceModal order={order} onClose={() => setShowInvoice(false)} />
      )}
    </div>
  );
};

export default OrderSuccess;
