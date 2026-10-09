import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Package, Truck, CheckCircle2, Clock, AlertCircle, RefreshCw, MapPin, ShieldCheck, ShoppingBag, User, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import InvoiceModal from '../components/InvoiceModal.jsx';

const TrackOrder = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('order') || searchParams.get('orderNumber') || '';
  const { user, userOrders } = useAuth();

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);

  const fetchTracking = async (q) => {
    if (!q || !q.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/orders/track-lookup?query=${encodeURIComponent(q.trim())}`);
      const data = await res.json();
      if (res.ok) {
        setOrder(data);
        setSearchParams({ order: data.orderNumber });
      } else {
        setOrder(null);
        setError(data.message || 'No order found matching your search. Please check your order number.');
      }
    } catch (err) {
      setError('Network error while searching for order. Please try again.');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      fetchTracking(initialQuery);
    }
  }, [initialQuery]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTracking(searchQuery);
  };

  const handleSyncStatus = async () => {
    if (!order) return;
    setSyncing(true);
    try {
      const res = await fetch(`/api/orders/track-lookup?query=${encodeURIComponent(order.orderNumber)}`);
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

  // Status Step Mapper
  const getTimelineStep = () => {
    if (!order) return 0;
    const fStatus = (order.fulfillmentStatus || '').toUpperCase();
    const tStatus = (order.trackingStatus || '').toLowerCase();

    if (fStatus === 'DELIVERED' || tStatus.includes('deliv')) return 4;
    if (fStatus === 'SHIPPED' || tStatus.includes('ship') || tStatus.includes('transit') || tStatus.includes('out for')) return 3;
    if (fStatus === 'SENT_TO_QIKINK' || fStatus === 'PRINTING' || tStatus.includes('print') || tStatus.includes('packed')) return 2;
    if (order.paymentStatus === 'PAID' || order.paymentGateway === 'COD') return 1;
    return 1;
  };

  const currentStep = getTimelineStep();

  const timelineSteps = [
    { title: 'Order Confirmed', desc: 'Payment verified & order created' },
    { title: 'Printing & Packaging', desc: 'Qikink POD factory production' },
    { title: 'In Transit', desc: 'Handed over to courier partner' },
    { title: 'Delivered', desc: 'Package delivered to customer' }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 animate-fade-in">
      {/* Page Title */}
      <div className="border-b border-[#1C1C1E] pb-6 text-center space-y-2">
        <h1 className="text-3xl font-bold uppercase tracking-widest text-[#F9F9FB] flex items-center justify-center gap-3">
          <Truck size={30} className="text-[#8E8E93]" /> Track Your Order
        </h1>
        <p className="text-xs text-[#8E8E93] font-mono uppercase">
          Real-time production & courier tracking updates
        </p>
      </div>

      {/* Search Bar */}
      <div className="bg-[#0A0A0C] border border-[#1C1C1E] p-6 sm:p-8 space-y-4 shadow-2xl">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-grow">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#555555]" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter Order Number (e.g. NABH-20260901-4592) or Mobile Number"
              className="w-full bg-[#050505] border border-[#2C2C2E] text-sm text-white pl-12 pr-4 py-4 focus:outline-none focus:border-white transition font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-[#F9F9FB] text-[#0A0A0A] font-bold text-xs uppercase tracking-widest px-8 py-4 hover:bg-[#E6E6FA] transition disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Track'}
          </button>
        </form>

        {/* Quick Recent Orders for Logged-in Customer */}
        {user && userOrders && userOrders.length > 0 && (
          <div className="pt-3 border-t border-[#1C1C1E] space-y-2">
            <p className="text-[11px] uppercase tracking-wider font-mono text-[#8E8E93] flex items-center gap-1.5">
              <Package size={13} /> Your Recent Orders (Click to Track):
            </p>
            <div className="flex flex-wrap gap-2">
              {userOrders.slice(0, 5).map((o) => (
                <button
                  key={o._id}
                  type="button"
                  onClick={() => {
                    setSearchQuery(o.orderNumber);
                    fetchTracking(o.orderNumber);
                  }}
                  className={`text-xs font-mono px-3 py-1.5 border transition-all ${
                    order?.orderNumber === o.orderNumber
                      ? 'border-[#F9F9FB] bg-[#F9F9FB] text-[#0A0A0A] font-bold'
                      : 'border-[#26262A] text-[#8E8E93] hover:text-[#F9F9FB] hover:border-[#444] bg-[#0A0A0C]'
                  }`}
                >
                  {o.orderNumber}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-950/40 border border-red-500/30 p-4 text-xs font-mono text-red-400 flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </div>
        )}
      </div>

      {/* Order Result Card */}
      {order && (
        <div className="border border-[#1C1C1E] bg-[#0A0A0C] divide-y divide-[#1C1C1E] animate-fade-in shadow-2xl">
          {/* Header Bar */}
          <div className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#0F0F11]">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-white uppercase select-all">{order.orderNumber}</h2>
                <span
                  className={`px-2.5 py-0.5 text-[9px] font-mono uppercase font-bold ${
                    order.paymentStatus === 'PAID'
                      ? 'bg-green-950/80 text-green-400 border border-green-500/30'
                      : 'bg-amber-950/80 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {order.paymentGateway === 'COD' ? 'COD (Pay at delivery)' : order.paymentStatus}
                </span>
              </div>
              <p className="text-[10px] text-[#8E8E93] font-mono mt-1">
                Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowInvoice(true)}
                className="text-xs uppercase font-mono tracking-widest bg-white text-black px-4 py-2 hover:bg-zinc-200 flex items-center gap-2 transition font-bold"
              >
                <FileText size={13} /> View Invoice
              </button>

              <button
                onClick={handleSyncStatus}
                disabled={syncing}
                className="text-xs uppercase font-mono tracking-widest bg-[#1C1C1E] border border-[#2C2C2E] text-white px-4 py-2 hover:bg-white hover:text-black flex items-center gap-2 transition disabled:opacity-50"
              >
                <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} />
                {syncing ? 'Syncing...' : 'Sync Status'}
              </button>
            </div>
          </div>

          {/* Timeline Visual Progress */}
          <div className="p-6 sm:p-8 space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#8E8E93] font-mono">
              Live Shipment Progress
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
              {timelineSteps.map((step, idx) => {
                const stepNum = idx + 1;
                const isCompleted = stepNum <= currentStep;
                const isCurrent = stepNum === currentStep;

                return (
                  <div
                    key={idx}
                    className={`border p-4 transition-all duration-300 space-y-2 relative ${
                      isCurrent
                        ? 'border-white bg-[#141416] ring-1 ring-white/20'
                        : isCompleted
                        ? 'border-green-500/40 bg-green-950/10'
                        : 'border-[#1C1C1E] bg-[#050505] opacity-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isCompleted ? (
                        <CheckCircle2 size={16} className="text-green-400" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-[#555555] flex items-center justify-center text-[9px] font-mono text-[#555555]">
                          {stepNum}
                        </div>
                      )}
                      <span className={`text-xs font-bold uppercase tracking-tight ${isCurrent ? 'text-white' : isCompleted ? 'text-green-400' : 'text-[#8E8E93]'}`}>
                        {step.title}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#8E8E93] font-mono leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Courier & Factory Details */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#08080A]">
            <div className="border border-[#1C1C1E] bg-[#0A0A0C] p-4 space-y-2 font-mono text-xs">
              <span className="text-[10px] text-[#555555] uppercase">Fulfillment Partner:</span>
              <p className="text-white font-bold flex items-center gap-2">
                <Package size={14} className="text-purple-400" /> Qikink Print-on-Demand Factory
              </p>
              <div className="text-[10px] text-[#8E8E93]">
                Factory Order ID: <span className="text-white font-bold">{order.qikinkOrderId || 'Assigned on production'}</span>
              </div>
            </div>

            <div className="border border-[#1C1C1E] bg-[#0A0A0C] p-4 space-y-2 font-mono text-xs">
              <span className="text-[10px] text-[#555555] uppercase">Courier Tracking Number:</span>
              <p className="text-white font-bold select-all flex items-center gap-2">
                <Truck size={14} className="text-indigo-400" /> {order.trackingNumber || 'Awaiting dispatch assignment'}
              </p>
              <div className="text-[10px] text-green-400 font-bold uppercase">
                Status: {order.trackingStatus || 'Scheduled for print'}
              </div>
            </div>
          </div>

          {/* Ordered Items List */}
          <div className="p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#F9F9FB] flex items-center gap-2">
              <ShoppingBag size={14} /> Items in this Order ({order.items.length})
            </h3>
            <div className="divide-y divide-[#1C1C1E]">
              {order.items.map((item, i) => (
                <div key={i} className="py-3 flex justify-between items-center text-xs">
                  <div>
                    <p className="text-white font-bold uppercase">{item.name}</p>
                    <p className="text-[10px] text-[#8E8E93] font-mono uppercase mt-0.5">
                      Color: {item.color} &bull; Size: {item.size} &bull; Qty: {item.quantity}
                    </p>
                  </div>
                  <span className="font-mono font-bold text-white">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="p-6 bg-[#08080A] text-xs font-mono space-y-2">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#555555] flex items-center gap-1.5">
              <MapPin size={12} /> Delivery Destination
            </h3>
            <div className="text-[#8E8E93] leading-relaxed">
              <p className="text-white font-semibold">{order.customer.name} ({order.customer.phone})</p>
              <p>{order.shippingAddress.streetAddress}, {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}</p>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {showInvoice && order && (
        <InvoiceModal order={order} onClose={() => setShowInvoice(false)} />
      )}
    </div>
  );
};

export default TrackOrder;
