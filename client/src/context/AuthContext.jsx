import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';
import authService from '../services/authService';

// Create Auth Context
const AuthContext = createContext(null);

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [permissions, setPermissions] = useState([]);

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (token && storedUser) {
        try {
          // Verify token with backend
          const userData = JSON.parse(storedUser);
          setUser(userData);
          setIsAuthenticated(true);
          setPermissions(getUserPermissions(userData.role));
        } catch (error) {
          console.error('Error loading user:', error);
          logout();
        }
      }
      setLoading(false);
    };
    
    loadUser();
  }, []);

  // Get user permissions based on role
  const getUserPermissions = (role) => {
    const basePermissions = ['view_profile', 'edit_profile'];
    
    const rolePermissions = {
      admin: [
        ...basePermissions,
        'view_all_tests',
        'create_test',
        'edit_test',
        'delete_test',
        'publish_test',
        'view_all_results',
        'announce_results',
        'view_all_students',
        'manage_users',
        'view_reports',
        'export_data',
        'system_settings',
      ],
      student: [
        ...basePermissions,
        'view_available_tests',
        'apply_for_test',
        'take_test',
        'view_my_results',
        'download_certificate',
      ],
    };
    
    return rolePermissions[role] || basePermissions;
  };

  // Check if user has specific permission
  const hasPermission = useCallback((permission) => {
    return permissions.includes(permission);
  }, [permissions]);

  // Check if user has any of the given permissions
  const hasAnyPermission = useCallback((permissionList) => {
    return permissionList.some(permission => permissions.includes(permission));
  }, [permissions]);

  // Check if user has all of the given permissions
  const hasAllPermissions = useCallback((permissionList) => {
    return permissionList.every(permission => permissions.includes(permission));
  }, [permissions]);

  // Login user
  const login = async (email, password, role) => {
    setError(null);
    try {
      const response = await authService.login(email, password, role);
      
      if (response.token && response.user) {
        setUser(response.user);
        setIsAuthenticated(true);
        setPermissions(getUserPermissions(response.user.role));
        
        // Set up axios default header
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.token}`;
        
        return { success: true, user: response.user };
      }
      throw new Error('Invalid response from server');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed');
      return { success: false, error: err.response?.data?.message || err.message };
    }
  };

  // Register user
  const register = async (userData) => {
    setError(null);
    try {
      const response = await authService.register(userData);
      return { success: true, data: response };
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Registration failed');
      return { success: false, error: err.response?.data?.message || err.message };
    }
  };

  // Logout user
  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setPermissions([]);
      delete axios.defaults.headers.common['Authorization'];
      window.location.href = '/login';
    }
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    setError(null);
    try {
      const response = await authService.updateProfile(profileData);
      if (response.user) {
        setUser(response.user);
        localStorage.setItem('user', JSON.stringify(response.user));
      }
      return { success: true, user: response.user };
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Profile update failed');
      return { success: false, error: err.response?.data?.message || err.message };
    }
  };

  // Change password
  const changePassword = async (currentPassword, newPassword) => {
    setError(null);
    try {
      const response = await authService.changePassword(currentPassword, newPassword);
      return { success: true, message: response.message };
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Password change failed');
      return { success: false, error: err.response?.data?.message || err.message };
    }
  };

  // Forgot password
  const forgotPassword = async (email) => {
    setError(null);
    try {
      const response = await authService.forgotPassword(email);
      return { success: true, message: response.message };
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to send reset email');
      return { success: false, error: err.response?.data?.message || err.message };
    }
  };

  // Reset password
  const resetPassword = async (token, newPassword) => {
    setError(null);
    try {
      const response = await authService.resetPassword(token, newPassword);
      return { success: true, message: response.message };
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Password reset failed');
      return { success: false, error: err.response?.data?.message || err.message };
    }
  };

  // Verify email
  const verifyEmail = async (token) => {
    setError(null);
    try {
      const response = await authService.verifyEmail(token);
      return { success: true, message: response.message };
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Email verification failed');
      return { success: false, error: err.response?.data?.message || err.message };
    }
  };

  // Refresh token
  const refreshToken = async () => {
    try {
      const newToken = await authService.refreshToken();
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      return true;
    } catch (error) {
      logout();
      return false;
    }
  };

  // Get user role
  const getUserRole = () => {
    return user?.role || null;
  };

  // Check if user is admin
  const isAdmin = () => {
    return user?.role === 'admin';
  };

  // Check if user is student
  const isStudent = () => {
    return user?.role === 'student';
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    error,
    permissions,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword,
    verifyEmail,
    refreshToken,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    getUserRole,
    isAdmin,
    isStudent,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Higher-order component to protect routes
export const withAuth = (WrappedComponent, requiredPermissions = []) => {
  return function AuthenticatedComponent(props) {
    const { isAuthenticated, loading, hasAllPermissions, isAdmin, isStudent } = useAuth();
    
    if (loading) {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
        </div>
      );
    }
    
    if (!isAuthenticated) {
      window.location.href = '/login';
      return null;
    }
    
    if (requiredPermissions.length > 0 && !hasAllPermissions(requiredPermissions)) {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      );
    }
    
    return <WrappedComponent {...props} />;
  };
};

export default AuthContext;