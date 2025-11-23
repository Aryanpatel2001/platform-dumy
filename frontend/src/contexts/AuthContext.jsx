import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('auth_token'));

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  // Configure axios defaults
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      const savedToken = localStorage.getItem('auth_token');
      if (savedToken) {
        try {
          setToken(savedToken);
          axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
          
          const response = await axios.get(`${backendUrl}/api/auth/verify`);
          if (response.data.success) {
            setUser(response.data.user);
          } else {
            // Token is invalid, remove it
            localStorage.removeItem('auth_token');
            setToken(null);
            delete axios.defaults.headers.common['Authorization'];
          }
        } catch (error) {
          console.error('Auth verification failed:', error);
          localStorage.removeItem('auth_token');
          setToken(null);
          delete axios.defaults.headers.common['Authorization'];
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${backendUrl}/api/auth/login`, {
        email,
        password
      });

      if (response.data.success) {
        const { user: userData, token: authToken } = response.data;
        
        setUser(userData);
        setToken(authToken);
        localStorage.setItem('auth_token', authToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
        
        toast.success('Login successful!');
        return { success: true };
      } else {
        toast.error(response.data.message || 'Login failed');
        return { success: false, error: response.data.message };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await axios.post(`${backendUrl}/api/auth/register`, {
        name,
        email,
        password
      });

      if (response.data.success) {
        const { user: userData, token: authToken } = response.data;
        
        setUser(userData);
        setToken(authToken);
        localStorage.setItem('auth_token', authToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
        
        toast.success('Registration successful!');
        return { success: true };
      } else {
        toast.error(response.data.message || 'Registration failed');
        return { success: false, error: response.data.message };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await axios.post(`${backendUrl}/api/auth/logout`);
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // Clear local state regardless of API call success
      setUser(null);
      setToken(null);
      localStorage.removeItem('auth_token');
      delete axios.defaults.headers.common['Authorization'];
      toast.success('Logged out successfully');
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await axios.put(`${backendUrl}/api/auth/profile`, profileData);
      
      if (response.data.success) {
        setUser(response.data.user);
        toast.success('Profile updated successfully!');
        return { success: true };
      } else {
        toast.error(response.data.message || 'Profile update failed');
        return { success: false, error: response.data.message };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Profile update failed';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const getProfile = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/auth/profile`);
      
      if (response.data.success) {
        setUser(response.data.user);
        return { success: true, user: response.data.user, stats: response.data.stats };
      } else {
        return { success: false, error: response.data.message };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to get profile';
      return { success: false, error: errorMessage };
    }
  };

  const isAuthenticated = () => {
    return !!user && !!token;
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateProfile,
    getProfile,
    isAuthenticated
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};