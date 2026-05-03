// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  REFRESH_TOKEN: '/auth/refresh-token',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  CHANGE_PASSWORD: '/auth/change-password',
  VERIFY_EMAIL: '/auth/verify-email',
  PROFILE: '/auth/profile',
  
  // Tests
  TESTS: '/tests',
  UPLOAD_TEST: '/tests/upload',
  AI_GENERATE: '/tests/ai-generate',
  AVAILABLE_TESTS: '/tests/available',
  APPLY_TEST: '/tests/apply',
  START_TEST: '/tests/start',
  SUBMIT_TEST: '/tests/submit',
  SAVE_PROGRESS: '/tests/save-progress',
  
  // Results
  RESULTS: '/results',
  ANNOUNCE_RESULTS: '/results/announce',
  EXPORT_RESULTS: '/results/export',
  
  // Admin
  ADMIN_STATS: '/admin/stats',
  ADMIN_TESTS: '/admin/tests',
  ADMIN_STUDENTS: '/admin/students',
  ADMIN_REPORTS: '/admin/reports',
};

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  STUDENT: 'student',
};

// Test Status
export const TEST_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ONGOING: 'ongoing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

// Application Status
export const APPLICATION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

// Result Status
export const RESULT_STATUS = {
  PASS: 'pass',
  FAIL: 'fail',
  PENDING: 'pending',
};

// Question Types
export const QUESTION_TYPES = {
  MCQ: 'mcq',
  TRUE_FALSE: 'true_false',
  SHORT_ANSWER: 'short_answer',
  LONG_ANSWER: 'long_answer',
};

// Difficulty Levels
export const DIFFICULTY_LEVELS = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
  EXPERT: 'expert',
};

// Cheating Types
export const CHEATING_TYPES = {
  TAB_SWITCH: 'tab_switch',
  COPY_PASTE: 'copy_paste',
  RIGHT_CLICK: 'right_click',
  KEYBOARD_SHORTCUT: 'keyboard_shortcut',
  MULTIPLE_PERSONS: 'multiple_persons',
  PHONE_DETECTED: 'phone_detected',
  FACE_NOT_VISIBLE: 'face_not_visible',
  LOOKING_AWAY: 'looking_away',
  FULLSCREEN_EXIT: 'fullscreen_exit',
  DEVTOOLS: 'devtools',
};

// Penalty Amounts (in seconds)
export const PENALTIES = {
  FIRST_WARNING: 0,
  SECOND_WARNING: 30,
  THIRD_WARNING: 60,
  MAX_WARNINGS: 3,
};

// Time Constants (in milliseconds)
export const TIME_CONSTANTS = {
  ONE_SECOND: 1000,
  ONE_MINUTE: 60 * 1000,
  ONE_HOUR: 60 * 60 * 1000,
  ONE_DAY: 24 * 60 * 60 * 1000,
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  TOKEN_EXPIRY: 24 * 60 * 60 * 1000, // 24 hours
  AUTO_SAVE_INTERVAL: 30 * 1000, // 30 seconds
};

// File Upload Limits
export const FILE_LIMITS = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ACCEPTED_TYPES: {
    'application/pdf': ['.pdf'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/msword': ['.doc'],
  },
  MAX_FILES: 1,
};

// Validation Patterns
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/,
  PASSWORD: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/,
  CNIC: /^[0-9]{13}$/,
  PHONE: /^[0-9]{11}$/,
  NAME: /^[a-zA-Z\s]{2,50}$/,
  URL: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
};

// Validation Messages
export const VALIDATION_MESSAGES = {
  REQUIRED: 'This field is required',
  EMAIL: 'Please enter a valid email address',
  PASSWORD: 'Password must be at least 6 characters with at least one letter and one number',
  CONFIRM_PASSWORD: 'Passwords do not match',
  CNIC: 'Please enter a valid 13-digit CNIC',
  PHONE: 'Please enter a valid 11-digit phone number',
  NAME: 'Name must be 2-50 characters and contain only letters and spaces',
  MIN_LENGTH: (field, length) => `${field} must be at least ${length} characters`,
  MAX_LENGTH: (field, length) => `${field} must not exceed ${length} characters`,
  FILE_SIZE: 'File size must be less than 10MB',
  FILE_TYPE: 'Only PDF and Word documents are allowed',
};

// UI Constants
export const UI_CONSTANTS = {
  TOAST_DURATION: 5000,
  LOADING_DELAY: 300,
  DEBOUNCE_DELAY: 500,
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
  },
  TABLE: {
    DEFAULT_SORT: 'createdAt',
    DEFAULT_ORDER: 'desc',
  },
};

// Chart Colors
export const CHART_COLORS = {
  PRIMARY: '#3B82F6',
  SECONDARY: '#8B5CF6',
  SUCCESS: '#10B981',
  DANGER: '#EF4444',
  WARNING: '#F59E0B',
  INFO: '#06B6D4',
  PURPLE: '#8B5CF6',
  PINK: '#EC4899',
  INDIGO: '#6366F1',
  GRAY: '#6B7280',
};

// Grade Ranges
export const GRADE_RANGES = {
  'A+': { min: 90, max: 100 },
  'A': { min: 80, max: 89 },
  'B': { min: 70, max: 79 },
  'C': { min: 60, max: 69 },
  'D': { min: 50, max: 59 },
  'F': { min: 0, max: 49 },
};

// Local Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  THEME: 'theme',
  LANGUAGE: 'language',
  REMEMBER_ME: 'rememberMe',
  TOKEN_EXPIRY: 'tokenExpiry',
  TEST_PROGRESS: 'testProgress',
};

// Default Values
export const DEFAULTS = {
  PAGE_TITLE: 'Exam Platform',
  AVATAR: '/default-avatar.png',
  LANGUAGE: 'en',
  THEME: 'light',
  DATE_FORMAT: 'YYYY-MM-DD',
  TIME_FORMAT: 'HH:mm:ss',
  DATETIME_FORMAT: 'YYYY-MM-DD HH:mm:ss',
};

// Exam Rules
export const EXAM_RULES = [
  'Keep your face visible in the camera at all times',
  'Do not switch tabs or windows during the test',
  'No copy-paste or right-click functionality',
  'No mobile phones or other electronic devices',
  'No other persons should be in the room',
  'Maintain a stable internet connection',
  'Do not refresh the page during the test',
  'Submit the test before the time runs out',
];

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN: 'Logged in successfully!',
  REGISTER: 'Registration successful! Please check your email for verification.',
  LOGOUT: 'Logged out successfully!',
  PASSWORD_CHANGE: 'Password changed successfully!',
  PROFILE_UPDATE: 'Profile updated successfully!',
  TEST_CREATED: 'Test created successfully!',
  TEST_UPDATED: 'Test updated successfully!',
  TEST_DELETED: 'Test deleted successfully!',
  TEST_PUBLISHED: 'Test published successfully!',
  RESULT_ANNOUNCED: 'Results announced successfully!',
  EMAIL_SENT: 'Email sent successfully!',
  APPLICATION_SUBMITTED: 'Application submitted successfully!',
  TEST_SUBMITTED: 'Test submitted successfully!',
  PROGRESS_SAVED: 'Progress saved successfully!',
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK: 'Network error. Please check your internet connection.',
  SERVER: 'Server error. Please try again later.',
  UNAUTHORIZED: 'Please login to continue.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'Resource not found.',
  VALIDATION: 'Please check your input and try again.',
  FILE_TOO_LARGE: 'File size exceeds the maximum limit of 10MB.',
  INVALID_FILE_TYPE: 'Invalid file type. Please upload PDF or Word document.',
  SESSION_EXPIRED: 'Your session has expired. Please login again.',
  TEST_NOT_FOUND: 'Test not found.',
  ALREADY_APPLIED: 'You have already applied for this test.',
  TEST_ALREADY_SUBMITTED: 'You have already submitted this test.',
  TIME_EXPIRED: 'Time has expired for this test.',
};

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    TESTS: '/admin/tests',
    UPLOAD: '/admin/upload',
    AI_GENERATE: '/admin/ai-generate',
    RESULTS: '/admin/results',
    STUDENTS: '/admin/students',
    REPORTS: '/admin/reports',
    SETTINGS: '/admin/settings',
  },
  STUDENT: {
    DASHBOARD: '/student/dashboard',
    TESTS: '/student/tests',
    APPLY: '/student/apply',
    TAKE_TEST: '/student/take-test',
    RESULTS: '/student/results',
    PROFILE: '/student/profile',
    SETTINGS: '/student/settings',
  },
};