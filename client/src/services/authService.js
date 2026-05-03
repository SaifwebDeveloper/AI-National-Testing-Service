import api from './api';

const AUTH_ENDPOINTS = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  REFRESH_TOKEN: '/auth/refresh-token',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  CHANGE_PASSWORD: '/auth/change-password',
  VERIFY_EMAIL: '/auth/verify-email',
  GET_PROFILE: '/auth/profile',
  UPDATE_PROFILE: '/auth/profile',
};

class AuthService {
  // Login user
  async login(email, password, role = 'student') {
    try {
      const response = await api.post(AUTH_ENDPOINTS.LOGIN, { email, password, role });
      
      if (response.token) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        // Set token expiry (optional)
        const tokenExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
        localStorage.setItem('tokenExpiry', tokenExpiry);
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  }
  
  // Register new user
  async register(userData) {
    try {
      const response = await api.post(AUTH_ENDPOINTS.REGISTER, userData);
      return response;
    } catch (error) {
      throw error;
    }
  }
  
  // Logout user
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('tokenExpiry');
    localStorage.removeItem('rememberMe');
  }
  
  // Refresh token
  async refreshToken() {
    try {
      const response = await api.post(AUTH_ENDPOINTS.REFRESH_TOKEN);
      if (response.token) {
        localStorage.setItem('token', response.token);
        return response.token;
      }
      throw new Error('No token received');
    } catch (error) {
      this.logout();
      throw error;
    }
  }
  
  // Forgot password
  async forgotPassword(email) {
    try {
      const response = await api.post(AUTH_ENDPOINTS.FORGOT_PASSWORD, { email });
      return response;
    } catch (error) {
      throw error;
    }
  }
  
  // Reset password
  async resetPassword(token, newPassword) {
    try {
      const response = await api.post(AUTH_ENDPOINTS.RESET_PASSWORD, { token, newPassword });
      return response;
    } catch (error) {
      throw error;
    }
  }
  
  // Change password (authenticated)
  async changePassword(currentPassword, newPassword) {
    try {
      const response = await api.post(AUTH_ENDPOINTS.CHANGE_PASSWORD, { currentPassword, newPassword });
      return response;
    } catch (error) {
      throw error;
    }
  }
  
  // Verify email
  async verifyEmail(token) {
    try {
      const response = await api.post(AUTH_ENDPOINTS.VERIFY_EMAIL, { token });
      return response;
    } catch (error) {
      throw error;
    }
  }
  
  // Get user profile
  async getProfile() {
    try {
      const response = await api.get(AUTH_ENDPOINTS.GET_PROFILE);
      return response;
    } catch (error) {
      throw error;
    }
  }
  
  // Update user profile
  async updateProfile(profileData) {
    try {
      const response = await api.put(AUTH_ENDPOINTS.UPDATE_PROFILE, profileData);
      if (response.user) {
        localStorage.setItem('user', JSON.stringify(response.user));
      }
      return response;
    } catch (error) {
      throw error;
    }
  }
  
  // Check if user is authenticated
  isAuthenticated() {
    const token = localStorage.getItem('token');
    const tokenExpiry = localStorage.getItem('tokenExpiry');
    
    if (!token) return false;
    
    // Check if token is expired
    if (tokenExpiry && Date.now() > parseInt(tokenExpiry)) {
      this.logout();
      return false;
    }
    
    return true;
  }
  
  // Get current user
  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
  
  // Get user role
  getUserRole() {
    const user = this.getCurrentUser();
    return user?.role || null;
  }
  
  // Check if user has specific role
  hasRole(role) {
    const userRole = this.getUserRole();
    return userRole === role;
  }
  
  // Check if user is admin
  isAdmin() {
    return this.hasRole('admin');
  }
  
  // Check if user is student
  isStudent() {
    return this.hasRole('student');
  }
}

const authService = new AuthService();
export default authService;