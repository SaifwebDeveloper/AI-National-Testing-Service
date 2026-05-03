/**
 * Format date to readable string
 */
export const formatDate = (date, format = 'YYYY-MM-DD') => {
  if (!date) return 'N/A';
  const d = new Date(date);
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
};

/**
 * Format time from seconds to MM:SS format
 */
export const formatTime = (seconds) => {
  if (isNaN(seconds)) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Format time from seconds to HH:MM:SS format
 */
export const formatTimeLong = (seconds) => {
  if (isNaN(seconds)) return '00:00:00';
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Calculate percentage
 */
export const calculatePercentage = (obtained, total) => {
  if (!total || total === 0) return 0;
  return ((obtained / total) * 100).toFixed(2);
};

/**
 * Get grade based on percentage
 */
export const getGrade = (percentage) => {
  if (percentage >= 90) return { grade: 'A+', color: '#10B981' };
  if (percentage >= 80) return { grade: 'A', color: '#34D399' };
  if (percentage >= 70) return { grade: 'B', color: '#FBBF24' };
  if (percentage >= 60) return { grade: 'C', color: '#F59E0B' };
  if (percentage >= 50) return { grade: 'D', color: '#F97316' };
  return { grade: 'F', color: '#EF4444' };
};

/**
 * Get status badge color
 */
export const getStatusColor = (status) => {
  const colors = {
    draft: 'gray',
    published: 'green',
    ongoing: 'blue',
    completed: 'purple',
    cancelled: 'red',
    pending: 'yellow',
    approved: 'green',
    rejected: 'red',
    pass: 'green',
    fail: 'red',
  };
  return colors[status] || 'gray';
};

/**
 * Truncate text
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Debounce function
 */
export const debounce = (func, delay = 500) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Throttle function
 */
export const throttle = (func, limit = 500) => {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Deep clone object
 */
export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Check if object is empty
 */
export const isEmpty = (obj) => {
  return !obj || Object.keys(obj).length === 0;
};

/**
 * Generate random ID
 */
export const generateId = (length = 8) => {
  return Math.random().toString(36).substring(2, length + 2);
};

/**
 * Download file from blob
 */
export const downloadFile = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
};

/**
 * Copy text to clipboard
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

/**
 * Get query parameters from URL
 */
export const getQueryParams = () => {
  const params = new URLSearchParams(window.location.search);
  const result = {};
  for (const [key, value] of params) {
    result[key] = value;
  }
  return result;
};

/**
 * Build query string from object
 */
export const buildQueryString = (params) => {
  const query = new URLSearchParams();
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
      query.append(key, params[key]);
    }
  });
  return query.toString();
};

/**
 * Scroll to top of page
 */
export const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

/**
 * Scroll to element
 */
export const scrollToElement = (elementId) => {
  const element = document.getElementById(elementId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

/**
 * Detect if device is mobile
 */
export const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

/**
 * Detect if browser is online
 */
export const isOnline = () => {
  return navigator.onLine;
};

/**
 * Add event listener with cleanup
 */
export const addEventListener = (element, event, handler) => {
  element.addEventListener(event, handler);
  return () => element.removeEventListener(event, handler);
};

/**
 * Prevent default for event
 */
export const preventDefault = (e) => {
  e.preventDefault();
  return false;
};

/**
 * Stop propagation for event
 */
export const stopPropagation = (e) => {
  e.stopPropagation();
};

/**
 * Get file size in readable format
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Validate file type
 */
export const isValidFileType = (file, allowedTypes) => {
  return allowedTypes.includes(file.type);
};

/**
 * Validate file size
 */
export const isValidFileSize = (file, maxSizeMB = 10) => {
  return file.size <= maxSizeMB * 1024 * 1024;
};

/**
 * Get initials from name
 */
export const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

/**
 * Generate random color
 */
export const getRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

/**
 * Group array by key
 */
export const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const groupKey = item[key];
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {});
};

/**
 * Sort array by key
 */
export const sortBy = (array, key, order = 'asc') => {
  return [...array].sort((a, b) => {
    if (order === 'asc') {
      return a[key] > b[key] ? 1 : -1;
    } else {
      return a[key] < b[key] ? 1 : -1;
    }
  });
};

/**
 * Search in array
 */
export const searchInArray = (array, searchTerm, keys) => {
  if (!searchTerm) return array;
  const term = searchTerm.toLowerCase();
  return array.filter(item => {
    return keys.some(key => {
      const value = item[key]?.toString().toLowerCase();
      return value?.includes(term);
    });
  });
};

/**
 * Paginate array
 */
export const paginate = (array, page = 1, limit = 10) => {
  const start = (page - 1) * limit;
  const end = start + limit;
  return {
    data: array.slice(start, end),
    total: array.length,
    page,
    limit,
    totalPages: Math.ceil(array.length / limit),
  };
};