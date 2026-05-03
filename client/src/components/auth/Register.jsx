import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle, Phone, CreditCard, GraduationCap, Shield, ArrowRight, Brain, Sparkles } from 'lucide-react';
import axios from 'axios';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    cnic: '',
    phone: '',
    role: 'student'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Full name is required');
      return false;
    }
    if (!formData.email) {
      setError('Email is required');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
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
    if (!formData.cnic) {
      setError('CNIC is required for student registration');
      return false;
    }
    if (formData.cnic && !/^\d{13}$/.test(formData.cnic.replace(/-/g, ''))) {
      setError('Please enter a valid 13-digit CNIC');
      return false;
    }
    if (!acceptTerms) {
      setError('Please accept the terms and conditions');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await axios.post('http://localhost:5000/api/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        cnic: formData.cnic,
        phone: formData.phone,
        role: 'student'
      });
      
      setSuccess('Registration successful! Redirecting to login...');
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-blue-200 mb-4">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800">Student Registration</h2>
          <p className="text-gray-500 mt-1">Join AINTS and start your journey</p>
        </div>

        {/* Registration Form - Light Theme Glass Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl p-6 border border-white/60">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Student Role Badge */}
            <div className="space-y-2">
              <div className="bg-gray-100 rounded-xl p-1.5">
                <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md">
                  <GraduationCap className="h-4 w-4" />
                  <span className="font-medium">Student Registration</span>
                  <Sparkles className="h-3 w-3" />
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg p-2">
                <Brain className="h-3 w-3" />
                <span>Register with AINTS for AI-powered test preparation</span>
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Full Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                  placeholder="John Doe"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* CNIC */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                CNIC Number *
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  name="cnic"
                  value={formData.cnic}
                  onChange={handleChange}
                  className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                  placeholder="1234567890123"
                  maxLength="13"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Enter 13-digit CNIC number without spaces or dashes</p>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                  placeholder="03001234567"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-12 py-2.5 text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                  placeholder="••••••••"
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

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Confirm Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-12 py-2.5 text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                  placeholder="••••••••"
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

            {/* Terms and Conditions */}
            <label className="flex items-start space-x-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-500 focus:ring-blue-400 focus:ring-offset-0 mt-0.5"
              />
              <span className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors">
                I agree to the{' '}
                <Link to="/terms" className="text-blue-600 hover:text-blue-700">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-blue-600 hover:text-blue-700">
                  Privacy Policy
                </Link>
              </span>
            </label>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-start space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-600">{success}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-3 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg shadow-blue-200"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <User className="h-5 w-5" />
                  <span>Register with AINTS</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-5 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
                Sign in to AINTS
              </Link>
            </p>
          </div>

          {/* AINTS Features */}
          <div className="mt-5 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
              <div className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                <span>Secure Registration</span>
              </div>
              <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
              <div className="flex items-center gap-1">
                <Brain className="h-3 w-3" />
                <span>AI Proctored</span>
              </div>
              <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
              <div className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                <span>Instant Results</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;