import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle, Shield, ArrowLeft, Brain, Key, Sparkles } from 'lucide-react';
import axios from 'axios';

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [token, setToken] = useState('');
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [validToken, setValidToken] = useState(true);
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const resetToken = queryParams.get('token');
    
    if (!resetToken) {
      setValidToken(false);
      setError('Invalid or missing reset token');
      setVerifying(false);
    } else {
      setToken(resetToken);
      verifyToken(resetToken);
    }
  }, [location]);

  const verifyToken = async (resetToken) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/auth/verify-reset-token?token=${resetToken}`);
      if (!response.data.valid) {
        setValidToken(false);
        setError('Invalid or expired reset token');
      }
    } catch (err) {
      setValidToken(false);
      setError(err.response?.data?.message || 'Invalid or expired reset token');
    } finally {
      setVerifying(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.password) {
      setError('Password is required');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post('http://localhost:5000/api/auth/reset-password', {
        token,
        newPassword: formData.password
      });
      
      setSuccess(response.data.message || 'Password reset successful! Redirecting to AINTS login...');
      
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Loading spinner component for verification
  if (verifying) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-blue-50 to-white"></div>
        <div className="text-center relative z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto"></div>
          <p className="text-gray-600 mt-4">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  // Invalid token state
  if (!validToken) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-12">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-blue-50 to-white"></div>
        
        <div className="absolute inset-0 opacity-20">
          <svg className="absolute w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#3B82F6" strokeWidth="0.5" opacity="0.3"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        
        <div className="max-w-md w-full relative z-10">
          <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl shadow-2xl p-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-2xl mb-4">
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Invalid Reset Link</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <Link
                to="/forgot-password"
                className="inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-blue-200"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Request New Reset Link</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-12">
      {/* Light Blue to Soft White Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-blue-50 to-white"></div>
      
      {/* Subtle Geometric Patterns */}
      <div className="absolute inset-0 opacity-20">
        <svg className="absolute w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#3B82F6" strokeWidth="0.5" opacity="0.3"/>
            </pattern>
            <pattern id="hexagons" width="60" height="52" patternUnits="userSpaceOnUse" patternTransform="scale(0.8)">
              <path d="M30,0 L60,15 L60,45 L30,60 L0,45 L0,15 Z" fill="none" stroke="#60A5FA" strokeWidth="0.8" opacity="0.4"/>
              <path d="M30,30 L60,45 M30,30 L0,45 M30,30 L30,60" stroke="#93C5FD" strokeWidth="0.5" opacity="0.3"/>
            </pattern>
            <pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="10" cy="10" r="1.5" fill="#3B82F6" opacity="0.15"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          <rect width="100%" height="100%" fill="url(#hexagons)" />
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
      </div>
      
      {/* Floating subtle shapes */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-blue-200/30 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-10 w-80 h-80 bg-indigo-100/30 rounded-full blur-3xl"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-100/20 rounded-full blur-3xl"></div>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-1.5 rounded-lg">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">AINTS</span>
                <p className="text-xs text-gray-500 -mt-1">AI Integrated NTS</p>
              </div>
            </Link>
            <div className="flex items-center space-x-6">
              <Link to="/" className="text-gray-600 hover:text-blue-600 font-medium transition">Home</Link>
              <Link to="/about" className="text-gray-600 hover:text-blue-600 font-medium transition hidden sm:inline">About</Link>
              <Link
                to="/login"
                className="px-5 py-2 text-blue-600 font-medium hover:text-blue-700 transition"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-md w-full relative z-10 mt-16">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-blue-200 mb-4">
            <Key className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800">Reset Password</h2>
          <p className="text-gray-500 mt-1">Create a new password for your AINTS account</p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl shadow-2xl p-8">
          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-blue-500" />
                <span className="text-xs text-gray-500">Secure password reset</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  New Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-12 py-3 text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                    placeholder="••••••••"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">Minimum 6 characters</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Confirm New Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-12 py-3 text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                    placeholder="••••••••"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-3 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg shadow-blue-200"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Resetting password...</span>
                  </>
                ) : (
                  <>
                    <Key className="h-5 w-5" />
                    <span>Reset Password</span>
                  </>
                )}
              </button>

              <div className="text-center pt-4">
                <Link to="/login" className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to AINTS Login
                </Link>
              </div>
            </form>
          ) : (
            <div className="space-y-5">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-green-700 font-medium">Password Reset Successful!</p>
                    <p className="text-sm text-gray-600 mt-1">{success}</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                  <p className="text-xs text-gray-600">Your password has been updated successfully.</p>
                </div>
              </div>

              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto"></div>
                <p className="text-xs text-gray-500 mt-2">Redirecting to AINTS login page...</p>
              </div>
            </div>
          )}
        </div>

        {/* Security Note */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
            <Shield className="h-3 w-3" />
            Your password is encrypted and secure with AINTS
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;