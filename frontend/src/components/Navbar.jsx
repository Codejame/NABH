import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBag, Menu, X, Shield, Heart, Truck, User, LogOut, ChevronDown } from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { useWishlist } from '../context/WishlistContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const Navbar = () => {
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const { user, isAdmin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isActive = (path) => location.pathname === path;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setUserDropdownOpen(false);
    navigate('/login');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A]/85 backdrop-blur-md border-b border-[#1C1C1E]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="text-xl font-bold tracking-widest text-[#F9F9FB]">
              NABH WEAR
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-8 items-center">
            <Link
              to="/"
              className={`text-xs uppercase tracking-street transition-colors duration-200 ${
                isActive('/') ? 'text-[#F9F9FB] font-semibold' : 'text-[#8E8E93] hover:text-[#F9F9FB]'
              }`}
            >
              Home
            </Link>
            <Link
              to="/shop"
              className={`text-xs uppercase tracking-street transition-colors duration-200 ${
                isActive('/shop') ? 'text-[#F9F9FB] font-semibold' : 'text-[#8E8E93] hover:text-[#F9F9FB]'
              }`}
            >
              Shop
            </Link>
            <Link
              to="/lookbook"
              className={`text-xs uppercase tracking-street transition-colors duration-200 ${
                isActive('/lookbook') ? 'text-[#F9F9FB] font-semibold' : 'text-[#8E8E93] hover:text-[#F9F9FB]'
              }`}
            >
              Lookbook
            </Link>
            {/* Track Order shown ONLY when customer is logged in */}
            {user && (
              <Link
                to="/track"
                className={`text-xs uppercase tracking-street flex items-center gap-1.5 transition-colors duration-200 ${
                  isActive('/track') ? 'text-[#F9F9FB] font-semibold' : 'text-[#8E8E93] hover:text-[#F9F9FB]'
                }`}
              >
                <Truck size={14} /> Track Order
              </Link>
            )}

            {/* Admin link shown ONLY to authenticated Admins */}
            {isAdmin && (
              <Link
                to="/admin"
                className={`text-xs uppercase tracking-street flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 transition-all font-mono`}
              >
                <Shield size={13} className="text-amber-400" />
                <span>Admin</span>
              </Link>
            )}
          </div>

          {/* Wishlist & Cart & User Controls */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Wishlist Icon */}
            <Link
              to="/wishlist"
              className="relative p-2 text-[#8E8E93] hover:text-[#F9F9FB] transition-colors"
              title="View Saved Wishlist"
            >
              <Heart size={19} strokeWidth={1.5} className={wishlistCount > 0 ? 'text-red-400' : ''} />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center font-mono shadow">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart Icon */}
            <Link
              to="/cart"
              className="relative p-2 text-[#8E8E93] hover:text-[#F9F9FB] transition-colors"
              title="Shopping Bag"
            >
              <ShoppingBag size={19} strokeWidth={1.5} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#F9F9FB] text-[#0A0A0A] text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center font-mono">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* User Account / Sign In Dropdown */}
            <div className="relative hidden md:block" ref={dropdownRef}>
              {user ? (
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#141416] border border-[#26262A] text-xs text-[#F9F9FB] hover:border-[#444] transition-all font-mono"
                >
                  <User size={13} className={isAdmin ? 'text-amber-400' : 'text-[#8E8E93]'} />
                  <span className="max-w-[100px] truncate">{user.name.split(' ')[0]}</span>
                  <ChevronDown size={12} className="text-[#8E8E93]" />
                </button>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-[#26262A] text-xs uppercase tracking-wider text-[#8E8E93] hover:text-[#F9F9FB] hover:border-[#F9F9FB] transition-all font-mono"
                >
                  <User size={13} />
                  <span>Sign In</span>
                </Link>
              )}

              {/* Dropdown Menu */}
              {user && userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-[#0D0D0E] border border-[#1C1C1E] shadow-2xl py-2 z-50 animate-fade-in">
                  <div className="px-4 py-2 border-b border-[#1C1C1E] space-y-0.5">
                    <p className="text-xs font-bold text-[#F9F9FB] truncate">{user.name}</p>
                    <p className="text-[10px] text-[#8E8E93] truncate font-mono">{user.email}</p>
                    <span className={`inline-block text-[9px] uppercase px-1.5 py-0.5 mt-1 font-mono tracking-wider font-semibold rounded ${
                      isAdmin ? 'bg-amber-500/20 text-amber-300' : 'bg-[#222] text-[#AAA]'
                    }`}>
                      {isAdmin ? 'Store Admin' : 'Customer Member'}
                    </span>
                  </div>

                  <div className="py-1">
                    <Link
                      to="/profile"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs text-[#8E8E93] hover:text-[#F9F9FB] hover:bg-[#161618] transition-colors"
                    >
                      <User size={14} /> My Profile & Orders
                    </Link>

                    <Link
                      to="/track"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs text-[#8E8E93] hover:text-[#F9F9FB] hover:bg-[#161618] transition-colors"
                    >
                      <Truck size={14} /> Live Tracking
                    </Link>

                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs text-amber-300 hover:bg-amber-950/30 transition-colors"
                      >
                        <Shield size={14} /> Admin Dashboard
                      </Link>
                    )}
                  </div>

                  <div className="pt-1 border-t border-[#1C1C1E]">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full text-left flex items-center gap-2 px-4 py-2 text-xs text-red-400 hover:bg-red-950/20 transition-colors"
                    >
                      <LogOut size={14} /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-[#8E8E93] hover:text-[#F9F9FB] transition-colors"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0A0A0A] border-b border-[#1C1C1E] py-4 px-4 space-y-3 animate-fade-in">
          {/* User status in mobile */}
          {user ? (
            <div className="p-3 bg-[#121214] border border-[#1C1C1E] mb-2 space-y-1">
              <p className="text-xs font-bold text-[#F9F9FB]">{user.name}</p>
              <p className="text-[10px] text-[#8E8E93] font-mono">{user.email}</p>
              <span className={`inline-block text-[9px] uppercase px-1.5 py-0.5 font-mono ${
                isAdmin ? 'text-amber-300 bg-amber-950/50' : 'text-[#888] bg-[#222]'
              }`}>
                {isAdmin ? 'Store Admin' : 'Customer'}
              </span>
            </div>
          ) : (
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="block w-full text-center py-2.5 bg-[#F9F9FB] text-[#0A0A0A] text-xs uppercase font-mono font-bold tracking-wider mb-2"
            >
              Sign In / Register
            </Link>
          )}

          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className={`block text-xs uppercase tracking-street py-2 ${
              isActive('/') ? 'text-[#F9F9FB] font-semibold' : 'text-[#8E8E93]'
            }`}
          >
            Home
          </Link>
          <Link
            to="/shop"
            onClick={() => setMobileMenuOpen(false)}
            className={`block text-xs uppercase tracking-street py-2 ${
              isActive('/shop') ? 'text-[#F9F9FB] font-semibold' : 'text-[#8E8E93]'
            }`}
          >
            Shop
          </Link>
          <Link
            to="/lookbook"
            onClick={() => setMobileMenuOpen(false)}
            className={`block text-xs uppercase tracking-street py-2 ${
              isActive('/lookbook') ? 'text-[#F9F9FB] font-semibold' : 'text-[#8E8E93]'
            }`}
          >
            Lookbook
          </Link>
          {user && (
            <Link
              to="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className={`block text-xs uppercase tracking-street py-2 flex items-center gap-2 ${
                isActive('/profile') ? 'text-[#F9F9FB] font-semibold' : 'text-[#8E8E93]'
              }`}
            >
              <User size={14} /> My Profile & Orders
            </Link>
          )}
          {/* Track Order in mobile shown ONLY when customer is logged in */}
          {user && (
            <Link
              to="/track"
              onClick={() => setMobileMenuOpen(false)}
              className={`block text-xs uppercase tracking-street py-2 flex items-center gap-2 ${
                isActive('/track') ? 'text-[#F9F9FB] font-semibold' : 'text-[#8E8E93]'
              }`}
            >
              <Truck size={14} /> Track Order
            </Link>
          )}
          <Link
            to="/wishlist"
            onClick={() => setMobileMenuOpen(false)}
            className={`block text-xs uppercase tracking-street py-2 flex items-center gap-2 ${
              isActive('/wishlist') ? 'text-[#F9F9FB] font-semibold' : 'text-[#8E8E93]'
            }`}
          >
            <Heart size={14} /> Wishlist ({wishlistCount})
          </Link>

          {/* Admin link shown only if user is admin */}
          {isAdmin && (
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-xs uppercase tracking-street py-2 flex items-center gap-1.5 text-amber-300 font-semibold"
            >
              <Shield size={14} /> Admin Dashboard
            </Link>
          )}

          {user && (
            <button
              onClick={() => { logout(); setMobileMenuOpen(false); }}
              className="block w-full text-left text-xs uppercase tracking-street py-2 flex items-center gap-2 text-red-400 pt-2 border-t border-[#1C1C1E]"
            >
              <LogOut size={14} /> Sign Out
            </button>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
