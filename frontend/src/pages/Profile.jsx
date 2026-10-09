import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Package,
  MapPin,
  Settings,
  Clock,
  Truck,
  CheckCircle2,
  AlertCircle,
  FileText,
  Printer,
  Plus,
  Trash2,
  Pencil,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Building2,
  Home as HomeIcon,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import InvoiceModal from '../components/InvoiceModal.jsx';

const Profile = () => {
  const {
    user,
    userOrders,
    refreshUserData,
    updateProfile,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    logout
  } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'addresses', 'settings'
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);

  // Profile Edit State
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });

  // Address Form State
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressForm, setAddressForm] = useState({
    tag: 'Home',
    name: '',
    phone: '',
    streetAddress: '',
    city: '',
    state: '',
    pincode: '',
    isDefault: false
  });
  const [addressSaving, setAddressSaving] = useState(false);

  useEffect(() => {
    refreshUserData();
  }, []);

  useEffect(() => {
    if (user) {
      setProfileName(user.name || '');
      setProfilePhone(user.phone || '');
    }
  }, [user]);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg({ type: '', text: '' });
    try {
      await updateProfile(profileName, profilePhone);
      setProfileMsg({ type: 'success', text: 'Account profile updated successfully.' });
      setTimeout(() => setProfileMsg({ type: '', text: '' }), 4000);
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.message });
    } finally {
      setSavingProfile(false);
    }
  };

  const openAddAddress = () => {
    setEditingAddressId(null);
    setAddressForm({
      tag: 'Home',
      name: user?.name || '',
      phone: user?.phone || '',
      streetAddress: '',
      city: '',
      state: '',
      pincode: '',
      isDefault: (user?.addresses?.length || 0) === 0
    });
    setShowAddressModal(true);
  };

  const openEditAddress = (addr) => {
    setEditingAddressId(addr._id);
    setAddressForm({
      tag: addr.tag || 'Home',
      name: addr.name || user?.name || '',
      phone: addr.phone || user?.phone || '',
      streetAddress: addr.streetAddress || '',
      city: addr.city || '',
      state: addr.state || '',
      pincode: addr.pincode || '',
      isDefault: addr.isDefault || false
    });
    setShowAddressModal(true);
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    setAddressSaving(true);
    try {
      if (editingAddressId) {
        await updateAddress(editingAddressId, addressForm);
      } else {
        await addAddress(addressForm);
      }
      setShowAddressModal(false);
      setEditingAddressId(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setAddressSaving(false);
    }
  };

  const handleDeleteAddress = async (id) => {
    if (confirm('Are you sure you want to remove this delivery address?')) {
      try {
        await deleteAddress(id);
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const getStatusPill = (order) => {
    const fStatus = (order.fulfillmentStatus || 'PENDING').toUpperCase();
    if (fStatus === 'DELIVERED') {
      return (
        <span className="inline-flex items-center gap-1 bg-green-950/60 border border-green-500/30 text-green-400 text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-sm">
          <CheckCircle2 size={10} /> Delivered
        </span>
      );
    }
    if (fStatus === 'SHIPPED') {
      return (
        <span className="inline-flex items-center gap-1 bg-sky-950/60 border border-sky-500/30 text-sky-400 text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-sm">
          <Truck size={10} /> In Transit
        </span>
      );
    }
    if (fStatus === 'PRINTING' || fStatus === 'SENT_TO_QIKINK') {
      return (
        <span className="inline-flex items-center gap-1 bg-amber-950/60 border border-amber-500/30 text-amber-300 text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-sm">
          <Clock size={10} /> In Production
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 bg-zinc-800 border border-zinc-700 text-zinc-300 text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-sm">
        <Clock size={10} /> Confirmed
      </span>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-[#0A0A0C] border border-[#1C1C1E] p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-[#F9F9FB]">
              {user?.name || 'Customer Account'}
            </h1>
            <span className="bg-white/10 text-[#F9F9FB] border border-white/20 text-[10px] font-mono uppercase px-2 py-0.5">
              {user?.role === 'admin' ? 'Admin' : 'NABH Member'}
            </span>
          </div>
          <p className="text-xs text-[#8E8E93] font-mono">
            {user?.email} &bull; Joined {user ? new Date(user.createdAt || Date.now()).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : ''}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="text-xs uppercase font-mono tracking-wider border border-[#2C2C2E] px-4 py-2 text-[#8E8E93] hover:text-white hover:border-white transition"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-[#1C1C1E] text-xs font-mono uppercase tracking-widest gap-2">
        <button
          onClick={() => setActiveTab('orders')}
          className={`py-3 px-5 border-b-2 flex items-center gap-2 transition ${
            activeTab === 'orders'
              ? 'border-white text-white font-bold'
              : 'border-transparent text-[#8E8E93] hover:text-white'
          }`}
        >
          <Package size={14} /> My Orders ({userOrders.length})
        </button>

        <button
          onClick={() => setActiveTab('addresses')}
          className={`py-3 px-5 border-b-2 flex items-center gap-2 transition ${
            activeTab === 'addresses'
              ? 'border-white text-white font-bold'
              : 'border-transparent text-[#8E8E93] hover:text-white'
          }`}
        >
          <MapPin size={14} /> Saved Addresses ({user?.addresses?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`py-3 px-5 border-b-2 flex items-center gap-2 transition ${
            activeTab === 'settings'
              ? 'border-white text-white font-bold'
              : 'border-transparent text-[#8E8E93] hover:text-white'
          }`}
        >
          <Settings size={14} /> Account Details
        </button>
      </div>

      {/* Tab Content: Orders */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          {userOrders.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-[#1C1C1E] bg-[#0A0A0C] space-y-4">
              <Package className="mx-auto text-zinc-600" size={42} strokeWidth={1} />
              <div className="space-y-1">
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">No Orders Found Yet</h3>
                <p className="text-xs text-[#8E8E93]">You haven't placed any orders yet. Discover our latest heavy-weight drop.</p>
              </div>
              <div>
                <Link
                  to="/shop"
                  className="inline-flex items-center gap-2 bg-white text-black text-xs uppercase font-bold tracking-widest px-6 py-3 hover:bg-zinc-200 transition"
                >
                  Explore Collection &rarr;
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {userOrders.map((order) => (
                <div
                  key={order._id}
                  className="bg-[#0A0A0C] border border-[#1C1C1E] hover:border-[#2C2C2E] transition rounded-sm p-5 sm:p-6 space-y-4"
                >
                  {/* Order Top Bar */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#1C1C1E] pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-white font-mono">{order.orderNumber}</span>
                        {getStatusPill(order)}
                      </div>
                      <p className="text-[11px] font-mono text-[#8E8E93]">
                        Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} &bull; Total: <span className="font-bold text-white">₹{order.totalAmount}</span>
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to={`/track?order=${order.orderNumber}`}
                        className="inline-flex items-center gap-1.5 border border-[#2C2C2E] bg-[#111114] text-[#F9F9FB] hover:border-white px-3 py-1.5 text-xs font-mono tracking-wider transition"
                      >
                        <Truck size={12} /> Live Track
                      </Link>

                      <button
                        onClick={() => setSelectedInvoiceOrder(order)}
                        className="inline-flex items-center gap-1.5 bg-white text-black font-bold px-3.5 py-1.5 text-xs font-mono tracking-wider hover:bg-zinc-200 transition"
                      >
                        <FileText size={12} /> GST Invoice
                      </button>
                    </div>
                  </div>

                  {/* Items Preview */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex gap-4 items-center bg-[#070709] border border-[#141416] p-3">
                        <div className="w-14 h-16 bg-black border border-[#222225] flex-shrink-0 overflow-hidden">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-zinc-600 font-mono">
                              NABH
                            </div>
                          )}
                        </div>
                        <div className="space-y-0.5 flex-grow">
                          <h4 className="text-xs font-bold uppercase text-white tracking-tight line-clamp-1">{item.name}</h4>
                          <p className="text-[10px] font-mono text-[#8E8E93] uppercase">
                            Color: {item.color} &bull; Size: {item.size} &bull; Qty: {item.quantity}
                          </p>
                          <p className="text-xs font-bold font-mono text-white">₹{item.price * item.quantity}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Delivery summary */}
                  <div className="pt-2 flex flex-col sm:flex-row justify-between text-[11px] font-mono text-[#8E8E93] gap-2 border-t border-[#141416]">
                    <span>
                      Shipping To: <span className="text-white">{order.shippingAddress?.streetAddress}, {order.shippingAddress?.city} ({order.shippingAddress?.pincode})</span>
                    </span>
                    <span>
                      Payment: <span className="text-white uppercase font-bold">{order.paymentGateway}</span> ({order.paymentStatus})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Addresses */}
      {activeTab === 'addresses' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold uppercase tracking-wider text-white">Delivery Addresses</h2>
              <p className="text-xs text-[#8E8E93] font-mono">Manage shipping destinations for 1-click checkout</p>
            </div>
            <button
              onClick={openAddAddress}
              className="inline-flex items-center gap-1.5 bg-white text-black text-xs font-mono font-bold uppercase tracking-wider px-4 py-2 hover:bg-zinc-200 transition"
            >
              <Plus size={13} /> Add New Address
            </button>
          </div>

          {(!user?.addresses || user.addresses.length === 0) ? (
            <div className="text-center py-16 border border-dashed border-[#1C1C1E] bg-[#0A0A0C] space-y-3">
              <MapPin className="mx-auto text-zinc-600" size={36} />
              <p className="text-xs text-[#8E8E93] font-mono">No delivery addresses saved yet.</p>
              <button
                onClick={openAddAddress}
                className="text-xs uppercase font-mono text-white underline hover:text-indigo-300"
              >
                + Add your first shipping address
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {user.addresses.map((addr) => (
                <div
                  key={addr._id}
                  className={`border p-5 bg-[#0A0A0C] flex flex-col justify-between space-y-4 rounded-sm transition ${
                    addr.isDefault ? 'border-white/50 bg-[#0E0E12]' : 'border-[#1C1C1E]'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 bg-zinc-800 text-zinc-200 border border-zinc-700">
                          {addr.tag || 'Home'}
                        </span>
                        {addr.isDefault && (
                          <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 bg-green-950 text-green-400 border border-green-500/30">
                            Default
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditAddress(addr)}
                          className="text-zinc-400 hover:text-white p-1 transition"
                          title="Edit address"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteAddress(addr._id)}
                          className="text-zinc-500 hover:text-red-400 p-1 transition"
                          title="Delete address"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <div className="text-xs text-white space-y-0.5 font-sans">
                      <p className="font-bold">{addr.name || user.name}</p>
                      <p className="text-[#8E8E93] leading-relaxed">{addr.streetAddress}</p>
                      <p className="text-[#8E8E93]">
                        {addr.city}, {addr.state} - <span className="font-mono">{addr.pincode}</span>
                      </p>
                      <p className="text-[#8E8E93] font-mono text-[11px] pt-1">Phone: +91 {addr.phone || user.phone || '—'}</p>
                    </div>
                  </div>

                  {!addr.isDefault && (
                    <div className="pt-2 border-t border-[#1C1C1E]">
                      <button
                        onClick={() => setDefaultAddress(addr._id)}
                        className="text-[11px] font-mono text-zinc-400 hover:text-white uppercase tracking-wider transition"
                      >
                        Set as Default &rarr;
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Settings */}
      {activeTab === 'settings' && (
        <div className="max-w-xl bg-[#0A0A0C] border border-[#1C1C1E] p-6 space-y-6 rounded-sm">
          <div>
            <h2 className="text-base font-bold uppercase tracking-wider text-white">Account Details</h2>
            <p className="text-xs text-[#8E8E93] font-mono">Update personal information</p>
          </div>

          {profileMsg.text && (
            <div
              className={`p-3 text-xs font-mono flex items-center gap-2 ${
                profileMsg.type === 'success'
                  ? 'bg-green-950/40 border border-green-500/30 text-green-400'
                  : 'bg-red-950/40 border border-red-500/30 text-red-400'
              }`}
            >
              {profileMsg.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
              {profileMsg.text}
            </div>
          )}

          <form onSubmit={handleProfileSave} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-mono text-[#8E8E93]">Full Name</label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                required
                className="w-full bg-[#111114] border border-[#222225] text-xs text-white p-3 focus:border-white focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-mono text-[#8E8E93]">Phone Number (10 digits)</label>
              <input
                type="tel"
                value={profilePhone}
                onChange={(e) => setProfilePhone(e.target.value)}
                placeholder="e.g. 9876543210"
                className="w-full bg-[#111114] border border-[#222225] text-xs text-white p-3 focus:border-white focus:outline-none font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-mono text-[#8E8E93]">Email Address (Cannot be changed)</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full bg-[#070709] border border-[#1C1C1E] text-xs text-zinc-500 p-3 cursor-not-allowed font-mono"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingProfile}
                className="bg-white text-black font-bold text-xs uppercase tracking-widest px-6 py-3 hover:bg-zinc-200 transition disabled:opacity-50"
              >
                {savingProfile ? 'Saving Changes...' : 'Save Profile Details'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Address Add/Edit Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F0F12] border border-[#2C2C2E] max-w-lg w-full p-6 space-y-6 shadow-2xl rounded-sm animate-fade-in">
            <div className="flex justify-between items-center border-b border-[#1C1C1E] pb-3">
              <h3 className="text-sm font-bold uppercase tracking-widest text-white">
                {editingAddressId ? 'Edit Address' : 'Add New Delivery Address'}
              </h3>
              <button onClick={() => setShowAddressModal(false)} className="text-[#8E8E93] hover:text-white">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddressSubmit} className="space-y-4">
              {/* Address Tag Selector */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono text-[#8E8E93]">Address Type</label>
                <div className="flex gap-2">
                  {['Home', 'Work', 'Studio', 'Other'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setAddressForm({ ...addressForm, tag: type })}
                      className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider border transition ${
                        addressForm.tag === type
                          ? 'bg-white text-black font-bold border-white'
                          : 'border-[#2C2C2E] text-[#8E8E93] hover:text-white'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono text-[#8E8E93]">Contact Name *</label>
                  <input
                    type="text"
                    required
                    value={addressForm.name}
                    onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })}
                    className="w-full bg-[#08080A] border border-[#222225] text-xs text-white p-2.5 focus:border-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono text-[#8E8E93]">Contact Mobile *</label>
                  <input
                    type="tel"
                    required
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                    placeholder="10 digit mobile"
                    className="w-full bg-[#08080A] border border-[#222225] text-xs text-white p-2.5 focus:border-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono text-[#8E8E93]">Street Address & House / Flat No *</label>
                <textarea
                  required
                  rows={2}
                  value={addressForm.streetAddress}
                  onChange={(e) => setAddressForm({ ...addressForm, streetAddress: e.target.value })}
                  placeholder="e.g. Flat 4B, Signature Residency, Park Street"
                  className="w-full bg-[#08080A] border border-[#222225] text-xs text-white p-2.5 focus:border-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono text-[#8E8E93]">City *</label>
                  <input
                    type="text"
                    required
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    className="w-full bg-[#08080A] border border-[#222225] text-xs text-white p-2.5 focus:border-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono text-[#8E8E93]">State *</label>
                  <input
                    type="text"
                    required
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                    className="w-full bg-[#08080A] border border-[#222225] text-xs text-white p-2.5 focus:border-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono text-[#8E8E93]">Pincode *</label>
                  <input
                    type="text"
                    required
                    value={addressForm.pincode}
                    onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                    className="w-full bg-[#08080A] border border-[#222225] text-xs text-white p-2.5 focus:border-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="defaultCheck"
                  checked={addressForm.isDefault}
                  onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                  className="rounded border-zinc-700 bg-zinc-800 text-white"
                />
                <label htmlFor="defaultCheck" className="text-xs font-mono text-zinc-300">
                  Set as default shipping address
                </label>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="flex-1 border border-[#2C2C2E] text-xs uppercase font-mono text-[#8E8E93] py-2.5 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addressSaving}
                  className="flex-1 bg-white text-black font-bold text-xs uppercase font-mono py-2.5 hover:bg-zinc-200 transition disabled:opacity-50"
                >
                  {addressSaving ? 'Saving...' : 'Save Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {selectedInvoiceOrder && (
        <InvoiceModal
          order={selectedInvoiceOrder}
          onClose={() => setSelectedInvoiceOrder(null)}
        />
      )}
    </div>
  );
};

export default Profile;
