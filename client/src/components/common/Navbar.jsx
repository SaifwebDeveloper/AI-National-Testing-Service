import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, User, Settings, Award, Home, BookOpen, FileText, Brain, GraduationCap, LayoutDashboard, BarChart3, Shield, Sparkles } from 'lucide-react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const navLinks = user?.role === 'admin' 
    ? [
        { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/admin/tests', icon: FileText, label: 'Manage Tests' },
        { to: '/admin/results', icon: Award, label: 'Results' },
        { to: '/admin/profile', icon: User, label: 'Profile' },
      ]
    : [
        { to: '/student/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/student/tests', icon: BookOpen, label: 'Available Tests' },
        { to: '/student/my-results', icon: Award, label: 'My Results' },
        { to: '/student/profile', icon: User, label: 'Profile' },
      ];

  // Get user role display name
  const getUserRole = () => {
    if (user?.role === 'admin') return 'Administrator';
    return 'Student';
  };

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
      scrolled ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-100' : 'bg-white shadow-md border-b border-gray-100'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo - AINTS Branding */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-xl shadow-md group-hover:shadow-lg transition-all">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">
                AINTS
              </span>
              <span className="text-xs text-gray-500 -mt-1 hidden sm:block">AI Integrated NTS</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-all duration-200 group"
              >
                <link.icon className="h-4 w-4 group-hover:scale-110 transition-transform" />
                <span className="font-medium">{link.label}</span>
              </Link>
            ))}
            
            <div className="flex items-center space-x-4 ml-4 pl-4 border-l border-gray-200">
              {/* User Info */}
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-9 h-9 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                    <span className="text-white text-sm font-bold">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-800">{user?.name}</span>
                  <span className="text-xs text-gray-500">{getUserRole()}</span>
                </div>
              </div>
              
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all duration-200 group"
              >
                <LogOut className="h-4 w-4 group-hover:scale-110 transition-transform" />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {isOpen ? <X className="h-6 w-6 text-gray-600" /> : <Menu className="h-6 w-6 text-gray-600" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-gray-100 animate-slideDown">
            {/* User Info in Mobile */}
            <div className="flex items-center space-x-3 px-4 py-3 mb-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                <span className="text-white text-base font-bold">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-gray-800">{user?.name}</span>
                <span className="text-xs text-gray-500">{getUserRole()}</span>
              </div>
            </div>
            
            {/* Navigation Links */}
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setIsOpen(false)}
                className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-blue-50 rounded-lg transition-colors group"
              >
                <link.icon className="h-5 w-5 group-hover:scale-110 transition-transform" />
                <span className="font-medium">{link.label}</span>
              </Link>
            ))}
            
            {/* Logout Button in Mobile */}
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 px-4 py-3 w-full text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-2 group"
            >
              <LogOut className="h-5 w-5 group-hover:scale-110 transition-transform" />
              <span className="font-medium">Logout</span>
            </button>
            
            {/* AINTS Brand Footer in Mobile */}
            <div className="mt-4 pt-4 border-t border-gray-100 px-4">
              <div className="flex items-center justify-center space-x-2">
                <Sparkles className="h-3 w-3 text-blue-500" />
                <span className="text-xs text-gray-400">AINTS - AI Integrated National Testing Service</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;