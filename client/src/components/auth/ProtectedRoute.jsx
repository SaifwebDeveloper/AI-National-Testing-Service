import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles = ['student', 'admin'] }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  // Check if user is authenticated
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  // Check if token is expired (optional - you can decode JWT to check expiry)
  const checkTokenExpiry = () => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp && payload.exp < Date.now() / 1000) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return true;
      }
      return false;
    } catch {
      return true;
    }
  };
  
  if (checkTokenExpiry()) {
    return <Navigate to="/login" replace />;
  }
  
  // Check if user has required role
  if (!allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    if (user.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (user.role === 'student') {
      return <Navigate to="/student/dashboard" replace />;
    }
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// HOC for role-based rendering
export const withRoleProtection = (Component, allowedRoles) => {
  return function RoleProtectedComponent(props) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!allowedRoles.includes(user.role)) {
      return <Navigate to="/unauthorized" replace />;
    }
    
    return <Component {...props} />;
  };
};

// Custom hook for auth
export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  
  React.useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setIsAuthenticated(true);
      setUser(JSON.parse(userData));
    }
    
    setLoading(false);
  }, []);
  
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('rememberMe');
    setIsAuthenticated(false);
    setUser(null);
    window.location.href = '/login';
  };
  
  return { isAuthenticated, user, loading, logout };
};

// Component for unauthorized access
export const Unauthorized = () => {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
          <svg className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-600 mb-6">
          You don't have permission to access this page.
        </p>
        {user?.role === 'admin' ? (
          <a href="/admin/dashboard" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Go to Admin Dashboard
          </a>
        ) : user?.role === 'student' ? (
          <a href="/student/dashboard" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Go to Student Dashboard
          </a>
        ) : (
          <a href="/login" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Back to Login
          </a>
        )}
      </div>
    </div>
  );
};

// Session timeout component
export const SessionTimeout = ({ timeoutMinutes = 30 }) => {
  const [showWarning, setShowWarning] = React.useState(false);
  const { logout } = useAuth();
  let timeoutTimer;
  let warningTimer;
  
  React.useEffect(() => {
    const resetTimers = () => {
      clearTimeout(timeoutTimer);
      clearTimeout(warningTimer);
      setShowWarning(false);
      
      // Show warning 1 minute before timeout
      warningTimer = setTimeout(() => {
        setShowWarning(true);
      }, (timeoutMinutes - 1) * 60 * 1000);
      
      // Logout after timeout
      timeoutTimer = setTimeout(() => {
        logout();
      }, timeoutMinutes * 60 * 1000);
    };
    
    // Reset timers on user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, resetTimers);
    });
    
    resetTimers();
    
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, resetTimers);
      });
      clearTimeout(timeoutTimer);
      clearTimeout(warningTimer);
    };
  }, [timeoutMinutes, logout]);
  
  if (!showWarning) return null;
  
  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slideInRight">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg shadow-lg p-4 max-w-sm">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-800">Session Expiring Soon</p>
            <p className="text-xs text-yellow-700 mt-1">
              Your session will expire in 1 minute due to inactivity.
            </p>
          </div>
          <button
            onClick={() => {
              clearTimeout(timeoutTimer);
              clearTimeout(warningTimer);
              setShowWarning(false);
            }}
            className="text-yellow-600 hover:text-yellow-800"
          >
            <span className="text-xs">Dismiss</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProtectedRoute;