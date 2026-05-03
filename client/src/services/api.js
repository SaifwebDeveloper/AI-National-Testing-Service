import axios from 'axios';

// Base URL configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8000';

// Create axios instances
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const aiClient = axios.create({
  baseURL: AI_SERVICE_URL,
  timeout: 60000, // AI service may take longer
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Helper function to handle file uploads
const uploadFile = async (url, file, additionalData = {}) => {
  const formData = new FormData();
  formData.append('file', file);
  
  Object.keys(additionalData).forEach(key => {
    formData.append(key, additionalData[key]);
  });
  
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}${url}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }
  
  return response.json();
};

// Generic API methods
const api = {
  // GET request
  get: async (url, params = {}) => {
    const response = await apiClient.get(url, { params });
    return response.data;
  },
  
  // POST request
  post: async (url, data = {}) => {
    const response = await apiClient.post(url, data);
    return response.data;
  },
  
  // PUT request
  put: async (url, data = {}) => {
    const response = await apiClient.put(url, data);
    return response.data;
  },
  
  // PATCH request
  patch: async (url, data = {}) => {
    const response = await apiClient.patch(url, data);
    return response.data;
  },
  
  // DELETE request
  delete: async (url) => {
    const response = await apiClient.delete(url);
    return response.data;
  },
  
  // File upload
  upload: uploadFile,
  
  // AI service calls
  ai: {
    post: async (url, data = {}) => {
      const response = await aiClient.post(url, data);
      return response.data;
    },
    generateTest: async (file, testDetails) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', testDetails.title);
      formData.append('totalMarks', testDetails.totalMarks);
      formData.append('subject', testDetails.subject);
      formData.append('difficulty', testDetails.difficulty);
      
      const response = await aiClient.post('/generate-test', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
  },
};

// Error types for better error handling
export const ErrorTypes = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
};

export const getErrorMessage = (error) => {
  if (error.response) {
    switch (error.response.status) {
      case 400:
        return error.response.data?.message || 'Invalid request. Please check your input.';
      case 401:
        return 'Session expired. Please login again.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'Resource not found.';
      case 409:
        return 'Conflict with existing data.';
      case 422:
        return 'Validation failed. Please check your input.';
      case 429:
        return 'Too many requests. Please try again later.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return error.response.data?.message || 'An unexpected error occurred.';
    }
  } else if (error.request) {
    return 'Network error. Please check your internet connection.';
  } else {
    return error.message || 'An unexpected error occurred.';
  }
};

export { apiClient, aiClient };
export default api;