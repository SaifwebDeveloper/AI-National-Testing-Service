import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, Lock, LogIn, Eye, EyeOff, AlertCircle, 
  Briefcase, GraduationCap, Loader2, Sparkles, 
  Shield, ArrowRight, CheckCircle, Brain
} from 'lucide-react';
import axios from 'axios';

// Validation Schema
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['student', 'admin']),
  rememberMe: z.boolean().optional(),
});

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { role: 'student', rememberMe: false },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data) => {
    try {
      setServerError(null);
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email: data.email,
        password: data.password,
        role: data.role
      });
      
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      if (data.rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      }
      
      const redirectPath = response.data.user.role === 'admin' 
        ? '/admin/dashboard' 
        : '/student/dashboard';
      navigate(redirectPath);
    } catch (err) {
      setServerError(err.response?.data?.message || 'Authentication failed. Please check your credentials.');
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  const roleVariants = {
    inactive: { scale: 1 },
    active: { scale: 1.02, transition: { type: "spring", stiffness: 300 } }
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
                to="/register"
                className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:shadow-lg transition-all transform hover:scale-105"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <motion.div 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="max-w-md w-full relative z-10 mt-16"
      >
        {/* Glass Card - Light Theme */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/60">
          
          {/* Logo & Header */}
          <div className="text-center mb-8">
            <motion.div 
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-blue-200 mb-4"
            >
              <Brain className="h-10 w-10 text-white" />
            </motion.div>
            <h2 className="text-3xl font-bold text-gray-800">Welcome Back</h2>
            <p className="text-gray-500 mt-1">Sign in to your AINTS account</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            
            {/* Role Selection - Modern Toggle */}
            <div className="bg-gray-100 rounded-xl p-1.5 flex gap-1">
              {['student', 'admin'].map((role) => (
                <motion.button
                  key={role}
                  type="button"
                  onClick={() => setValue('role', role)}
                  variants={roleVariants}
                  animate={selectedRole === role ? 'active' : 'inactive'}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-all duration-300 ${
                    selectedRole === role
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {role === 'student' ? <GraduationCap size={18} /> : <Briefcase size={18} />}
                  <span className="capitalize">{role}</span>
                </motion.button>
              ))}
            </div>

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Mail size={16} />
                Email Address
              </label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  {...register('email')}
                  type="email"
                  className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                  placeholder="you@example.com"
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-500 ml-1 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Lock size={16} />
                Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-12 py-3 text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 ml-1 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.password.message}
                </p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  {...register('rememberMe')} 
                  className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-400 focus:ring-offset-0" 
                />
                <span className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors">
                  Remember me
                </span>
              </label>
              <Link 
                to="/forgot-password" 
                className="text-sm text-blue-600 hover:text-blue-700 transition-colors font-medium"
              >
                Forgot password?
              </Link>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {serverError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-3 text-red-600"
                >
                  <AlertCircle size={18} className="flex-shrink-0" />
                  <span className="text-sm">{serverError}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-blue-200 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <LogIn className="h-5 w-5" />
                  <span>Sign In to AINTS</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </motion.button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link 
                to="/register" 
                className="text-blue-600 hover:text-blue-700 font-semibold transition-colors inline-flex items-center gap-1 group"
              >
                Create Account
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </p>
          </div>

          {/* AINTS Features Badge */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-center gap-3 text-xs text-gray-400">
              <div className="flex items-center gap-1">
                <Shield size={12} />
                <span>Secure Login</span>
              </div>
              <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
              <div className="flex items-center gap-1">
                <Brain size={12} />
                <span>AI Powered</span>
              </div>
              <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
              <div className="flex items-center gap-1">
                <CheckCircle size={12} />
                <span>Encrypted</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;