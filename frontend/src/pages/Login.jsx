import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  Shield,
  Lock,
  Mail,
  User,
  Phone,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Truck,
  ShoppingBag,
  Loader2,
  KeyRound,
  RefreshCw,
  Edit3
} from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, register, sendOtp, verifyOtp, user, isAdmin } = useAuth();

  const initialRole = searchParams.get('role') === 'admin' ? 'admin' : 'customer';
  const redirectUrl = searchParams.get('redirect') || (initialRole === 'admin' ? '/admin' : '/shop');

  const [authRole, setAuthRole] = useState(initialRole); // 'customer' | 'admin'
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Email OTP States
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [devOtpHint, setDevOtpHint] = useState('');

  // Auth Method: 'password' | 'otp'
  const [authMethod, setAuthMethod] = useState('password');

  // Form inputs
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });

  // If already logged in, redirect
  useEffect(() => {
    if (user) {
      if (authRole === 'admin' && isAdmin) {
        navigate('/admin', { replace: true });
      } else if (authRole === 'customer') {
        navigate(redirectUrl, { replace: true });
      }
    }
  }, [user, isAdmin, authRole, navigate, redirectUrl]);

  // Sync role when URL param changes
  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam === 'admin') {
      setAuthRole('admin');
      setIsRegistering(false);
      setOtpSent(false);
    }
  }, [searchParams]);

  // Resend Countdown Timer
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleRoleSwitch = (role) => {
    setAuthRole(role);
    setOtpSent(false);
    setOtp('');
    setDevOtpHint('');
    setErrorMessage('');
    setSuccessMessage('');
    setIsRegistering(false);
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: ''
    });
  };

  const handleTabSwitch = (registering) => {
    setIsRegistering(registering);
    setOtpSent(false);
    setOtp('');
    setDevOtpHint('');
    setErrorMessage('');
    setSuccessMessage('');
  };

  // Customer Direct Password Authentication (Login & Register)
  const handleCustomerPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (!formData.password) {
      setErrorMessage('Please enter your password.');
      return;
    }
    if (isRegistering && !formData.name.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      if (isRegistering) {
        await register(
          formData.name.trim(),
          formData.email.trim(),
          formData.password,
          formData.phone.trim()
        );
        setSuccessMessage('Account created successfully! Welcome to NABH Wear.');
      } else {
        await login(formData.email.trim(), formData.password);
        setSuccessMessage('Logged in successfully! Redirecting...');
      }
      setTimeout(() => {
        navigate(redirectUrl, { replace: true });
      }, 500);
    } catch (err) {
      setErrorMessage(err.message || (isRegistering ? 'Registration failed.' : 'Invalid email or password.'));
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Send OTP to Email
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    if (!formData.email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (isRegistering && !formData.name.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    setDevOtpHint('');

    try {
      const res = await sendOtp(
        formData.email.trim(),
        isRegistering ? 'register' : 'login',
        formData.name.trim(),
        formData.phone.trim()
      );

      if (res.isNewUser) {
        setIsRegistering(true);
      }

      setOtpSent(true);
      setCountdown(30);
      setSuccessMessage(res.message || `Verification code sent to ${formData.email.trim()}`);

      if (res.devOtp) {
        setDevOtpHint(res.devOtp);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to send verification code.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify 6-digit OTP
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    if (!otp.trim() || otp.trim().length !== 6) {
      setErrorMessage('Please enter the 6-digit verification code sent to your email.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const verifyRes = await verifyOtp(formData.email.trim(), otp.trim(), isRegistering ? 'register' : 'login');
      setSuccessMessage(
        verifyRes.isNewUser
          ? 'Welcome to NABH Wear! Account created and verified. Redirecting...'
          : 'Verified successfully! Redirecting...'
      );
      setTimeout(() => {
        navigate(redirectUrl, { replace: true });
      }, 600);
    } catch (err) {
      setErrorMessage(err.message || 'Verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  // Admin Login with Password
  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    try {
      await login(formData.email, formData.password, 'admin');
      setSuccessMessage('Admin authenticated successfully. Redirecting...');
      setTimeout(() => {
        navigate('/admin', { replace: true });
      }, 500);
    } catch (err) {
      setErrorMessage(err.message || 'Authentication failed. Please check your admin credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-block">
            <span className="text-2xl font-bold tracking-widest text-[#F9F9FB]">
              NABH WEAR
            </span>
          </Link>
          <p className="text-xs uppercase tracking-widest text-[#8E8E93] font-mono">
            {authRole === 'admin' ? 'Administrative Access Portal' : 'Member Identity & Email Access'}
          </p>
        </div>

        {/* Auth Role Selector Tabs */}
        <div className="grid grid-cols-2 p-1 bg-[#121214] border border-[#1C1C1E] rounded-none">
          <button
            type="button"
            onClick={() => handleRoleSwitch('customer')}
            className={`py-2.5 text-xs uppercase tracking-wider font-mono font-medium transition-all ${
              authRole === 'customer'
                ? 'bg-[#F9F9FB] text-[#0A0A0A] shadow font-bold'
                : 'text-[#8E8E93] hover:text-[#F9F9FB]'
            }`}
          >
            Customer Access
          </button>
          <button
            type="button"
            onClick={() => handleRoleSwitch('admin')}
            className={`py-2.5 text-xs uppercase tracking-wider font-mono font-medium flex items-center justify-center gap-1.5 transition-all ${
              authRole === 'admin'
                ? 'bg-amber-500 text-[#0A0A0A] shadow font-bold'
                : 'text-[#8E8E93] hover:text-amber-400'
            }`}
          >
            <Shield size={13} />
            Store Admin
          </button>
        </div>

        {/* Main Card */}
        <div
          className={`p-6 sm:p-8 bg-[#0D0D0E] border transition-colors ${
            authRole === 'admin' ? 'border-amber-500/30' : 'border-[#1C1C1E]'
          }`}
        >
          {/* Admin Banner Notice */}
          {authRole === 'admin' && (
            <div className="mb-6 p-3 bg-amber-950/20 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5">
              <Shield size={16} className="mt-0.5 flex-shrink-0 text-amber-400" />
              <div className="space-y-1 text-[11px] leading-relaxed">
                <span className="font-semibold uppercase tracking-wider block text-amber-200">
                  Restricted Admin Zone
                </span>
                Sign in with verified administrator credentials to access inventory, orders, and Qikink dispatch logs.
              </div>
            </div>
          )}

          {/* Customer redirect notice if attempting to track order */}
          {authRole === 'customer' && redirectUrl.includes('/track') && (
            <div className="mb-6 p-3 bg-blue-950/20 border border-blue-500/30 text-blue-300 text-xs flex items-start gap-2.5">
              <Truck size={16} className="mt-0.5 flex-shrink-0 text-blue-400" />
              <div className="space-y-1 text-[11px] leading-relaxed">
                <span className="font-semibold uppercase tracking-wider block text-blue-200">
                  Customer Sign In Required
                </span>
                Please verify your email to view and track your orders.
              </div>
            </div>
          )}

          {/* Customer redirect notice if attempting to view cart or checkout */}
          {authRole === 'customer' &&
            (redirectUrl.includes('/cart') || redirectUrl.includes('/checkout')) && (
              <div className="mb-6 p-3 bg-amber-950/20 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5">
                <ShoppingBag size={16} className="mt-0.5 flex-shrink-0 text-amber-400" />
                <div className="space-y-1 text-[11px] leading-relaxed">
                  <span className="font-semibold uppercase tracking-wider block text-amber-200">
                    Customer Sign In Required
                  </span>
                  Please sign in or create an account to access your bag and complete checkout.
                </div>
              </div>
            )}

          {/* Customer Tab: Sign In vs Create Account */}
          {authRole === 'customer' && (
            <div className="space-y-4 mb-6">
              <div className="flex border-b border-[#1C1C1E]">
                <button
                  type="button"
                  onClick={() => handleTabSwitch(false)}
                  className={`pb-3 text-xs uppercase tracking-wider font-mono font-medium border-b-2 mr-6 transition-all ${
                    !isRegistering
                      ? 'border-[#F9F9FB] text-[#F9F9FB]'
                      : 'border-transparent text-[#8E8E93] hover:text-[#F9F9FB]'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => handleTabSwitch(true)}
                  className={`pb-3 text-xs uppercase tracking-wider font-mono font-medium border-b-2 transition-all ${
                    isRegistering
                      ? 'border-[#F9F9FB] text-[#F9F9FB]'
                      : 'border-transparent text-[#8E8E93] hover:text-[#F9F9FB]'
                  }`}
                >
                  Create Account
                </button>
              </div>

              {/* Toggle Password vs OTP */}
              <div className="flex items-center justify-between text-[11px] font-mono pt-1">
                <span className="text-[#8E8E93]">
                  {authMethod === 'password' ? 'Authenticating with Password' : 'Authenticating with Email OTP'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMethod(authMethod === 'password' ? 'otp' : 'password');
                    setOtpSent(false);
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className="text-amber-400 hover:text-amber-300 underline"
                >
                  {authMethod === 'password' ? 'Switch to Email OTP ➔' : 'Switch to Password ➔'}
                </button>
              </div>
            </div>
          )}

          {/* Feedback Alerts */}
          {errorMessage && (
            <div className="mb-5 p-3.5 bg-red-950/40 border border-red-500/50 text-red-300 text-xs flex items-start gap-2.5 animate-fade-in">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5 text-red-400" />
              <span className="leading-relaxed font-mono text-[11px]">{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-5 p-3.5 bg-emerald-950/40 border border-emerald-500/50 text-emerald-300 text-xs flex items-start gap-2.5 animate-fade-in">
              <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5 text-emerald-400" />
              <span className="leading-relaxed font-mono text-[11px]">{successMessage}</span>
            </div>
          )}

          {/* ========================================================= */}
          {/* CUSTOMER AUTHENTICATION (PASSWORD MODE)                   */}
          {/* ========================================================= */}
          {authRole === 'customer' && authMethod === 'password' && (
            <form onSubmit={handleCustomerPasswordSubmit} className="space-y-4">
              {/* Full Name for Register */}
              {isRegistering && (
                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-mono text-[#8E8E93] mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8E8E93]" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Partha Protim Mondal"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-[#141416] border border-[#26262A] px-10 py-3 text-xs text-[#F9F9FB] placeholder-[#555] focus:outline-none focus:border-[#F9F9FB] transition-colors"
                    />
                  </div>
                </div>
              )}

              {/* Email Address */}
              <div>
                <label className="block text-[11px] uppercase tracking-wider font-mono text-[#8E8E93] mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8E8E93]" />
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-[#141416] border border-[#26262A] px-10 py-3 text-xs text-[#F9F9FB] placeholder-[#555] focus:outline-none focus:border-[#F9F9FB] transition-colors font-mono"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[11px] uppercase tracking-wider font-mono text-[#8E8E93] mb-1.5">
                  {isRegistering ? 'Create Password' : 'Password'}
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8E8E93]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-[#141416] border border-[#26262A] pl-10 pr-10 py-3 text-xs text-[#F9F9FB] placeholder-[#555] focus:outline-none focus:border-[#F9F9FB] transition-colors font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8E8E93] hover:text-[#F9F9FB]"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Mobile Number for Register */}
              {isRegistering && (
                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-mono text-[#8E8E93] mb-1.5">
                    Mobile Number (Optional)
                  </label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8E8E93]" />
                    <input
                      type="tel"
                      placeholder="10-digit mobile number"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-[#141416] border border-[#26262A] px-10 py-3 text-xs text-[#F9F9FB] placeholder-[#555] focus:outline-none focus:border-[#F9F9FB] transition-colors font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-6 bg-[#F9F9FB] text-[#0A0A0A] hover:bg-white text-xs uppercase tracking-widest font-mono font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={14} />
                      <span>{isRegistering ? 'Creating Account...' : 'Signing In...'}</span>
                    </>
                  ) : (
                    <>
                      <span>{isRegistering ? 'Create Account' : 'Sign In'}</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ========================================================= */}
          {/* CUSTOMER AUTHENTICATION (OTP MODE)                        */}
          {/* ========================================================= */}
          {authRole === 'customer' && authMethod === 'otp' && (
            <>
              {/* STEP 1: Enter Email (or Name + Email for register) */}
              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  {/* Full Name for Register */}
                  {isRegistering && (
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider font-mono text-[#8E8E93] mb-1.5">
                        Full Name
                      </label>
                      <div className="relative">
                        <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8E8E93]" />
                        <input
                          type="text"
                          required
                          placeholder="e.g. Partha Mondal"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full bg-[#141416] border border-[#26262A] px-10 py-3 text-xs text-[#F9F9FB] placeholder-[#555] focus:outline-none focus:border-[#F9F9FB] transition-colors"
                        />
                      </div>
                    </div>
                  )}

                  {/* Email Address */}
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider font-mono text-[#8E8E93] mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8E8E93]" />
                      <input
                        type="email"
                        required
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-[#141416] border border-[#26262A] px-10 py-3 text-xs text-[#F9F9FB] placeholder-[#555] focus:outline-none focus:border-[#F9F9FB] transition-colors font-mono"
                      />
                    </div>
                    <p className="text-[10px] text-[#8E8E93] mt-1.5 font-mono">
                      {isRegistering
                        ? 'A 6-digit verification code will be sent to activate your account.'
                        : 'Enter your email to receive a 6-digit access code.'}
                    </p>
                  </div>

                  {/* Phone for Register (Optional) */}
                  {isRegistering && (
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider font-mono text-[#8E8E93] mb-1.5">
                        Mobile Number (Optional, for SMS tracking)
                      </label>
                      <div className="relative">
                        <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8E8E93]" />
                        <input
                          type="tel"
                          placeholder="10-digit mobile number"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full bg-[#141416] border border-[#26262A] px-10 py-3 text-xs text-[#F9F9FB] placeholder-[#555] focus:outline-none focus:border-[#F9F9FB] transition-colors font-mono"
                        />
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 px-6 bg-[#F9F9FB] text-[#0A0A0A] hover:bg-white text-xs uppercase tracking-widest font-mono font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="animate-spin" size={14} />
                          <span>Sending Verification Code...</span>
                        </>
                      ) : (
                        <>
                          <span>
                            {isRegistering
                              ? 'Send Verification Code'
                              : 'Send One-Time Password'}
                          </span>
                          <ArrowRight size={14} />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                /* STEP 2: Enter 6-Digit OTP */
                <form onSubmit={handleVerifyOtp} className="space-y-5 animate-fade-in">
                  <div className="bg-[#141416] border border-[#222226] p-4 text-center space-y-2">
                    <div className="inline-flex p-2.5 bg-white/5 border border-white/10 rounded-full text-[#F9F9FB]">
                      <KeyRound size={20} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold uppercase tracking-wider text-white">
                        Enter 6-Digit Code
                      </p>
                      <p className="text-[11px] text-[#8E8E93] font-mono leading-relaxed">
                        Sent to <span className="text-[#F9F9FB] font-semibold">{formData.email}</span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setOtpSent(false);
                        setOtp('');
                        setErrorMessage('');
                        setSuccessMessage('');
                      }}
                      className="inline-flex items-center gap-1 text-[10px] uppercase font-mono text-[#8E8E93] hover:text-white underline pt-1"
                    >
                      <Edit3 size={11} /> Change Email
                    </button>
                  </div>

                  {/* OTP Input */}
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider font-mono text-[#8E8E93] mb-1.5 text-center">
                      6-Digit Verification Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      autoFocus
                      required
                      placeholder="••••••"
                      value={otp}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setOtp(val);
                      }}
                      className="w-full bg-[#141416] border border-[#26262A] py-3.5 text-center text-xl font-bold font-mono tracking-[12px] text-[#F9F9FB] placeholder-[#444] focus:outline-none focus:border-[#F9F9FB] transition-colors"
                    />
                  </div>

                  {/* Dev Sandbox Helper Button (Only visible if devOtp exists) */}
                  {devOtpHint && (
                    <div className="p-2.5 bg-amber-950/30 border border-amber-500/30 text-center space-y-1.5">
                      <p className="text-[10px] font-mono text-amber-300">
                        Sandbox Mode: Code logged to terminal &bull; <span className="font-bold">{devOtpHint}</span>
                      </p>
                      <button
                        type="button"
                        onClick={() => setOtp(devOtpHint)}
                        className="text-[10px] font-mono text-amber-200 underline hover:text-white"
                      >
                        Auto-fill OTP
                      </button>
                    </div>
                  )}

                  {/* Verify Button */}
                  <div>
                    <button
                      type="submit"
                      disabled={loading || otp.length !== 6}
                      className="w-full py-3.5 px-6 bg-[#F9F9FB] text-[#0A0A0A] hover:bg-white text-xs uppercase tracking-widest font-mono font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="animate-spin" size={14} />
                          <span>Verifying Code...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={15} />
                          <span>
                            {isRegistering
                              ? 'Verify & Create Account'
                              : 'Verify & Sign In'}
                          </span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Resend Link */}
                  <div className="text-center pt-2">
                    {countdown > 0 ? (
                      <p className="text-[11px] font-mono text-[#666]">
                        Resend code in <span className="text-white font-semibold">{countdown}s</span>
                      </p>
                    ) : (
                      <button
                        type="button"
                        disabled={loading}
                        onClick={handleSendOtp}
                        className="text-[11px] font-mono uppercase tracking-wider text-[#8E8E93] hover:text-white inline-flex items-center gap-1.5 underline"
                      >
                        <RefreshCw size={12} /> Resend Verification Code
                      </button>
                    )}
                  </div>
                </form>
              )}
            </>
          )}

          {/* ========================================================= */}
          {/* ADMIN AUTHENTICATION FORM                                 */}
          {/* ========================================================= */}
          {authRole === 'admin' && (
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              {/* Admin Email */}
              <div>
                <label className="block text-[11px] uppercase tracking-wider font-mono text-[#8E8E93] mb-1.5">
                  Admin Email
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8E8E93]" />
                  <input
                    type="email"
                    required
                    placeholder="admin@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-[#141416] border border-[#26262A] px-10 py-3 text-xs text-[#F9F9FB] placeholder-[#555] focus:outline-none focus:border-[#F9F9FB] transition-colors font-mono"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[11px] uppercase tracking-wider font-mono text-[#8E8E93] mb-1.5">
                  Admin Password
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8E8E93]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-[#141416] border border-[#26262A] pl-10 pr-10 py-3 text-xs text-[#F9F9FB] placeholder-[#555] focus:outline-none focus:border-[#F9F9FB] transition-colors font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8E8E93] hover:text-[#F9F9FB]"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-6 bg-amber-500 text-[#0A0A0A] hover:bg-amber-400 text-xs uppercase tracking-widest font-mono font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <span className="inline-block animate-pulse">Authenticating Admin...</span>
                  ) : (
                    <>
                      <span>Unlock Admin Panel</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Customer guest navigation links */}
        <div className="text-center space-y-2">
          <p className="text-xs text-[#8E8E93]">Looking to shop or track an order directly?</p>
          <div className="flex items-center justify-center space-x-4 text-xs font-mono">
            <Link to="/shop" className="text-[#F9F9FB] hover:underline uppercase tracking-wider">
              Browse Shop &rarr;
            </Link>
            <span className="text-[#333]">&bull;</span>
            <Link
              to="/track"
              className="text-[#8E8E93] hover:text-[#F9F9FB] hover:underline uppercase tracking-wider"
            >
              Track an Order &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
