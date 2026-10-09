import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userOrders, setUserOrders] = useState([]);
  const [token, setToken] = useState(localStorage.getItem('nabh_auth_token') || null);
  const [loading, setLoading] = useState(true);

  // Fetch current user details on mount if token exists
  useEffect(() => {
    const fetchMe = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setUserOrders(data.orders || []);
        } else {
          // Token invalid or expired
          logout();
        }
      } catch (err) {
        console.error('Error fetching auth user:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMe();
  }, [token]);

  // Login function
  const login = async (email, password, requiredRole = null) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, requiredRole })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Login failed');
      }

      localStorage.setItem('nabh_auth_token', data.token);
      setToken(data.token);
      setUser(data.user);
      return data;
    } catch (error) {
      throw error;
    }
  };

  // Register function
  const register = async (name, email, password, phone) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, phone })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      localStorage.setItem('nabh_auth_token', data.token);
      setToken(data.token);
      setUser(data.user);
      return data;
    } catch (error) {
      throw error;
    }
  };

  // Google Auth function
  const googleLogin = async (googleData) => {
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(googleData)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Google sign-in failed');
      }

      localStorage.setItem('nabh_auth_token', data.token);
      setToken(data.token);
      setUser(data.user);
      return data;
    } catch (error) {
      throw error;
    }
  };

  // Send OTP
  const sendOtp = async (email, purpose = 'login', name = '', phone = '') => {
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, purpose, name, phone })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to send verification code');
      }

      return data;
    } catch (error) {
      throw error;
    }
  };

  // Verify OTP & Login/Register
  const verifyOtp = async (email, otp, purpose = 'login') => {
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, purpose })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Verification failed');
      }

      localStorage.setItem('nabh_auth_token', data.token);
      setToken(data.token);
      setUser(data.user);
      return data;
    } catch (error) {
      throw error;
    }
  };

  // Refresh user data & orders
  const refreshUserData = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setUserOrders(data.orders || []);
        return data;
      }
    } catch (err) {
      console.error('Error refreshing user data:', err);
    }
  };

  // Update profile (name, phone)
  const updateProfile = async (name, phone) => {
    if (!token) throw new Error('Not authenticated');
    const res = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ name, phone })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update profile');
    setUser(data.user);
    return data;
  };

  // Add Address
  const addAddress = async (addressData) => {
    if (!token) throw new Error('Not authenticated');
    const res = await fetch('/api/auth/address', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(addressData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to add address');
    setUser((prev) => ({ ...prev, addresses: data.addresses }));
    return data;
  };

  // Update Address
  const updateAddress = async (addressId, addressData) => {
    if (!token) throw new Error('Not authenticated');
    const res = await fetch(`/api/auth/address/${addressId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(addressData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update address');
    setUser((prev) => ({ ...prev, addresses: data.addresses }));
    return data;
  };

  // Delete Address
  const deleteAddress = async (addressId) => {
    if (!token) throw new Error('Not authenticated');
    const res = await fetch(`/api/auth/address/${addressId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to delete address');
    setUser((prev) => ({ ...prev, addresses: data.addresses }));
    return data;
  };

  // Set Default Address
  const setDefaultAddress = async (addressId) => {
    if (!token) throw new Error('Not authenticated');
    const res = await fetch(`/api/auth/address/${addressId}/default`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to set default address');
    setUser((prev) => ({ ...prev, addresses: data.addresses }));
    return data;
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('nabh_auth_token');
    setToken(null);
    setUser(null);
    setUserOrders([]);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        userOrders,
        token,
        loading,
        isAdmin,
        login,
        register,
        googleLogin,
        sendOtp,
        verifyOtp,
        refreshUserData,
        updateProfile,
        addAddress,
        updateAddress,
        deleteAddress,
        setDefaultAddress,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
