import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-[#050505] border-t border-[#1C1C1E] py-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Info */}
          <div className="sm:col-span-2 space-y-4">
            <h3 className="text-sm font-bold tracking-widest text-[#F9F9FB]">NABH WEAR</h3>
            <p className="text-xs text-[#8E8E93] leading-relaxed max-w-sm">
              Wear Your Identity. Premium 240 GSM heavy-weight streetwear designed and printed in India for the modern individualist.
            </p>
            <div className="pt-2 text-[11px] font-mono text-[#555555] space-y-0.5">
              <div>Proprietor: Partha Protim Mondal</div>
              <div>West Bengal, India &bull; PIN: 700001</div>
            </div>
            <p className="text-[10px] text-[#555555] pt-2">
              &copy; {new Date().getFullYear()} NABH Wear. All rights reserved.
            </p>
          </div>

          {/* Customer Care */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-widest text-[#F9F9FB] font-semibold">Customer Care</h4>
            <ul className="space-y-2 text-xs text-[#8E8E93]">
              <li>
                <Link to="/shop" className="hover:text-[#F9F9FB] transition-colors">All Streetwear Drops</Link>
              </li>
              <li>
                <Link to="/lookbook" className="hover:text-[#F9F9FB] transition-colors">Community Lookbook</Link>
              </li>
              <li>
                <Link to="/track" className="hover:text-[#F9F9FB] transition-colors">Track Your Order</Link>
              </li>
              <li>
                <Link to="/wishlist" className="hover:text-[#F9F9FB] transition-colors">Saved Wishlist</Link>
              </li>
              <li>
                <Link to="/profile" className="hover:text-[#F9F9FB] transition-colors">My Profile &amp; Invoices</Link>
              </li>
            </ul>
          </div>

          {/* Legal & Policies (Razorpay Mandatory) */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-widest text-[#F9F9FB] font-semibold">Store Policies</h4>
            <ul className="space-y-2 text-xs text-[#8E8E93]">
              <li>
                <Link to="/terms" className="hover:text-[#F9F9FB] transition-colors">Terms of Service</Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="hover:text-[#F9F9FB] transition-colors">Privacy Policy</Link>
              </li>
              <li>
                <Link to="/refund-policy" className="hover:text-[#F9F9FB] transition-colors">Refund &amp; Cancellation</Link>
              </li>
              <li>
                <Link to="/shipping-policy" className="hover:text-[#F9F9FB] transition-colors">Shipping &amp; Delivery</Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-[#F9F9FB] transition-colors">Contact Us</Link>
              </li>
            </ul>
          </div>

          {/* Socials & Help */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-widest text-[#F9F9FB] font-semibold">Connect</h4>
            <ul className="space-y-2 text-xs text-[#8E8E93]">
              <li>
                <a
                  href="https://www.instagram.com/nabh.wear/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#F9F9FB] transition-colors flex items-center gap-2"
                >
                  <Instagram size={14} />
                  <span>Instagram</span>
                </a>
              </li>
              <li>
                <a
                  href="mailto:mondalpartha6561@gmail.com"
                  className="hover:text-[#F9F9FB] transition-colors flex items-center gap-2"
                >
                  <Mail size={14} />
                  <span>Email Support</span>
                </a>
              </li>
              <li>
                <Link to="/contact" className="hover:text-[#F9F9FB] transition-colors flex items-center gap-2">
                  <span className="text-emerald-400">&bull;</span>
                  <span>Helpline &amp; Address</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
