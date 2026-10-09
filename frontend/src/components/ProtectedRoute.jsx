import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="animate-spin text-[#8E8E93]" size={32} />
        <p className="text-xs font-mono uppercase tracking-widest text-[#8E8E93]">
          Authenticating access...
        </p>
      </div>
    );
  }

  // If route requires admin role and user is not admin
  if (adminOnly) {
    if (!user || !isAdmin) {
      return (
        <Navigate
          to={`/login?role=admin&redirect=${encodeURIComponent(location.pathname)}`}
          replace
        />
      );
    }
  } else if (!user) {
    // Normal authenticated route
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  return children;
};

export default ProtectedRoute;
