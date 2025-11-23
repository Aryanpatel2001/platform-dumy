import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isModal = !!location.state?.backgroundLocation;

  // Default to dashboard after login when not coming from a protected route
  const from = location.state?.from?.pathname || '/dashboard';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    const result = await login(formData.email, formData.password);
    
    if (result.success) {
      navigate(from, { replace: true });
    }
    
    setLoading(false);
  };

  return (
    <div className={`${isModal ? 'fixed inset-0 z-50 flex items-center justify-center bg-brand-dark/40 backdrop-blur-sm px-4' : 'min-h-screen flex items-center justify-center gradient-bg px-4 relative overflow-hidden'}`}>
      {/* Decorative elements */}
      {!isModal && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-brand-primary/10 to-brand-sky/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-brand-secondary/10 to-brand-light/10 rounded-full blur-3xl"></div>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-brand-white dark:bg-brand-dark p-8 rounded-3xl shadow-2xl border border-brand-surface dark:border-gray-800">
          {isModal && (
            <button
              onClick={() => navigate(-1)}
              className="absolute top-4 right-4 text-black hover:text-brand-primary transition-colors " 
            >
              Close
            </button>
          )}
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-16 h-16 bg-gradient-to-br from-brand-primary via-brand-secondary to-brand-sky rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg"
            >
              <svg className="w-8 h-8 text-brand-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </motion.div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-brand-primary to-brand-sky bg-clip-text text-transparent mb-2">
              Welcome Back
            </h1>
            <p className="text-brand-muted dark:text-gray-400">Sign in to your AI Agent Platform</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-brand-dark dark:text-brand-white mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-3 bg-brand-white dark:bg-gray-900 border rounded-xl text-brand-dark dark:text-brand-white placeholder-brand-muted dark:placeholder-gray-500 focus:outline-none focus:ring-2 transition-all duration-200 ${
                  errors.email 
                    ? 'border-brand-accent focus:ring-brand-accent focus:border-brand-accent' 
                    : 'border-brand-surface dark:border-gray-700 focus:ring-brand-primary focus:border-brand-primary'
                }`}
                placeholder="Enter your email"
                disabled={loading}
              />
              {errors.email && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-brand-accent text-sm mt-1"
                >
                  {errors.email}
                </motion.p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-brand-dark dark:text-brand-white mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 pr-12 bg-brand-white dark:bg-gray-900 border rounded-xl text-brand-dark dark:text-brand-white placeholder-brand-muted dark:placeholder-gray-500 focus:outline-none focus:ring-2 transition-all duration-200 ${
                    errors.password 
                      ? 'border-brand-accent focus:ring-brand-accent focus:border-brand-accent' 
                      : 'border-brand-surface dark:border-gray-700 focus:ring-brand-primary focus:border-brand-primary'
                  }`}
                  placeholder="Enter your password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-brand-muted dark:text-gray-400 hover:text-brand-primary dark:hover:text-brand-sky transition-colors"
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-brand-accent text-sm mt-1"
                >
                  {errors.password}
                </motion.p>
              )}
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${
                loading
                  ? 'bg-brand-surface dark:bg-gray-800 cursor-not-allowed text-brand-muted'
                  : 'btn-primary shadow-lg shadow-brand-primary/20'
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-brand-primary"></div>
                  <span>Signing In...</span>
                </div>
              ) : (
                'Sign In'
              )}
            </motion.button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-brand-muted dark:text-gray-400">
              Don't have an account?{' '}
              <Link
                to="/register"
                state={{ backgroundLocation: location.state?.backgroundLocation || { pathname: '/' } }}
                className="text-brand-primary hover:text-brand-sky font-semibold transition-colors"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
