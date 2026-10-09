import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ShieldCheck, FileText, RefreshCw, Truck, Mail, Phone, MapPin, CheckCircle2, ChevronRight } from 'lucide-react';

const Policies = () => {
  const location = useLocation();

  // Determine initial active tab based on current URL path
  const getTabFromPath = (pathname) => {
    if (pathname.includes('privacy')) return 'privacy';
    if (pathname.includes('refund') || pathname.includes('return') || pathname.includes('cancellation')) return 'refund';
    if (pathname.includes('shipping') || pathname.includes('delivery')) return 'shipping';
    if (pathname.includes('contact')) return 'contact';
    return 'terms';
  };

  const [activeTab, setActiveTab] = useState(getTabFromPath(location.pathname));

  useEffect(() => {
    setActiveTab(getTabFromPath(location.pathname));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  const tabs = [
    { id: 'terms', label: 'Terms of Service', icon: FileText, path: '/terms' },
    { id: 'privacy', label: 'Privacy Policy', icon: ShieldCheck, path: '/privacy-policy' },
    { id: 'refund', label: 'Refund & Cancellation', icon: RefreshCw, path: '/refund-policy' },
    { id: 'shipping', label: 'Shipping & Delivery', icon: Truck, path: '/shipping-policy' },
    { id: 'contact', label: 'Contact & Support', icon: Mail, path: '/contact' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in text-[#F9F9FB]">
      {/* Header */}
      <div className="border-b border-[#1C1C1E] pb-8 mb-10">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#8E8E93] mb-3">
          <Link to="/" className="hover:text-white transition">Home</Link>
          <ChevronRight size={12} />
          <span>Legal & Store Policies</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-widest">Store Policies &amp; Compliance</h1>
        <p className="text-xs text-[#8E8E93] mt-2 font-mono uppercase">
          NABH WEAR &bull; Transparent, secure &amp; customer-first streetwear
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Navigation Sidebar */}
        <aside className="lg:col-span-1 bg-[#0A0A0C] border border-[#1C1C1E] p-4 space-y-1 rounded-sm sticky top-28">
          <div className="text-[10px] font-mono uppercase tracking-widest text-[#555555] px-3 py-2 border-b border-[#1C1C1E] mb-2">
            Policy Navigation
          </div>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <Link
                key={tab.id}
                to={tab.path}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 w-full px-3 py-3 text-xs font-mono uppercase tracking-wider transition rounded-sm ${
                  isActive
                    ? 'bg-white text-black font-bold shadow-md'
                    : 'text-[#8E8E93] hover:text-white hover:bg-[#141416]'
                }`}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </Link>
            );
          })}

          <div className="mt-6 pt-4 border-t border-[#1C1C1E] px-3 text-[11px] text-[#555555] font-mono space-y-1">
            <div>Owner: Partha Protim Mondal</div>
            <div>Support: 24/7 Response</div>
            <div className="text-emerald-500 flex items-center gap-1 mt-2">
              <CheckCircle2 size={12} /> Razorpay Verified
            </div>
          </div>
        </aside>

        {/* Policy Content Viewer */}
        <main className="lg:col-span-3 bg-[#0A0A0C] border border-[#1C1C1E] p-6 sm:p-10 space-y-8 rounded-sm">
          {/* TERMS & CONDITIONS */}
          {activeTab === 'terms' && (
            <div className="space-y-6 text-xs text-[#A1A1AA] leading-relaxed">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#8E8E93] bg-[#141416] px-2 py-1 border border-[#2C2C2E]">
                  Last Updated: September 2026
                </span>
                <h2 className="text-2xl font-bold uppercase tracking-wider text-white mt-4">Terms of Service</h2>
              </div>

              <p>
                Welcome to <strong>NABH Wear</strong> (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;), operated by Partha Protim Mondal. 
                By accessing or purchasing from our website, you agree to be bound by the following terms and conditions.
              </p>

              <div className="space-y-4 pt-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">1. General Conditions</h3>
                <p>
                  We reserve the right to refuse service to anyone for any reason at any time. You understand that your content 
                  (not including credit card or sensitive payment information) may be transferred unencrypted over various networks. 
                  Payment information is always encrypted across industry-standard TLS/SSL protocols.
                </p>

                <h3 className="text-sm font-bold uppercase tracking-wider text-white">2. Accuracy of Product Information &amp; Pricing</h3>
                <p>
                  All descriptions of products, garment specifications (e.g. 240 GSM French Terry Cotton, oversized drop-shoulder fits), 
                  and product pricing are subject to change at any time without notice. Prices for our products are quoted in 
                  <strong> Indian National Rupees (INR ₹)</strong> inclusive of applicable GST unless explicitly stated otherwise.
                </p>

                <h3 className="text-sm font-bold uppercase tracking-wider text-white">3. Orders and Billing Verification</h3>
                <p>
                  We reserve the right to refuse or cancel any order you place with us. In the event that we make a change to or 
                  cancel an order, we will attempt to notify you by contacting the email and/or billing address/phone number provided 
                  at the time the order was made.
                </p>

                <h3 className="text-sm font-bold uppercase tracking-wider text-white">4. Intellectual Property</h3>
                <p>
                  All graphic designs, typography, brand marks, logos, and custom lookbook photography featured on NABH Wear are 
                  the proprietary property of NABH Wear. Unauthorized reproduction, resale, or commercial use is strictly prohibited.
                </p>

                <h3 className="text-sm font-bold uppercase tracking-wider text-white">5. Governing Law &amp; Jurisdiction</h3>
                <p>
                  These Terms of Service and any separate agreements whereby we provide you services shall be governed by and 
                  construed in accordance with the laws of India, under the jurisdiction of West Bengal.
                </p>
              </div>
            </div>
          )}

          {/* PRIVACY POLICY */}
          {activeTab === 'privacy' && (
            <div className="space-y-6 text-xs text-[#A1A1AA] leading-relaxed">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#8E8E93] bg-[#141416] px-2 py-1 border border-[#2C2C2E]">
                  Compliant with IT Act 2000 &amp; RBI Payment Directives
                </span>
                <h2 className="text-2xl font-bold uppercase tracking-wider text-white mt-4">Privacy Policy</h2>
              </div>

              <p>
                At <strong>NABH Wear</strong>, protecting our customers' personal data is paramount. This Privacy Policy details how we 
                collect, use, and protect your information when you visit or make a purchase from our store.
              </p>

              <div className="space-y-4 pt-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">1. Personal Information We Collect</h3>
                <p>
                  When you visit or make a purchase from our store, we collect device information (browser version, IP address, 
                  cookies) and order details including:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-2 text-zinc-300">
                  <li>Customer full name and delivery address</li>
                  <li>Email address and verified 10-digit mobile contact number</li>
                  <li>Cart item choices, sizes, and shipping preferences</li>
                </ul>

                <h3 className="text-sm font-bold uppercase tracking-wider text-white">2. 100% Secure Payment Processing</h3>
                <p>
                  <strong>We do not store your credit/debit card numbers, UPI PINs, or bank account credentials on our servers.</strong> 
                  All digital transactions are processed directly via <strong>Razorpay Payment Gateway</strong>, which adheres to strict 
                  <strong> PCI-DSS Level 1 certification</strong> and RBI security guidelines with 256-bit SSL encryption.
                </p>

                <h3 className="text-sm font-bold uppercase tracking-wider text-white">3. How We Use Your Data</h3>
                <p>
                  Your information is utilized exclusively to:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-2 text-zinc-300">
                  <li>Fulfill and deliver your orders via our trusted courier partners (Shiprocket, Qikink)</li>
                  <li>Send transactional order confirmation emails, invoices, and dispatch SMS alerts</li>
                  <li>Prevent fraudulent transactions and secure customer member accounts</li>
                </ul>

                <h3 className="text-sm font-bold uppercase tracking-wider text-white">4. Non-Disclosure &amp; Security</h3>
                <p>
                  NABH Wear will never sell, rent, or trade your personal information with third-party advertising brokers. 
                  Data is only shared with verified operational providers (e.g. logistics couriers and payment gateways) necessary 
                  to execute your order.
                </p>
              </div>
            </div>
          )}

          {/* REFUND & CANCELLATION */}
          {activeTab === 'refund' && (
            <div className="space-y-6 text-xs text-[#A1A1AA] leading-relaxed">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#8E8E93] bg-[#141416] px-2 py-1 border border-[#2C2C2E]">
                  Customer Guarantee &bull; 7-Day Window
                </span>
                <h2 className="text-2xl font-bold uppercase tracking-wider text-white mt-4">Cancellation &amp; Refund Policy</h2>
              </div>

              <p>
                We stand behind the craftsmanship of every NABH Wear drop. If you receive an imperfect piece, we make returns 
                and replacements straightforward.
              </p>

              <div className="space-y-4 pt-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">1. Order Cancellations</h3>
                <p>
                  You can request an order cancellation within <strong>12 hours</strong> of placing your order or before the garment 
                  has been sent to printing and production. Once printed or dispatched, orders cannot be cancelled mid-transit. 
                  To cancel, email us at <a href="mailto:mondalpartha6561@gmail.com" className="text-white underline">mondalpartha6561@gmail.com</a> with your Order ID.
                </p>

                <h3 className="text-sm font-bold uppercase tracking-wider text-white">2. 7-Day Replacement / Return Eligibility</h3>
                <p>
                  We offer a replacement or full refund within <strong>7 days</strong> of delivery under the following circumstances:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-2 text-zinc-300">
                  <li>The product arrived physically damaged or with manufacturing/stitching defects.</li>
                  <li>There is a noticeable misprint or color variance from the ordered graphic.</li>
                  <li>An incorrect size or wrong SKU was delivered compared to your invoice.</li>
                </ul>
                <p className="mt-2 text-zinc-400">
                  <em>Note: Items must be unused, unwashed, and retained with original packaging and tags.</em>
                </p>

                <h3 className="text-sm font-bold uppercase tracking-wider text-white">3. Refund Processing Timelines</h3>
                <p>
                  Once your return is inspected and approved:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-2 text-zinc-300">
                  <li><strong>Prepaid Orders (UPI/Cards/NetBanking):</strong> Refunds are credited back directly to the original payment source within <strong>5 to 7 business days</strong> via Razorpay.</li>
                  <li><strong>Cash on Delivery (COD) Orders:</strong> Refunds are transferred directly to your verified bank account via NEFT/UPI within 3 to 5 business days upon providing bank details.</li>
                </ul>
              </div>
            </div>
          )}

          {/* SHIPPING & DELIVERY */}
          {activeTab === 'shipping' && (
            <div className="space-y-6 text-xs text-[#A1A1AA] leading-relaxed">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#8E8E93] bg-[#141416] px-2 py-1 border border-[#2C2C2E]">
                  Nationwide Dispatch &bull; Fast Delivery
                </span>
                <h2 className="text-2xl font-bold uppercase tracking-wider text-white mt-4">Shipping &amp; Delivery Policy</h2>
              </div>

              <p>
                All NABH Wear apparel pieces are produced on-demand using premium 240 GSM heavy-weight cotton and dispatched 
                across all pin codes in India.
              </p>

              <div className="space-y-4 pt-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">1. Delivery Timeline (0–7 Business Days)</h3>
                <ul className="list-disc list-inside space-y-1.5 pl-2 text-zinc-300">
                  <li><strong>Order Processing &amp; Printing:</strong> 1 to 2 business days.</li>
                  <li><strong>Transit &amp; Delivery:</strong> 2 to 5 business days depending on location.</li>
                  <li><strong>Metro Cities (Mumbai, Delhi, Bengaluru, Kolkata, etc.):</strong> Typically delivered within 3–4 days.</li>
                  <li><strong>Rest of India:</strong> Typically delivered within 5–7 days.</li>
                </ul>

                <h3 className="text-sm font-bold uppercase tracking-wider text-white">2. Shipping Charges</h3>
                <p>
                  We are pleased to offer <strong>FREE Standard Shipping</strong> on all prepaid orders nationwide! 
                  No hidden surcharge or delivery fees at checkout.
                </p>

                <h3 className="text-sm font-bold uppercase tracking-wider text-white">3. Real-Time Order Tracking</h3>
                <p>
                  As soon as your drop is dispatched, you will receive an SMS and email notification with your 
                  <strong> AWB Tracking Number</strong> and courier partner name (Shiprocket, Bluedart, Delhivery, Ekart). 
                  You can track your package in real-time anytime at <Link to="/track" className="text-white underline font-mono">/track</Link>.
                </p>

                <h3 className="text-sm font-bold uppercase tracking-wider text-white">4. Damaged Packaging in Transit</h3>
                <p>
                  If you notice the outer packaging is visibly tampered with or opened at the time of delivery, 
                  please refuse the package or record an unboxing video and immediately contact our support team.
                </p>
              </div>
            </div>
          )}

          {/* CONTACT & SUPPORT */}
          {activeTab === 'contact' && (
            <div className="space-y-6 text-xs text-[#A1A1AA] leading-relaxed">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#8E8E93] bg-[#141416] px-2 py-1 border border-[#2C2C2E]">
                  Official Merchant Identity &bull; Response within 24h
                </span>
                <h2 className="text-2xl font-bold uppercase tracking-wider text-white mt-4">Contact &amp; Customer Support</h2>
              </div>

              <p>
                Have questions regarding your order, drops, or wholesale inquiries? Reach out directly to the NABH Wear team.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="bg-[#050505] border border-[#1C1C1E] p-5 space-y-2 rounded-sm">
                  <div className="flex items-center gap-2 text-white font-bold font-mono text-xs uppercase">
                    <Mail size={16} className="text-white" /> Email Support
                  </div>
                  <p className="text-[#8E8E93] text-[11px]">Direct queries &amp; order assistance:</p>
                  <a href="mailto:mondalpartha6561@gmail.com" className="text-white font-mono block hover:underline text-xs">
                    mondalpartha6561@gmail.com
                  </a>
                </div>

                <div className="bg-[#050505] border border-[#1C1C1E] p-5 space-y-2 rounded-sm">
                  <div className="flex items-center gap-2 text-white font-bold font-mono text-xs uppercase">
                    <Phone size={16} className="text-white" /> Direct Helpline
                  </div>
                  <p className="text-[#8E8E93] text-[11px]">Available Mon - Sat (10 AM - 7 PM IST):</p>
                  <a href="tel:+918240966477" className="text-white font-mono block hover:underline text-xs">
                    +91 8240 966477
                  </a>
                </div>

                <div className="bg-[#050505] border border-[#1C1C1E] p-5 space-y-2 rounded-sm sm:col-span-2">
                  <div className="flex items-center gap-2 text-white font-bold font-mono text-xs uppercase">
                    <MapPin size={16} className="text-white" /> Operating Address &amp; Business Entity
                  </div>
                  <div className="text-[#A1A1AA] text-xs space-y-1 font-mono">
                    <div className="text-white font-bold">NABH WEAR (Proprietor: Partha Protim Mondal)</div>
                    <div>West Bengal, India &bull; PIN Code: 700001</div>
                    <div className="text-[#8E8E93] text-[11px]">Merchant Category: Apparel &amp; Lifestyle Retail</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Policies;
