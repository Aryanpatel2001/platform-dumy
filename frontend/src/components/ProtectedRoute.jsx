import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  console.log('isAuthenticated:', isAuthenticated());

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-bg">
        <div className="glass-card p-8 rounded-2xl">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span className="text-gray-300">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated()) {
    // Show login as a modal over the home page by passing backgroundLocation
    const backgroundLocation = { ...location, pathname: '/' };
    return <Navigate to="/login" state={{ from: location, backgroundLocation }} replace />;
  }

  return children;
};

export default ProtectedRoute;