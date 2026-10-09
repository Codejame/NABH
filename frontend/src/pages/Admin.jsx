import React, { useState, useEffect, useRef } from 'react';
import { Shield, LayoutDashboard, ShoppingBag, Package, RefreshCw, Pencil, Plus, Check, X, AlertCircle, Sparkles, Camera, Upload, Trash2, Eye, EyeOff, Ban, User, Image, Mail, Send, FileText } from 'lucide-react';
import InvoiceModal from '../components/InvoiceModal.jsx';

const Admin = () => {
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, orders, products
  const [metrics, setMetrics] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit variant state
  const [editingVariantId, setEditingVariantId] = useState(null);
  const [editForm, setEditForm] = useState({
    price: 799,
    mrp: 999,
    inventory: 100,
    qikinkSku: ''
  });

  // Add Product Form
  const [newProductForm, setNewProductForm] = useState({
    name: '',
    description: '',
    slug: '',
    category: 'Oversized T-shirt',
    image: '',
    images: ''
  });

  // Add Variant Form
  const [newVariantForm, setNewVariantForm] = useState({
    productId: '',
    sku: '',
    color: '',
    size: 'M',
    price: 799,
    mrp: 999,
    inventory: 100,
    qikinkSku: ''
  });
  // Qikink Bulk Creator Form State
  const [bulkForm, setBulkForm] = useState({
    name: '',
    description: '',
    slug: '',
    category: 'Oversized T-shirt',
    image: '',
    images: '',
    price: 799,
    mrp: 999,
    inventory: 100,
    internalSkuPrefix: 'NABH-TEE',
    qikinkBaseSku: ''
  });

  const [bulkColors, setBulkColors] = useState([
    { name: 'White', code: 'WHT', qikinkCode: 'Wh', selected: true },
    { name: 'Black', code: 'BLK', qikinkCode: 'Bk', selected: true },
    { name: 'Lavender', code: 'LAV', qikinkCode: 'Lv', selected: true },
    { name: 'Navy Blue', code: 'NVY', qikinkCode: 'Ny', selected: false },
    { name: 'Beige', code: 'BGE', qikinkCode: 'Bg', selected: false },
    { name: 'Olive Green', code: 'OLV', qikinkCode: 'Ol', selected: false }
  ]);

  const [customColor, setCustomColor] = useState({ name: '', code: '', qikinkCode: '' });
  const [bulkSizes, setBulkSizes] = useState({ S: true, M: true, L: true, XL: true, XXL: true });

  // Qikink Auto-Sync Connection State
  const [qikinkEmail, setQikinkEmail] = useState('');
  const [qikinkOtp, setQikinkOtp] = useState('');
  const [qikinkClientId, setQikinkClientId] = useState(null);
  const [qikinkStep, setQikinkStep] = useState(1);
  const [qikinkConnecting, setQikinkConnecting] = useState(false);
  const [qikinkConnected, setQikinkConnected] = useState(false);
  const [storeTunnelUrl, setStoreTunnelUrl] = useState('https://ee03900e1a4a89.lhr.life');

  // Alerts
  const [alertMsg, setAlertMsg] = useState({ type: '', text: '' });

  // Model Photoshoot & Lookbook Manager State
  const [selectedLookbookProduct, setSelectedLookbookProduct] = useState('');
  const [selectedLookbookColor, setSelectedLookbookColor] = useState('');
  const [lookbookUploadUrl, setLookbookUploadUrl] = useState('');
  const [lookbookUploadBase64, setLookbookUploadBase64] = useState('');
  const [lookbookCustomColorInput, setLookbookCustomColorInput] = useState('');
  const [setAsMainCatalogImage, setSetAsMainCatalogImage] = useState(true);
  const [uploadingLookbook, setUploadingLookbook] = useState(false);
  const fileInputRef = useRef(null);

  // Abandoned Carts State
  const [abandonedCarts, setAbandonedCarts] = useState([]);
  const [sendingRecoveryId, setSendingRecoveryId] = useState(null);
  const [selectedAdminInvoiceOrder, setSelectedAdminInvoiceOrder] = useState(null);

  const showAlert = (type, text) => {
    setAlertMsg({ type, text });
    setTimeout(() => setAlertMsg({ type: '', text: '' }), 5000);
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [resMetrics, resOrders, resProducts, resCarts] = await Promise.all([
        fetch('/api/admin/metrics'),
        fetch('/api/admin/orders'),
        fetch('/api/admin/products'),
        fetch('/api/orders/abandoned-carts')
      ]);

      const dataMetrics = await resMetrics.json();
      const dataOrders = await resOrders.json();
      const dataProducts = await resProducts.json();
      const dataCarts = await resCarts.json();

      setMetrics(dataMetrics);
      setOrders(dataOrders);
      setProducts(dataProducts);
      setAbandonedCarts(Array.isArray(dataCarts) ? dataCarts : []);

      if (dataProducts.length > 0) {
        if (!newVariantForm.productId) {
          setNewVariantForm(prev => ({ ...prev, productId: dataProducts[0].product._id }));
        }
        if (!selectedLookbookProduct) {
          setSelectedLookbookProduct(dataProducts[0].product._id);
          const firstColors = [...new Set((dataProducts[0].variants || []).map(v => v.color))];
          if (firstColors.length > 0) {
            setSelectedLookbookColor(firstColors[0]);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
      showAlert('error', 'Failed to retrieve admin dashboard records');
    } finally {
      setLoading(false);
    }
  };

  const handleSendRecoveryEmail = async (cartId) => {
    setSendingRecoveryId(cartId);
    try {
      const res = await fetch(`/api/orders/abandoned-cart/${cartId}/send-recovery`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok) {
        showAlert('success', data.message || 'Recovery email sent successfully!');
        fetchAllData();
      } else {
        showAlert('error', data.message || 'Failed to send recovery email');
      }
    } catch (err) {
      showAlert('error', err.message);
    } finally {
      setSendingRecoveryId(null);
    }
  };

  const handleUploadLookbook = async () => {
    if (!selectedLookbookProduct || !selectedLookbookColor || (!lookbookUploadUrl && !lookbookUploadBase64)) {
      showAlert('error', 'Please select a product, a color, and provide an image file or URL');
      return;
    }
    setUploadingLookbook(true);
    try {
      const res = await fetch('/api/admin/upload-model-lookbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedLookbookProduct,
          color: selectedLookbookColor,
          imageUrl: lookbookUploadUrl,
          base64Data: lookbookUploadBase64,
          setAsMainCatalogImage
        })
      });
      const data = await res.json();
      if (data.success) {
        showAlert('success', data.message);
        setLookbookUploadUrl('');
        setLookbookUploadBase64('');
        if (fileInputRef.current) fileInputRef.current.value = '';
        fetchAllData();
      } else {
        showAlert('error', data.message || 'Upload failed');
      }
    } catch (err) {
      showAlert('error', err.message || 'Network error during upload');
    } finally {
      setUploadingLookbook(false);
    }
  };

  const handleSetPrimaryCatalogImage = async (imageUrl) => {
    if (!selectedLookbookProduct || !imageUrl) return;
    try {
      const res = await fetch('/api/admin/set-primary-catalog-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedLookbookProduct,
          imageUrl
        })
      });
      const data = await res.json();
      if (data.success) {
        showAlert('success', 'Set as primary catalog image on Shop and Home pages!');
        fetchAllData();
      } else {
        showAlert('error', data.message || 'Failed to update catalog image');
      }
    } catch (err) {
      showAlert('error', err.message);
    }
  };

  const handleDeleteLookbook = async (color) => {
    if (!selectedLookbookProduct) return;
    try {
      const res = await fetch('/api/admin/delete-model-lookbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedLookbookProduct,
          color
        })
      });
      const data = await res.json();
      if (data.success) {
        showAlert('success', data.message);
        fetchAllData();
      }
    } catch (err) {
      showAlert('error', err.message);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Sync manual Qikink dispatch
  const handleSyncQikink = async (orderId) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/sync-qikink`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok) {
        showAlert('success', 'Order successfully synced with Qikink!');
        fetchAllData();
      } else {
        throw new Error(data.message || 'Fulfillment request failed');
      }
    } catch (err) {
      showAlert('error', err.message);
    }
  };

  // Quick Order Status Updater
  const handleUpdateOrderStatus = async (orderId, newFulfillmentStatus) => {
    try {
      let trackingNum = null;
      if (newFulfillmentStatus === 'SHIPPED') {
        trackingNum = window.prompt('Enter Courier AWB / Tracking Number (optional):');
      }

      const payload = { fulfillmentStatus: newFulfillmentStatus };
      if (trackingNum) {
        payload.trackingNumber = trackingNum.trim();
        payload.trackingStatus = 'Dispatched / In Transit';
      }

      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        showAlert('success', data.message || 'Order status updated successfully');
        fetchAllData();
      } else {
        throw new Error(data.message || 'Status update failed');
      }
    } catch (err) {
      showAlert('error', err.message);
    }
  };

  // Edit Variant Inline
  const handleStartEdit = (variant) => {
    setEditingVariantId(variant._id);
    setEditForm({
      price: variant.price,
      mrp: variant.mrp,
      inventory: variant.inventory,
      qikinkSku: variant.qikinkSku
    });
  };

  const handleSaveVariant = async (variantId) => {
    try {
      const res = await fetch(`/api/admin/variants/${variantId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      const data = await res.json();
      if (res.ok) {
        showAlert('success', 'Variant specifications updated successfully.');
        setEditingVariantId(null);
        fetchAllData();
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      showAlert('error', err.message);
    }
  };

  // Toggle Product Active / Visible on Website
  const handleToggleProductActive = async (productId) => {
    try {
      const res = await fetch(`/api/admin/products/${productId}/toggle-active`, {
        method: 'PATCH'
      });
      const data = await res.json();
      if (res.ok) {
        showAlert('success', data.message);
        fetchAllData();
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      showAlert('error', err.message);
    }
  };

  // Bulk Set Stock for all variants of a product
  const handleSetProductStock = async (productId, inventory) => {
    try {
      const res = await fetch(`/api/admin/products/${productId}/set-stock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inventory })
      });
      const data = await res.json();
      if (res.ok) {
        showAlert('success', data.message);
        fetchAllData();
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      showAlert('error', err.message);
    }
  };

  // Delete product
  const handleDeleteProduct = async (productId, productName) => {
    if (!window.confirm(`Are you sure you want to completely delete "${productName}" and all of its variants?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok) {
        showAlert('success', data.message);
        fetchAllData();
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      showAlert('error', err.message);
    }
  };

  // Add Product Submit
  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!newProductForm.name || !newProductForm.description || !newProductForm.slug || !newProductForm.image) {
      showAlert('error', 'Please fill in all required product fields');
      return;
    }

    try {
      const imagesArr = newProductForm.images
        ? newProductForm.images.split(',').map((img) => img.trim())
        : [newProductForm.image];

      const res = await fetch('/api/admin/products/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newProductForm,
          images: imagesArr
        })
      });
      const data = await res.json();
      if (res.ok) {
        showAlert('success', 'New product catalog added successfully.');
        setNewProductForm({
          name: '',
          description: '',
          slug: '',
          category: 'Oversized T-shirt',
          image: '',
          images: ''
        });
        fetchAllData();
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      showAlert('error', err.message);
    }
  };

  // Add Variant Submit
  const handleAddVariant = async (e) => {
    e.preventDefault();
    if (!newVariantForm.productId || !newVariantForm.sku || !newVariantForm.color || !newVariantForm.qikinkSku) {
      showAlert('error', 'Please fill in all variant details');
      return;
    }

    try {
      const res = await fetch(`/api/admin/products/${newVariantForm.productId}/variants/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVariantForm)
      });
      const data = await res.json();
      if (res.ok) {
        showAlert('success', 'Variant model associated successfully.');
        setNewVariantForm(prev => ({
          ...prev,
          sku: '',
          color: '',
          qikinkSku: '',
          inventory: 100
        }));
        fetchAllData();
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      showAlert('error', err.message);
    }
  };

  const handleBulkNameChange = (nameVal) => {
    const slugVal = nameVal
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // remove special chars
      .replace(/[\s_]+/g, '-')  // replace spaces/underscores with hyphens
      .replace(/^-+|-+$/g, ''); // trim hyphens
    
    setBulkForm(prev => ({
      ...prev,
      name: nameVal,
      slug: slugVal
    }));
  };

  const handleBulkCreateSubmit = async (e) => {
    e.preventDefault();
    if (!bulkForm.name || !bulkForm.description || !bulkForm.slug || !bulkForm.image || !bulkForm.qikinkBaseSku) {
      showAlert('error', 'Please fill in all required bulk generator fields');
      return;
    }

    const selectedColors = bulkColors.filter(c => c.selected);
    if (selectedColors.length === 0) {
      showAlert('error', 'Please select at least one color');
      return;
    }

    const selectedSizes = Object.keys(bulkSizes).filter(s => bulkSizes[s]);
    if (selectedSizes.length === 0) {
      showAlert('error', 'Please select at least one size');
      return;
    }

    try {
      let imagesArr = [];
      if (bulkForm.images) {
        imagesArr = bulkForm.images.split(',').map((img) => img.trim());
      } else {
        imagesArr = [bulkForm.image];
        // Auto-detect and generate back mockup image
        if (bulkForm.image.includes('Front') || bulkForm.image.includes('front')) {
          const backImg = bulkForm.image.replace(/Front/gi, (match) => {
            return match === 'Front' ? 'Back' : 'back';
          });
          imagesArr.push(backImg);
        }
      }

      const res = await fetch('/api/admin/products/bulk-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...bulkForm,
          images: imagesArr,
          colors: selectedColors,
          sizes: selectedSizes
        })
      });

      const data = await res.json();
      if (res.ok) {
        showAlert('success', data.message || 'Product and variants bulk-created successfully!');
        setBulkForm({
          name: '',
          description: '',
          slug: '',
          category: 'Oversized T-shirt',
          image: '',
          images: '',
          price: 799,
          mrp: 999,
          inventory: 100,
          internalSkuPrefix: 'NABH-TEE',
          qikinkBaseSku: ''
        });
        // reset colors
        setBulkColors(prev => prev.map(c => ({ ...c, selected: c.name === 'White' || c.name === 'Black' || c.name === 'Lavender' })));
        fetchAllData();
      } else {
        throw new Error(data.message || 'Bulk creation failed');
      }
    } catch (err) {
      showAlert('error', err.message);
    }
  };

  const handleAddCustomColor = () => {
    if (!customColor.name || !customColor.code || !customColor.qikinkCode) {
      showAlert('error', 'Please fill in all custom color details (Name, Code, Qikink Code)');
      return;
    }
    setBulkColors(prev => [
      ...prev,
      {
        name: customColor.name,
        code: customColor.code.toUpperCase(),
        qikinkCode: customColor.qikinkCode,
        selected: true
      }
    ]);
    setCustomColor({ name: '', code: '', qikinkCode: '' });
  };

  const handleQikinkConnectStep1 = async (e) => {
    e.preventDefault();
    if (!qikinkEmail || !storeTunnelUrl) {
      showAlert('error', 'Please enter both your Qikink email and Store Tunnel URL');
      return;
    }
    setQikinkConnecting(true);
    try {
      const res = await fetch('/wp-json/wc/v3/qikink/connect-step1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: qikinkEmail, storeUrl: storeTunnelUrl })
      });
      const data = await res.json();
      if (res.ok) {
        setQikinkClientId(data.clientId);
        setQikinkStep(2);
        showAlert('success', 'OTP sent to your Qikink email. Please verify!');
      } else {
        throw new Error(data.message || 'Verification request failed');
      }
    } catch (err) {
      showAlert('error', err.message);
    } finally {
      setQikinkConnecting(false);
    }
  };

  const handleQikinkConnectStep2 = async (e) => {
    e.preventDefault();
    if (!qikinkOtp) {
      showAlert('error', 'Please enter the OTP');
      return;
    }
    setQikinkConnecting(true);
    try {
      const res = await fetch('/wp-json/wc/v3/qikink/connect-step2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          otp: qikinkOtp,
          clientId: qikinkClientId,
          storeUrl: storeTunnelUrl
        })
      });
      const data = await res.json();
      if (res.ok) {
        setQikinkConnected(true);
        setQikinkStep(1);
        setQikinkEmail('');
        setQikinkOtp('');
        showAlert('success', 'Store successfully connected to your Qikink Account!');
      } else {
        throw new Error(data.message || 'OTP verification failed');
      }
    } catch (err) {
      showAlert('error', err.message);
    } finally {
      setQikinkConnecting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 animate-fade-in">
      {/* Alert Component */}
      {alertMsg.text && (
        <div
          className={`fixed top-20 right-4 z-[999] border p-4 text-xs font-mono flex items-center gap-3 ${
            alertMsg.type === 'error'
              ? 'bg-red-950/60 border-red-500/30 text-red-400'
              : 'bg-green-950/60 border-green-500/30 text-green-400'
          }`}
        >
          <AlertCircle size={16} /> {alertMsg.text}
        </div>
      )}

      {/* Title */}
      <div className="border-b border-[#1C1C1E] pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-widest text-[#F9F9FB] flex items-center gap-3">
            <Shield size={28} className="text-[#8E8E93]" /> Admin Panel
          </h1>
          <p className="text-xs text-[#8E8E93] mt-2 font-mono uppercase">Manage inventory &bull; Fulfilment queues</p>
        </div>
        <button
          onClick={fetchAllData}
          className="text-xs uppercase font-mono tracking-widest bg-[#1C1C1E] border border-[#2C2C2E] text-white px-4 py-2 hover:bg-white hover:text-black flex items-center gap-1.5"
        >
          <RefreshCw size={12} /> Reload
        </button>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-[#1C1C1E] overflow-x-auto text-xs font-mono uppercase tracking-widest gap-4">
        {[
          { id: 'dashboard', label: 'Metrics', icon: <LayoutDashboard size={14} /> },
          { id: 'orders', label: 'Orders', icon: <ShoppingBag size={14} /> },
          {
            id: 'abandoned-carts',
            label: `Abandoned Carts (${abandonedCarts.filter((c) => c.status === 'ABANDONED').length})`,
            icon: <Mail size={14} className="text-amber-400" />
          },
          { id: 'products', label: 'Products Catalog', icon: <Package size={14} /> },
          { id: 'lookbook-studio', label: 'Model Photoshoots & Catalog', icon: <Camera size={14} className="text-white" /> },
          { id: 'qikink-generator', label: 'Qikink Smart Generator', icon: <Plus size={14} /> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-3.5 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'border-white text-white'
                : 'border-transparent text-[#555555] hover:text-[#8E8E93]'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-96">
          <div className="w-8 h-8 border-2 border-[#F9F9FB] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* TAB 1: METRICS */}
          {activeTab === 'dashboard' && metrics && (
            <div className="space-y-8 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="border border-[#1C1C1E] bg-[#0A0A0C] p-6 space-y-2">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-[#555555]">Total Revenue</span>
                  <p className="text-2xl font-bold text-[#F9F9FB]">₹{metrics.totalRevenue}</p>
                </div>
                <div className="border border-[#1C1C1E] bg-[#0A0A0C] p-6 space-y-2">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-[#555555]">Total Paid Orders</span>
                  <p className="text-2xl font-bold text-[#F9F9FB]">{metrics.totalOrdersCount}</p>
                </div>
                <div className="border border-[#1C1C1E] bg-[#0A0A0C] p-6 space-y-2">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-[#555555]">Fulfillments Pending</span>
                  <p className="text-2xl font-bold text-orange-400">{metrics.pendingFulfillments}</p>
                </div>
                <div className="border border-[#1C1C1E] bg-[#0A0A0C] p-6 space-y-2">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-[#555555]">Low Stock items</span>
                  <p className="text-2xl font-bold text-red-400">{metrics.lowStockCount}</p>
                </div>
              </div>

              {metrics.lowStockVariants.length > 0 && (
                <div className="border border-[#1C1C1E] bg-[#0A0A0C] p-6 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-red-400 flex items-center gap-2">
                    <AlertCircle size={14} /> Low Inventory Alerts
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono text-[#8E8E93]">
                      <thead>
                        <tr className="border-b border-[#2C2C2E] text-white">
                          <th className="pb-2">Product</th>
                          <th className="pb-2">SKU</th>
                          <th className="pb-2">Specs</th>
                          <th className="pb-2">Stock Remaining</th>
                        </tr>
                      </thead>
                      <tbody>
                        {metrics.lowStockVariants.map((v) => (
                          <tr key={v._id} className="border-b border-[#1C1C1E]/50">
                            <td className="py-2 text-white font-sans">{v.productId?.name}</td>
                            <td className="py-2">{v.sku}</td>
                            <td className="py-2 uppercase">{v.color} / {v.size}</td>
                            <td className="py-2 text-red-400 font-bold">{v.inventory} left</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ORDERS */}
          {activeTab === 'orders' && (
            <div className="border border-[#1C1C1E] bg-[#0A0A0C] overflow-hidden animate-fade-in">
              {orders.length === 0 ? (
                <div className="text-center py-16 text-[#555555] text-xs">No orders found in database.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono text-[#8E8E93] whitespace-nowrap">
                    <thead>
                      <tr className="bg-[#111113] border-b border-[#1C1C1E] text-white">
                        <th className="p-4">Order ID</th>
                        <th className="p-4">Customer</th>
                        <th className="p-4">Details</th>
                        <th className="p-4">Amount</th>
                        <th className="p-4">Payment</th>
                        <th className="p-4">Fulfillment</th>
                        <th className="p-4">Qikink Sync</th>
                        <th className="p-4">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1C1C1E]">
                      {orders.map((ord) => (
                        <tr key={ord._id} className="hover:bg-[#111113]/30">
                          <td className="p-4 font-bold text-white select-all">{ord.orderNumber}</td>
                          <td className="p-4 text-white font-sans">
                            <div>{ord.customer.name}</div>
                            <div className="text-[10px] text-[#555555] font-mono">{ord.customer.phone}</div>
                          </td>
                          <td className="p-4 text-[10px]">
                            {ord.items.map((it, i) => (
                              <div key={i} className="uppercase">
                                {it.color} / {it.size} x {it.quantity}
                              </div>
                            ))}
                          </td>
                          <td className="p-4 text-white">₹{ord.totalAmount}</td>
                          <td className="p-4">
                            <span
                              className={`px-2 py-0.5 text-[9px] font-bold ${
                                ord.paymentStatus === 'PAID'
                                  ? 'bg-green-950/60 text-green-400 border border-green-500/20'
                                  : 'bg-yellow-950/60 text-yellow-400 border border-yellow-500/20'
                              }`}
                            >
                              {ord.paymentStatus}
                            </span>
                          </td>
                          <td className="p-4 text-white uppercase text-[10px]">
                            {ord.fulfillmentStatus.replace(/_/g, ' ')}
                          </td>
                          <td className="p-4">
                            <div className="text-[10px] text-[#8E8E93]">{ord.qikinkOrderId || 'None'}</div>
                            <div className="text-[9px] text-[#555555]">{ord.trackingNumber || 'No tracking'}</div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <select
                                value={ord.fulfillmentStatus}
                                onChange={(e) => handleUpdateOrderStatus(ord._id, e.target.value)}
                                className="bg-[#050505] border border-[#2C2C2E] text-[10px] font-mono text-white px-2 py-1 focus:outline-none focus:border-white transition rounded-sm"
                              >
                                <option value="PENDING">PENDING</option>
                                <option value="SENT_TO_QIKINK">SENT TO FACTORY</option>
                                <option value="PRINTING">PRINTING</option>
                                <option value="SHIPPED">SHIPPED</option>
                                <option value="DELIVERED">DELIVERED</option>
                                <option value="CANCELLED">CANCELLED</option>
                              </select>

                              <button
                                onClick={() => setSelectedAdminInvoiceOrder(ord)}
                                className="text-[10px] font-mono text-[#8E8E93] hover:text-white flex items-center gap-1 border border-[#2C2C2E] px-2 py-1 bg-[#141416] transition rounded-sm"
                                title="View Tax Invoice"
                              >
                                <FileText size={11} /> Invoice
                              </button>

                              {ord.paymentStatus === 'PAID' && ord.fulfillmentStatus === 'PENDING' && (
                                <button
                                  onClick={() => handleSyncQikink(ord._id)}
                                  className="bg-[#F9F9FB] text-[#0A0A0A] font-sans font-bold text-[10px] px-2.5 py-1 hover:bg-[#E6E6FA] transition rounded-sm whitespace-nowrap"
                                >
                                  Sync Qikink
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PRODUCTS & VARIANTS MANAGER */}
          {activeTab === 'products' && (
            <div className="space-y-12 animate-fade-in">
              {/* Product and Variant Lists */}
              <div className="space-y-8">
                {products.map(({ product, variants: prodVariants, totalStock, inStock }) => {
                  const calculatedStock = totalStock !== undefined 
                    ? totalStock 
                    : prodVariants.reduce((sum, v) => sum + (v.inventory || 0), 0);
                  const isSoldOut = calculatedStock === 0;

                  return (
                    <div key={product._id} className={`border ${isSoldOut ? 'border-red-900/40 bg-[#0C080A]' : 'border-[#1C1C1E] bg-[#0A0A0C]'} p-6 space-y-4`}>
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-[#1C1C1E] pb-4 gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <h3 className="text-base font-bold text-white uppercase">{product.name}</h3>
                            
                            {/* Live/Hidden Storefront Status */}
                            <span
                              className={`px-2.5 py-0.5 text-[9px] font-mono uppercase font-bold flex items-center gap-1.5 ${
                                product.active
                                  ? 'bg-green-950/80 text-green-400 border border-green-500/30'
                                  : 'bg-amber-950/80 text-amber-400 border border-amber-500/30'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${product.active ? 'bg-green-400 animate-pulse' : 'bg-amber-400'}`}></span>
                              {product.active ? 'LIVE ON STORE' : 'HIDDEN FROM STORE'}
                            </span>

                            {/* Stock Status Badge */}
                            <span
                              className={`px-2.5 py-0.5 text-[9px] font-mono uppercase font-bold ${
                                isSoldOut
                                  ? 'bg-red-950/90 text-red-400 border border-red-500/30'
                                  : calculatedStock < 20
                                  ? 'bg-orange-950/90 text-orange-400 border border-orange-500/30'
                                  : 'bg-[#1C1C1E] text-[#8E8E93] border border-[#2C2C2E]'
                              }`}
                            >
                              {isSoldOut ? 'SOLD OUT (0 units)' : `Stock: ${calculatedStock} units`}
                            </span>
                          </div>

                          <p className="text-[10px] text-[#555555] font-mono uppercase">
                            Slug: {product.slug} &bull; Category: {product.category} &bull; Variants: {prodVariants.length}
                          </p>
                        </div>

                        {/* Store Visibility and Stock Quick Controls */}
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Toggle Active / Hide from Website Button */}
                          <button
                            onClick={() => handleToggleProductActive(product._id)}
                            className={`text-[10px] uppercase font-mono tracking-wider px-3 py-1.5 flex items-center gap-1.5 border transition ${
                              product.active
                                ? 'bg-[#1C1C1E] border-[#333336] text-[#8E8E93] hover:text-amber-400 hover:border-amber-500/40'
                                : 'bg-green-950/60 border-green-500/40 text-green-400 hover:bg-green-900/60'
                            }`}
                            title={product.active ? 'Hide this product from customers on website' : 'Publish this product to customer website'}
                          >
                            {product.active ? <EyeOff size={12} /> : <Eye size={12} />}
                            {product.active ? 'Hide from Webpage' : 'Show on Webpage'}
                          </button>

                          {/* Quick Set Out of Stock (0 units) */}
                          <button
                            onClick={() => handleSetProductStock(product._id, 0)}
                            className="text-[10px] uppercase font-mono tracking-wider px-3 py-1.5 flex items-center gap-1.5 bg-red-950/30 border border-red-800/40 text-red-400 hover:bg-red-900/40 transition"
                            title="Set all variant stock to 0 to simulate/mark Out of Stock"
                          >
                            <Ban size={12} /> Set Out of Stock (0)
                          </button>

                          {/* Quick Restock (+100 units) */}
                          <button
                            onClick={() => handleSetProductStock(product._id, 100)}
                            className="text-[10px] uppercase font-mono tracking-wider px-3 py-1.5 flex items-center gap-1.5 bg-green-950/30 border border-green-800/40 text-green-400 hover:bg-green-900/40 transition"
                            title="Restock all variants to 100 units"
                          >
                            <RefreshCw size={12} /> Restock (100)
                          </button>

                          {/* Delete Product */}
                          <button
                            onClick={() => handleDeleteProduct(product._id, product.name)}
                            className="p-1.5 text-[#555555] hover:text-red-400 hover:bg-red-950/20 border border-transparent hover:border-red-900/30 transition rounded-sm"
                            title="Delete Product and Variants"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-mono text-[#8E8E93] whitespace-nowrap">
                        <thead>
                          <tr className="border-b border-[#2C2C2E] text-white">
                            <th className="pb-2">Internal SKU</th>
                            <th className="pb-2">Color</th>
                            <th className="pb-2">Size</th>
                            <th className="pb-2">Price (₹)</th>
                            <th className="pb-2">MRP (₹)</th>
                            <th className="pb-2">Stock</th>
                            <th className="pb-2">Qikink Print SKU</th>
                            <th className="pb-2 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1C1C1E]/30">
                          {prodVariants.map((v) => (
                            <tr key={v._id}>
                              <td className="py-3 font-bold text-white select-all">{v.sku}</td>
                              <td className="py-3 uppercase text-[10px]">{v.color}</td>
                              <td className="py-3 uppercase">{v.size}</td>
                              
                              {/* Price field */}
                              <td className="py-3">
                                {editingVariantId === v._id ? (
                                  <input
                                    type="number"
                                    value={editForm.price}
                                    onChange={(e) => setEditForm({ ...editForm, price: parseInt(e.target.value) || 0 })}
                                    className="w-16 bg-[#050505] border border-[#2C2C2E] px-1 py-0.5 text-white"
                                  />
                                ) : (
                                  `₹${v.price}`
                                )}
                              </td>

                              {/* MRP field */}
                              <td className="py-3">
                                {editingVariantId === v._id ? (
                                  <input
                                    type="number"
                                    value={editForm.mrp}
                                    onChange={(e) => setEditForm({ ...editForm, mrp: parseInt(e.target.value) || 0 })}
                                    className="w-16 bg-[#050505] border border-[#2C2C2E] px-1 py-0.5 text-white"
                                  />
                                ) : (
                                  `₹${v.mrp}`
                                )}
                              </td>

                              {/* Inventory field */}
                              <td className="py-3">
                                {editingVariantId === v._id ? (
                                  <input
                                    type="number"
                                    value={editForm.inventory}
                                    onChange={(e) => setEditForm({ ...editForm, inventory: parseInt(e.target.value) || 0 })}
                                    className="w-16 bg-[#050505] border border-[#2C2C2E] px-1 py-0.5 text-white"
                                  />
                                ) : (
                                  <span className={v.inventory < 20 ? 'text-red-400 font-bold' : ''}>
                                    {v.inventory} items
                                  </span>
                                )}
                              </td>

                              {/* Qikink SKU field */}
                              <td className="py-3 font-mono">
                                {editingVariantId === v._id ? (
                                  <input
                                    type="text"
                                    value={editForm.qikinkSku}
                                    onChange={(e) => setEditForm({ ...editForm, qikinkSku: e.target.value })}
                                    className="w-40 bg-[#050505] border border-[#2C2C2E] px-2 py-0.5 text-white"
                                  />
                                ) : (
                                  v.qikinkSku
                                )}
                              </td>

                              {/* Save/Edit Actions */}
                              <td className="py-3 text-right">
                                {editingVariantId === v._id ? (
                                  <div className="flex justify-end gap-2">
                                    <button
                                      onClick={() => handleSaveVariant(v._id)}
                                      className="p-1 hover:text-green-400"
                                      title="Save Specification"
                                    >
                                      <Check size={16} />
                                    </button>
                                    <button
                                      onClick={() => setEditingVariantId(null)}
                                      className="p-1 hover:text-red-400"
                                      title="Cancel"
                                    >
                                      <X size={16} />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => handleStartEdit(v)}
                                    className="p-1 text-[#555555] hover:text-white"
                                    title="Edit Specs"
                                  >
                                    <Pencil size={14} />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>

              {/* Add New Product and Variant forms side-by-side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Create Product Form */}
                <div className="border border-[#1C1C1E] bg-[#0A0A0C] p-6 space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-[#F9F9FB] flex items-center gap-2">
                    <Plus size={16} /> Add Product
                  </h3>
                  <form onSubmit={handleAddProduct} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-mono tracking-widest text-[#555555]">Product Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. NABH Drop Shoulder Tee"
                        value={newProductForm.name}
                        onChange={(e) => setNewProductForm({ ...newProductForm, name: e.target.value })}
                        className="w-full bg-[#050505] border border-[#2C2C2E] text-xs text-white px-3 py-2.5 focus:outline-none focus:border-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-mono tracking-widest text-[#555555]">Slug (URL Identifier) *</label>
                      <input
                        type="text"
                        placeholder="e.g. nabh-drop-shoulder-tee"
                        value={newProductForm.slug}
                        onChange={(e) => setNewProductForm({ ...newProductForm, slug: e.target.value })}
                        className="w-full bg-[#050505] border border-[#2C2C2E] text-xs text-white px-3 py-2.5 focus:outline-none focus:border-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-mono tracking-widest text-[#555555]">Description *</label>
                      <textarea
                        placeholder="Detailed fabric, GSM, fit, and model specs."
                        rows={3}
                        value={newProductForm.description}
                        onChange={(e) => setNewProductForm({ ...newProductForm, description: e.target.value })}
                        className="w-full bg-[#050505] border border-[#2C2C2E] text-xs text-white p-3 focus:outline-none focus:border-white"
                      ></textarea>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-mono tracking-widest text-[#555555]">Category</label>
                      <input
                        type="text"
                        value={newProductForm.category}
                        onChange={(e) => setNewProductForm({ ...newProductForm, category: e.target.value })}
                        className="w-full bg-[#050505] border border-[#2C2C2E] text-xs text-white px-3 py-2.5 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-mono tracking-widest text-[#555555]">Main Image URL *</label>
                      <input
                        type="text"
                        placeholder="https://..."
                        value={newProductForm.image}
                        onChange={(e) => setNewProductForm({ ...newProductForm, image: e.target.value })}
                        className="w-full bg-[#050505] border border-[#2C2C2E] text-xs text-white px-3 py-2.5 focus:outline-none focus:border-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-mono tracking-widest text-[#555555]">Gallery Image URLs (Comma Separated)</label>
                      <input
                        type="text"
                        placeholder="url1, url2, url3"
                        value={newProductForm.images}
                        onChange={(e) => setNewProductForm({ ...newProductForm, images: e.target.value })}
                        className="w-full bg-[#050505] border border-[#2C2C2E] text-xs text-white px-3 py-2.5 focus:outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      className="bg-[#F9F9FB] text-[#0A0A0A] text-[10px] font-bold uppercase tracking-widest w-full py-3.5 hover:bg-[#E6E6FA] transition"
                    >
                      Save Product
                    </button>
                  </form>
                </div>

                {/* Create Variant Form */}
                <div className="border border-[#1C1C1E] bg-[#0A0A0C] p-6 space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-[#F9F9FB] flex items-center gap-2">
                    <Plus size={16} /> Add Product Variant
                  </h3>
                  <form onSubmit={handleAddVariant} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-mono tracking-widest text-[#555555]">Target Product *</label>
                      <select
                        value={newVariantForm.productId}
                        onChange={(e) => setNewVariantForm({ ...newVariantForm, productId: e.target.value })}
                        className="w-full bg-[#050505] border border-[#2C2C2E] text-xs text-white px-3 py-2.5 focus:outline-none"
                      >
                        {products.map(({ product }) => (
                          <option key={product._id} value={product._id} className="bg-[#0A0A0C]">
                            {product.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-mono tracking-widest text-[#555555]">Internal SKU *</label>
                        <input
                          type="text"
                          placeholder="e.g. NABH-OVS-LAV-S"
                          value={newVariantForm.sku}
                          onChange={(e) => setNewVariantForm({ ...newVariantForm, sku: e.target.value })}
                          className="w-full bg-[#050505] border border-[#2C2C2E] text-xs text-white px-3 py-2.5 focus:outline-none focus:border-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-mono tracking-widest text-[#555555]">Color Name *</label>
                        <input
                          type="text"
                          placeholder="e.g. Lavender"
                          value={newVariantForm.color}
                          onChange={(e) => setNewVariantForm({ ...newVariantForm, color: e.target.value })}
                          className="w-full bg-[#050505] border border-[#2C2C2E] text-xs text-white px-3 py-2.5 focus:outline-none focus:border-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-mono tracking-widest text-[#555555]">Size Selection</label>
                        <select
                          value={newVariantForm.size}
                          onChange={(e) => setNewVariantForm({ ...newVariantForm, size: e.target.value })}
                          className="w-full bg-[#050505] border border-[#2C2C2E] text-xs text-white px-3 py-2.5 focus:outline-none"
                        >
                          <option value="S">S</option>
                          <option value="M">M</option>
                          <option value="L">L</option>
                          <option value="XL">XL</option>
                          <option value="XXL">XXL</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-mono tracking-widest text-[#555555]">Price (₹) *</label>
                        <input
                          type="number"
                          value={newVariantForm.price}
                          onChange={(e) => setNewVariantForm({ ...newVariantForm, price: parseInt(e.target.value) || 0 })}
                          className="w-full bg-[#050505] border border-[#2C2C2E] text-xs text-white px-3 py-2.5 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-mono tracking-widest text-[#555555]">MRP (₹) *</label>
                        <input
                          type="number"
                          value={newVariantForm.mrp}
                          onChange={(e) => setNewVariantForm({ ...newVariantForm, mrp: parseInt(e.target.value) || 0 })}
                          className="w-full bg-[#050505] border border-[#2C2C2E] text-xs text-white px-3 py-2.5 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-mono tracking-widest text-[#555555]">Initial Inventory</label>
                        <input
                          type="number"
                          value={newVariantForm.inventory}
                          onChange={(e) => setNewVariantForm({ ...newVariantForm, inventory: parseInt(e.target.value) || 0 })}
                          className="w-full bg-[#050505] border border-[#2C2C2E] text-xs text-white px-3 py-2.5 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-mono tracking-widest text-[#555555]">Qikink Print SKU *</label>
                        <input
                          type="text"
                          placeholder="e.g. QIK-OVS-LAV-S"
                          value={newVariantForm.qikinkSku}
                          onChange={(e) => setNewVariantForm({ ...newVariantForm, qikinkSku: e.target.value })}
                          className="w-full bg-[#050505] border border-[#2C2C2E] text-xs text-white px-3 py-2.5"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="bg-[#F9F9FB] text-[#0A0A0A] text-[10px] font-bold uppercase tracking-widest w-full py-3.5 hover:bg-[#E6E6FA] transition"
                    >
                      Save Variant
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: QIKINK SMART GENERATOR */}
          {activeTab === 'qikink-generator' && (
            <div className="border border-[#1C1C1E] bg-[#0A0A0C] p-8 space-y-8 animate-fade-in max-w-4xl mx-auto">
              <div>
                <h2 className="text-lg font-bold text-white uppercase tracking-wider">Qikink Smart Generator</h2>
                <p className="text-xs text-[#8E8E93] font-mono mt-1 uppercase">Bulk generate a new product with all size/color combinations mapped to Qikink SKUs</p>
              </div>

              {/* Qikink Connection Status / Setup */}
              <div className="border border-[#2C2C2E] bg-[#050505] p-5 space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${qikinkConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                    Qikink Auto-Sync: {qikinkConnected ? 'Connected & Live' : 'Disconnected'}
                  </h3>
                  <p className="text-[10px] text-[#8E8E93] font-mono uppercase mt-1">
                    Connect directly to Qikink to automatically import designs without filling the forms manually.
                  </p>
                </div>

                {!qikinkConnected ? (
                  <form onSubmit={qikinkStep === 1 ? handleQikinkConnectStep1 : handleQikinkConnectStep2} className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-mono tracking-widest text-[#555555]">Your Store Public URL (Tunnel/Ngrok)</label>
                        <input
                          type="text"
                          value={storeTunnelUrl}
                          onChange={(e) => setStoreTunnelUrl(e.target.value)}
                          placeholder="e.g. https://xyz.loca.lt"
                          className="w-full bg-[#0A0A0C] border border-[#2C2C2E] text-xs text-white px-3 py-2 focus:outline-none"
                          disabled={qikinkStep === 2 || qikinkConnecting}
                        />
                      </div>
                      {qikinkStep === 1 ? (
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase font-mono tracking-widest text-[#555555]">Qikink Registered Email</label>
                          <input
                            type="email"
                            value={qikinkEmail}
                            onChange={(e) => setQikinkEmail(e.target.value)}
                            placeholder="your-email@qikink.com"
                            className="w-full bg-[#0A0A0C] border border-[#2C2C2E] text-xs text-white px-3 py-2 focus:outline-none"
                            disabled={qikinkConnecting}
                          />
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase font-mono tracking-widest text-[#555555]">Enter OTP Code</label>
                          <input
                            type="text"
                            value={qikinkOtp}
                            onChange={(e) => setQikinkOtp(e.target.value)}
                            placeholder="Enter the 6-digit OTP code"
                            className="w-full bg-[#0A0A0C] border border-[#2C2C2E] text-xs text-white px-3 py-2 focus:outline-none"
                            disabled={qikinkConnecting}
                          />
                        </div>
                      )}
                    </div>
                    <button
                      type="submit"
                      className="text-[9px] font-mono uppercase tracking-widest bg-white text-black font-bold px-4 py-2 hover:bg-[#E6E6FA] transition"
                      disabled={qikinkConnecting}
                    >
                      {qikinkConnecting ? 'Processing...' : qikinkStep === 1 ? 'Send Connection OTP' : 'Verify & Complete Connection'}
                    </button>
                    {qikinkStep === 2 && (
                      <button
                        type="button"
                        onClick={() => setQikinkStep(1)}
                        className="text-[9px] font-mono uppercase tracking-widest border border-[#2C2C2E] text-white px-4 py-2 hover:bg-[#1C1C1E] transition ml-2"
                      >
                        Cancel
                      </button>
                    )}
                  </form>
                ) : (
                  <div className="bg-[#1C1C1E]/30 p-3 text-[11px] font-mono text-green-400 border border-green-500/20">
                    Your website is fully connected! Pressing "Push to Store" inside Qikink Dashboard will now automatically sync items to your catalog in real-time.
                  </div>
                )}
              </div>

              <hr className="border-[#1C1C1E]" />

              <form onSubmit={handleBulkCreateSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column: Product Info */}
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-mono tracking-widest text-[#555555]">Product Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. Unisex Terry Oversized Tee"
                        value={bulkForm.name}
                        onChange={(e) => handleBulkNameChange(e.target.value)}
                        className="w-full bg-[#050505] border border-[#2C2C2E] text-xs text-white px-3 py-2.5 focus:outline-none focus:border-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-mono tracking-widest text-[#555555]">Slug (URL) *</label>
                      <input
                        type="text"
                        placeholder="e.g. unisex-terry-oversized-tee"
                        value={bulkForm.slug}
                        onChange={(e) => setBulkForm({ ...bulkForm, slug: e.target.value })}
                        className="w-full bg-[#050505] border border-[#2C2C2E] text-xs text-white px-3 py-2.5 focus:outline-none focus:border-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-mono tracking-widest text-[#555555]">Description *</label>
                      <textarea
                        placeholder="Premium fit details, GSM, fabric composition, etc."
                        rows={4}
                        value={bulkForm.description}
                        onChange={(e) => setBulkForm({ ...bulkForm, description: e.target.value })}
                        className="w-full bg-[#050505] border border-[#2C2C2E] text-xs text-white p-3 focus:outline-none focus:border-white"
                      ></textarea>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-mono tracking-widest text-[#555555]">Category</label>
                        <input
                          type="text"
                          value={bulkForm.category}
                          onChange={(e) => setBulkForm({ ...bulkForm, category: e.target.value })}
                          className="w-full bg-[#050505] border border-[#2C2C2E] text-xs text-white px-3 py-2.5 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-mono tracking-widest text-[#555555]">Internal SKU Prefix *</label>
                        <input
                          type="text"
                          placeholder="e.g. NABH-TEE"
                          value={bulkForm.internalSkuPrefix}
                          onChange={(e) => setBulkForm({ ...bulkForm, internalSkuPrefix: e.target.value })}
                          className="w-full bg-[#050505] border border-[#2C2C2E] text-xs text-white px-3 py-2.5 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Fulfillment & Pricing */}
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-mono tracking-widest text-[#555555]">Qikink Base SKU *</label>
                      <input
                        type="text"
                        placeholder="Paste Qikink Base SKU (e.g. UOsTMRnHs)"
                        value={bulkForm.qikinkBaseSku}
                        onChange={(e) => setBulkForm({ ...bulkForm, qikinkBaseSku: e.target.value })}
                        className="w-full bg-[#050505] border border-[#2C2C2E] text-xs text-white px-3 py-2.5 focus:outline-none focus:border-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-mono tracking-widest text-[#555555]">Main Mockup Image URL *</label>
                      <input
                        type="text"
                        placeholder="https://..."
                        value={bulkForm.image}
                        onChange={(e) => setBulkForm({ ...bulkForm, image: e.target.value })}
                        className="w-full bg-[#050505] border border-[#2C2C2E] text-xs text-white px-3 py-2.5 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-mono tracking-widest text-[#555555]">Gallery Image URLs (Comma Separated)</label>
                      <input
                        type="text"
                        placeholder="url1, url2..."
                        value={bulkForm.images}
                        onChange={(e) => setBulkForm({ ...bulkForm, images: e.target.value })}
                        className="w-full bg-[#050505] border border-[#2C2C2E] text-xs text-white px-3 py-2.5 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-mono tracking-widest text-[#555555]">Selling Price (₹)</label>
                        <input
                          type="number"
                          value={bulkForm.price}
                          onChange={(e) => setBulkForm({ ...bulkForm, price: parseInt(e.target.value) || 0 })}
                          className="w-full bg-[#050505] border border-[#2C2C2E] text-xs text-white px-3 py-2.5 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-mono tracking-widest text-[#555555]">MRP (₹)</label>
                        <input
                          type="number"
                          value={bulkForm.mrp}
                          onChange={(e) => setBulkForm({ ...bulkForm, mrp: parseInt(e.target.value) || 0 })}
                          className="w-full bg-[#050505] border border-[#2C2C2E] text-xs text-white px-3 py-2.5 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-mono tracking-widest text-[#555555]">Initial Stock</label>
                        <input
                          type="number"
                          value={bulkForm.inventory}
                          onChange={(e) => setBulkForm({ ...bulkForm, inventory: parseInt(e.target.value) || 0 })}
                          className="w-full bg-[#050505] border border-[#2C2C2E] text-xs text-white px-3 py-2.5 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <hr className="border-[#1C1C1E] my-6" />

                {/* Color Selection & Custom Color */}
                <div className="space-y-3">
                  <label className="text-[10px] uppercase font-mono tracking-widest text-[#8E8E93] font-bold">Select Active Colors</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                    {bulkColors.map((color, index) => (
                      <label key={index} className="flex items-center gap-2 bg-[#050505] border border-[#2C2C2E] p-2.5 text-xs font-mono uppercase cursor-pointer hover:border-white">
                        <input
                          type="checkbox"
                          checked={color.selected}
                          onChange={() => {
                            const newColors = [...bulkColors];
                            newColors[index].selected = !newColors[index].selected;
                            setBulkColors(newColors);
                          }}
                          className="accent-white"
                        />
                        <div>
                          <div className="text-white font-bold text-[11px]">{color.name}</div>
                          <div className="text-[9px] text-[#555555]">{color.code} &bull; {color.qikinkCode}</div>
                        </div>
                      </label>
                    ))}
                  </div>

                  {/* Add Custom Color Section */}
                  <div className="bg-[#050505] border border-[#2C2C2E]/40 p-4 space-y-3 max-w-xl">
                    <div className="text-[9px] uppercase font-mono tracking-widest text-[#8E8E93] font-bold">Add Custom Color Option</div>
                    <div className="grid grid-cols-3 gap-3">
                      <input
                        type="text"
                        placeholder="Color Name (e.g. Red)"
                        value={customColor.name}
                        onChange={(e) => setCustomColor({ ...customColor, name: e.target.value })}
                        className="bg-[#0A0A0C] border border-[#2C2C2E] text-[11px] px-2 py-2 text-white placeholder-[#555555]"
                      />
                      <input
                        type="text"
                        placeholder="Internal Code (e.g. RED)"
                        value={customColor.code}
                        onChange={(e) => setCustomColor({ ...customColor, code: e.target.value })}
                        className="bg-[#0A0A0C] border border-[#2C2C2E] text-[11px] px-2 py-2 text-white placeholder-[#555555]"
                      />
                      <input
                        type="text"
                        placeholder="Qikink Code (e.g. Rd)"
                        value={customColor.qikinkCode}
                        onChange={(e) => setCustomColor({ ...customColor, qikinkCode: e.target.value })}
                        className="bg-[#0A0A0C] border border-[#2C2C2E] text-[11px] px-2 py-2 text-white placeholder-[#555555]"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddCustomColor}
                      className="text-[9px] font-mono uppercase tracking-widest bg-[#1C1C1E] border border-[#2C2C2E] text-white px-3 py-1.5 hover:bg-white hover:text-black"
                    >
                      + Add Color to List
                    </button>
                  </div>
                </div>

                <hr className="border-[#1C1C1E] my-6" />

                {/* Size Selection */}
                <div className="space-y-3">
                  <label className="text-[10px] uppercase font-mono tracking-widest text-[#8E8E93] font-bold">Select Active Sizes</label>
                  <div className="flex gap-4">
                    {Object.keys(bulkSizes).map((size) => (
                      <label key={size} className="flex items-center gap-2 bg-[#050505] border border-[#2C2C2E] px-4 py-2 text-xs font-mono uppercase cursor-pointer hover:border-white">
                        <input
                          type="checkbox"
                          checked={bulkSizes[size]}
                          onChange={() => setBulkSizes({ ...bulkSizes, [size]: !bulkSizes[size] })}
                          className="accent-white"
                        />
                        {size}
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="bg-[#F9F9FB] text-[#0A0A0A] font-bold uppercase text-[10px] tracking-widest w-full py-4 hover:bg-[#E6E6FA] transition mt-6"
                >
                  Generate Product & Mapped Variants
                </button>
              </form>
            </div>
          )}

          {/* TAB 5: MODEL PHOTOSHOOT & LOOKBOOK MANAGER */}
          {activeTab === 'lookbook-studio' && (
            <div className="space-y-8 animate-fade-in max-w-5xl">
              <div className="border border-[#1C1C1E] bg-[#0A0A0C] p-8 space-y-6">
                <div>
                  <h2 className="text-xl font-bold uppercase tracking-wide text-[#F9F9FB] flex items-center gap-2">
                    <Camera className="text-white" size={20} /> Model Photoshoot &amp; Catalog Manager
                  </h2>
                  <p className="text-xs text-[#8E8E93] mt-1 font-mono uppercase">
                    Upload real photoshoot pictures of models wearing your garments. Uploaded photos are displayed in the live catalog on Shop &amp; Home pages and across product color views.
                  </p>
                </div>

                {/* Step 1: Select Product & Color */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#050505] border border-[#1C1C1E] p-6 rounded-sm">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-mono tracking-widest text-[#8E8E93] font-bold">1. Select Target Product</label>
                    <select
                      value={selectedLookbookProduct}
                      onChange={(e) => {
                        setSelectedLookbookProduct(e.target.value);
                        const selectedProd = products.find(p => p.product._id === e.target.value);
                        const pColors = [...new Set((selectedProd?.variants || []).map(v => v.color))];
                        if (pColors.length > 0) setSelectedLookbookColor(pColors[0]);
                      }}
                      className="bg-[#0A0A0C] border border-[#2C2C2E] text-xs px-3 py-3 text-white font-mono w-full focus:border-white"
                    >
                      {products.map(({ product }) => (
                        <option key={product._id} value={product._id}>
                          {product.name} ({product.category} &bull; {product.gender || 'Unisex'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] uppercase font-mono tracking-widest text-[#8E8E93] font-bold">2. Select Garment Color</label>
                      <span className="text-[10px] font-mono uppercase text-indigo-400 font-bold">Selected: {selectedLookbookColor || 'None'}</span>
                    </div>

                    {/* Active Product Colors */}
                    {(() => {
                      const activeProd = products.find(p => p.product._id === selectedLookbookProduct);
                      const availableColors = [...new Set((activeProd?.variants || []).map(v => v.color))];
                      
                      const allSuggested = [
                        ...availableColors,
                        'White', 'Black', 'Lavender', 'Light Baby Pink', 'Baby Blue', 'Off White', 'Red', 'Navy Blue', 'Olive Green', 'Beige', 'Yellow'
                      ];
                      const uniqueSuggestions = [...new Set(allSuggested)];

                      return (
                        <div className="space-y-3">
                          <div className="flex gap-2 flex-wrap max-h-36 overflow-y-auto p-1 bg-[#08080A] border border-[#1C1C1E] rounded-sm">
                            {uniqueSuggestions.map((color) => {
                              const isSelected = selectedLookbookColor?.toLowerCase() === color.toLowerCase();
                              const isExisting = availableColors.map(c => c.toLowerCase()).includes(color.toLowerCase());
                              return (
                                <button
                                  key={color}
                                  type="button"
                                  onClick={() => setSelectedLookbookColor(color)}
                                  className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider border rounded-sm flex items-center gap-1.5 transition-all ${
                                    isSelected
                                      ? 'border-white bg-[#1C1C1E] text-white font-bold ring-1 ring-white'
                                      : 'border-[#2C2C2E] bg-[#0A0A0C] text-[#8E8E93] hover:border-white hover:text-white'
                                  }`}
                                >
                                  <span>{color}</span>
                                  {isExisting && <span className="text-[8px] bg-zinc-800 text-zinc-400 px-1 rounded">STORE</span>}
                                </button>
                              );
                            })}
                          </div>

                          {/* Type Any Custom Color */}
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Or Type Any Color (e.g. Lavender, Charcoal, Maroon)..."
                              value={lookbookCustomColorInput}
                              onChange={(e) => setLookbookCustomColorInput(e.target.value)}
                              className="bg-[#0A0A0C] border border-[#2C2C2E] text-xs px-3 py-2 text-white font-mono flex-1 placeholder-[#555555]"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (lookbookCustomColorInput.trim()) {
                                  setSelectedLookbookColor(lookbookCustomColorInput.trim());
                                  setLookbookCustomColorInput('');
                                }
                              }}
                              className="bg-[#1C1C1E] border border-[#2C2C2E] text-white px-4 py-2 text-xs font-mono uppercase hover:bg-white hover:text-black transition"
                            >
                              Use Color
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Model Photoshoot Uploader Box */}
                <div className="border border-[#1C1C1E] bg-[#050505] p-6 space-y-6">
                  <div className="flex items-center gap-2 border-b border-[#1C1C1E] pb-3">
                    <Upload className="text-white" size={18} />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-white">Upload Model Photoshoot Picture</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    {/* File Upload & URL inputs */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-mono tracking-widest text-[#8E8E93]">Choose Image File (JPG, PNG, WebP)</label>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                setLookbookUploadBase64(event.target.result);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="bg-[#0A0A0C] border border-[#2C2C2E] text-xs px-3 py-2 text-white font-mono w-full file:bg-[#1C1C1E] file:border-0 file:text-white file:text-xs file:font-mono file:px-3 file:py-1 file:mr-3 file:cursor-pointer"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-mono tracking-widest text-[#8E8E93]">Or Image URL</label>
                        <input
                          type="text"
                          placeholder="https://.../model-photo.jpg"
                          value={lookbookUploadUrl}
                          onChange={(e) => setLookbookUploadUrl(e.target.value)}
                          className="bg-[#0A0A0C] border border-[#2C2C2E] text-xs px-3 py-2.5 text-white font-mono w-full"
                        />
                      </div>

                      {/* Primary Catalog Checkbox */}
                      <label className="flex items-center gap-3 bg-[#0A0A0C] border border-[#2C2C2E] p-3 cursor-pointer hover:border-white transition">
                        <input
                          type="checkbox"
                          checked={setAsMainCatalogImage}
                          onChange={(e) => setSetAsMainCatalogImage(e.target.checked)}
                          className="accent-white w-4 h-4 cursor-pointer"
                        />
                        <div>
                          <div className="text-xs font-mono text-white font-bold uppercase">Set as Main Product Image in Shop Catalog</div>
                          <div className="text-[10px] font-mono text-[#8E8E93]">This photo will be the primary picture shown on the Shop and Home catalog cards.</div>
                        </div>
                      </label>
                    </div>

                    {/* Preview Box */}
                    <div className="border border-[#2C2C2E] bg-[#0A0A0C] p-4 flex flex-col items-center justify-center min-h-[180px] rounded-sm">
                      {lookbookUploadBase64 || lookbookUploadUrl ? (
                        <div className="space-y-2 text-center">
                          <div className="w-36 h-48 mx-auto bg-black border border-zinc-800 overflow-hidden flex items-center justify-center">
                            <img
                              src={lookbookUploadBase64 || lookbookUploadUrl}
                              alt="Upload preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span className="text-[10px] font-mono text-green-400 block uppercase">
                            Ready to assign to &ldquo;{selectedLookbookColor}&rdquo;
                          </span>
                        </div>
                      ) : (
                        <div className="text-center text-zinc-600 space-y-1">
                          <Camera size={32} className="mx-auto text-zinc-700" />
                          <p className="text-xs font-mono">Select a file or paste URL to preview</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={uploadingLookbook}
                    onClick={handleUploadLookbook}
                    className="w-full bg-[#F9F9FB] hover:bg-[#E6E6FA] text-[#0A0A0A] font-bold uppercase text-[10px] font-mono tracking-widest py-4 flex items-center justify-center gap-2 transition shadow-lg disabled:opacity-50"
                  >
                    {uploadingLookbook ? (
                      <>
                        <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                        Uploading Model Photo to Catalog...
                      </>
                    ) : (
                      <>
                        <Upload size={14} /> Upload &amp; Set as Live Catalog Model for {selectedLookbookColor || 'Garment'}
                      </>
                    )}
                  </button>
                </div>

                {/* Lookbook Gallery for Selected Product */}
                {(() => {
                  const activeProd = products.find(p => p.product._id === selectedLookbookProduct)?.product;
                  const lbMap = activeProd?.lookbookMap
                    ? (activeProd.lookbookMap instanceof Map ? Object.fromEntries(activeProd.lookbookMap) : activeProd.lookbookMap)
                    : {};
                  const entries = Object.entries(lbMap);

                  return (
                    <div className="space-y-4 pt-4 border-t border-[#1C1C1E]">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs uppercase font-mono tracking-widest text-white font-bold">
                            Active Model Photoshoots for &ldquo;{activeProd?.name}&rdquo; ({entries.length} Assigned)
                          </span>
                          <p className="text-[10px] font-mono text-[#8E8E93] mt-0.5">
                            Click &ldquo;Set as Main Cover&rdquo; on any photo to make it the default picture in the catalog.
                          </p>
                        </div>
                      </div>

                      {entries.length === 0 ? (
                        <div className="p-8 border border-dashed border-[#2C2C2E] text-center text-xs font-mono text-zinc-500">
                          No custom model photoshoot assigned yet for this product. Use the uploader above to add one!
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                          {entries.map(([col, imgUrl]) => {
                            const isMainCover = activeProd?.image === imgUrl;
                            return (
                              <div key={col} className={`border ${isMainCover ? 'border-green-500/60 bg-green-950/10' : 'border-[#1C1C1E] bg-[#050505]'} p-4 space-y-3 relative group`}>
                                <div className="aspect-[3/4] bg-[#0A0A0C] border border-zinc-800 overflow-hidden flex items-center justify-center relative">
                                  <img src={imgUrl} alt={`${col} lookbook`} className="w-full h-full object-cover" />
                                  {isMainCover && (
                                    <span className="absolute top-2 left-2 bg-green-500 text-black text-[9px] font-mono font-bold uppercase px-2 py-0.5 shadow">
                                      Main Catalog Cover
                                    </span>
                                  )}
                                </div>
                                
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className="text-xs font-bold font-mono uppercase text-white">{col} Model Shot</div>
                                      <div className="text-[9px] text-green-400 font-mono uppercase">Live in Catalog</div>
                                    </div>
                                    <button
                                      onClick={() => handleDeleteLookbook(col)}
                                      className="p-1.5 bg-red-950/40 border border-red-800/40 text-red-400 hover:bg-red-900 hover:text-white transition"
                                      title="Remove this photoshoot"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>

                                  {!isMainCover && (
                                    <button
                                      type="button"
                                      onClick={() => handleSetPrimaryCatalogImage(imgUrl)}
                                      className="w-full bg-[#1C1C1E] hover:bg-white hover:text-black border border-[#2C2C2E] text-white text-[9px] font-mono uppercase py-1.5 transition"
                                    >
                                      ★ Set as Main Catalog Cover
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* TAB: ABANDONED CARTS RECOVERY */}
          {activeTab === 'abandoned-carts' && (
            <div className="space-y-8 animate-fade-in">
              {/* Recovery Metrics Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="border border-[#1C1C1E] bg-[#0A0A0C] p-6 space-y-2">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-[#555555]">
                    Active Abandoned Carts
                  </span>
                  <p className="text-2xl font-bold text-amber-400 font-mono">
                    {abandonedCarts.filter((c) => c.status === 'ABANDONED').length}
                  </p>
                </div>
                <div className="border border-[#1C1C1E] bg-[#0A0A0C] p-6 space-y-2">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-[#555555]">
                    Recovered Orders
                  </span>
                  <p className="text-2xl font-bold text-green-400 font-mono">
                    {abandonedCarts.filter((c) => c.status === 'RECOVERED').length}
                  </p>
                </div>
                <div className="border border-[#1C1C1E] bg-[#0A0A0C] p-6 space-y-2">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-[#555555]">
                    Potential Lost Revenue
                  </span>
                  <p className="text-2xl font-bold text-[#F9F9FB] font-mono">
                    ₹{abandonedCarts.filter((c) => c.status === 'ABANDONED').reduce((sum, c) => sum + (c.totalAmount || 0), 0)}
                  </p>
                </div>
                <div className="border border-[#1C1C1E] bg-[#0A0A0C] p-6 space-y-2">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-[#555555]">
                    Conversion / Recovery Rate
                  </span>
                  <p className="text-2xl font-bold text-indigo-400 font-mono">
                    {abandonedCarts.length > 0
                      ? Math.round(
                          (abandonedCarts.filter((c) => c.status === 'RECOVERED').length / abandonedCarts.length) * 100
                        )
                      : 0}
                    %
                  </p>
                </div>
              </div>

              {/* Table of Carts */}
              <div className="border border-[#1C1C1E] bg-[#0A0A0C] overflow-hidden rounded-sm">
                <div className="p-6 border-b border-[#1C1C1E] flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                      <Mail size={15} className="text-amber-400" /> Abandoned Checkout Sessions
                    </h3>
                    <p className="text-xs text-[#8E8E93] font-mono mt-1">
                      Customers who added streetwear items to cart and filled checkout details but dropped off before paying
                    </p>
                  </div>
                  <button
                    onClick={fetchAllData}
                    className="text-xs font-mono uppercase tracking-wider border border-[#2C2C2E] px-3 py-1.5 text-zinc-300 hover:text-white"
                  >
                    Refresh
                  </button>
                </div>

                {abandonedCarts.length === 0 ? (
                  <div className="text-center py-16 text-xs font-mono text-[#8E8E93]">
                    No abandoned checkout sessions recorded yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono text-[#8E8E93]">
                      <thead>
                        <tr className="border-b border-[#2C2C2E] text-white bg-[#0D0D10]">
                          <th className="p-4">Customer Contact</th>
                          <th className="p-4">Cart Pieces</th>
                          <th className="p-4 text-right">Bag Total</th>
                          <th className="p-4 text-center">Status</th>
                          <th className="p-4">Last Activity</th>
                          <th className="p-4 text-center">Recovery Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1C1C1E]/60">
                        {abandonedCarts.map((cart) => (
                          <tr key={cart._id} className="hover:bg-[#111114] transition">
                            <td className="p-4 space-y-0.5">
                              <div className="font-bold text-white font-sans">{cart.name || 'Shopper'}</div>
                              <div className="text-zinc-400">{cart.email}</div>
                              {cart.phone && <div className="text-[10px] text-zinc-500">+91 {cart.phone}</div>}
                            </td>

                            <td className="p-4">
                              <div className="space-y-1.5 max-w-xs">
                                {cart.items?.map((it, idx) => (
                                  <div key={idx} className="flex items-center gap-2">
                                    {it.image && (
                                      <img
                                        src={it.image}
                                        alt={it.name}
                                        className="w-7 h-8 object-cover bg-black border border-zinc-800 rounded-sm flex-shrink-0"
                                      />
                                    )}
                                    <div className="text-[11px] truncate">
                                      <span className="text-white font-sans font-medium">{it.name}</span>
                                      <span className="text-zinc-500 ml-1">({it.color} / {it.size} &bull; x{it.quantity})</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </td>

                            <td className="p-4 text-right font-bold text-white text-sm">
                              ₹{cart.totalAmount}
                            </td>

                            <td className="p-4 text-center">
                              {cart.status === 'RECOVERED' ? (
                                <span className="inline-flex items-center gap-1 bg-green-950/60 border border-green-500/30 text-green-400 text-[9px] uppercase px-2 py-0.5 rounded-sm">
                                  <Check size={10} /> Recovered
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 bg-amber-950/60 border border-amber-500/30 text-amber-300 text-[9px] uppercase px-2 py-0.5 rounded-sm">
                                  <AlertCircle size={10} /> Abandoned
                                </span>
                              )}
                            </td>

                            <td className="p-4 text-[11px] space-y-0.5">
                              <div>{new Date(cart.updatedAt || cart.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                              <div className="text-zinc-500 text-[10px]">
                                {new Date(cart.updatedAt || cart.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </td>

                            <td className="p-4 text-center">
                              {cart.status === 'RECOVERED' ? (
                                <span className="text-[10px] text-green-400 font-sans">Order Placed</span>
                              ) : (
                                <button
                                  onClick={() => handleSendRecoveryEmail(cart._id)}
                                  disabled={sendingRecoveryId === cart._id}
                                  className="inline-flex items-center gap-1.5 bg-[#1C1C1E] hover:bg-white hover:text-black border border-[#2C2C2E] text-white text-[10px] uppercase font-mono font-bold px-3 py-1.5 transition rounded-sm disabled:opacity-50"
                                >
                                  <Send size={10} />
                                  {sendingRecoveryId === cart._id
                                    ? 'Sending...'
                                    : cart.emailSent
                                    ? 'Resend Email'
                                    : 'Send Recovery Email'}
                                </button>
                              )}
                              {cart.emailSent && cart.status !== 'RECOVERED' && (
                                <p className="text-[8px] text-zinc-500 font-mono mt-1">
                                  Sent on {new Date(cart.emailSentAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                </p>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Admin Invoice Modal */}
      {selectedAdminInvoiceOrder && (
        <InvoiceModal
          order={selectedAdminInvoiceOrder}
          onClose={() => setSelectedAdminInvoiceOrder(null)}
        />
      )}
    </div>
  );
};

export default Admin;
