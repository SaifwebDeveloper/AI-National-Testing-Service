// User roles
const USER_ROLES = {
  ADMIN: 'admin',
  STUDENT: 'student'
};

// Test statuses
const TEST_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ONGOING: 'ongoing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

// Application statuses
const APPLICATION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

// Result statuses
const RESULT_STATUS = {
  PASS: 'pass',
  FAIL: 'fail',
  PENDING: 'pending'
};

// Question types
const QUESTION_TYPES = {
  MCQ: 'mcq',
  TRUE_FALSE: 'true_false',
  SHORT_ANSWER: 'short_answer',
  LONG_ANSWER: 'long_answer',
  FILL_BLANKS: 'fill_blanks',
  MATCHING: 'matching'
};

// Difficulty levels
const DIFFICULTY_LEVELS = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
  EXPERT: 'expert'
};

// Cheating violation types
const CHEATING_TYPES = {
  TAB_SWITCH: 'tab_switch',
  COPY_PASTE: 'copy_paste',
  RIGHT_CLICK: 'right_click',
  KEYBOARD_SHORTCUT: 'keyboard_shortcut',
  MULTIPLE_PERSONS: 'multiple_persons',
  PHONE_DETECTED: 'phone_detected',
  FACE_NOT_VISIBLE: 'face_not_visible',
  LOOKING_AWAY: 'looking_away',
  FULLSCREEN_EXIT: 'fullscreen_exit',
  DEVTOOLS: 'devtools'
};

// Cheating severity levels
const CHEATING_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

// Cheating penalties (in seconds)
const CHEATING_PENALTIES = {
  FIRST_WARNING: 0,
  SECOND_WARNING: 30,
  THIRD_WARNING: 60,
  MAX_WARNINGS: 3
};

// HTTP status codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

// Response messages
const RESPONSE_MESSAGES = {
  // Success messages
  LOGIN_SUCCESS: 'Login successful',
  REGISTER_SUCCESS: 'Registration successful',
  LOGOUT_SUCCESS: 'Logout successful',
  PROFILE_UPDATED: 'Profile updated successfully',
  PASSWORD_CHANGED: 'Password changed successfully',
  TEST_CREATED: 'Test created successfully',
  TEST_UPDATED: 'Test updated successfully',
  TEST_DELETED: 'Test deleted successfully',
  TEST_PUBLISHED: 'Test published successfully',
  RESULT_ANNOUNCED: 'Results announced successfully',
  APPLICATION_SUBMITTED: 'Application submitted successfully',
  TEST_SUBMITTED: 'Test submitted successfully',
  
  // Error messages
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  NOT_FOUND: 'Resource not found',
  SERVER_ERROR: 'Internal server error',
  VALIDATION_ERROR: 'Validation error',
  DUPLICATE_ENTRY: 'Duplicate entry',
  INVALID_CREDENTIALS: 'Invalid credentials',
  TOKEN_EXPIRED: 'Token expired',
  TOKEN_INVALID: 'Invalid token',
  SESSION_EXPIRED: 'Session expired'
};

// Pagination defaults
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
  SORT_ORDER: {
    ASC: 'asc',
    DESC: 'desc'
  }
};

// File upload limits
const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_DOC_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  MAX_FILES: 5
};

// Token expiry times (in seconds)
const TOKEN_EXPIRY = {
  ACCESS_TOKEN: 30 * 24 * 60 * 60, // 30 days
  REFRESH_TOKEN: 7 * 24 * 60 * 60, // 7 days
  EMAIL_VERIFICATION: 24 * 60 * 60, // 24 hours
  PASSWORD_RESET: 1 * 60 * 60, // 1 hour
  SESSION: 30 * 60 // 30 minutes
};

// Cache durations (in seconds)
const CACHE_DURATION = {
  STATIC: 24 * 60 * 60, // 24 hours
  DYNAMIC: 5 * 60, // 5 minutes
  USER_SESSION: 30 * 60 // 30 minutes
};

// Rate limiting defaults
const RATE_LIMIT = {
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: 100,
  SKIP_SUCCESSFUL: false
};

// Grade ranges
const GRADE_RANGES = {
  'A+': { min: 90, max: 100, gpa: 4.0 },
  'A': { min: 80, max: 89, gpa: 3.7 },
  'B+': { min: 75, max: 79, gpa: 3.3 },
  'B': { min: 70, max: 74, gpa: 3.0 },
  'C+': { min: 65, max: 69, gpa: 2.7 },
  'C': { min: 60, max: 64, gpa: 2.3 },
  'D': { min: 50, max: 59, gpa: 2.0 },
  'F': { min: 0, max: 49, gpa: 0.0 }
};

// API endpoints
const API_ENDPOINTS = {
  AUTH: '/api/auth',
  TESTS: '/api/tests',
  RESULTS: '/api/results',
  STUDENTS: '/api/students',
  ADMIN: '/api/admin',
  HEALTH: '/api/health',
  INFO: '/api/info'
};

// Database collection names
const COLLECTIONS = {
  USERS: 'users',
  TESTS: 'tests',
  QUESTIONS: 'questions',
  RESULTS: 'results',
  APPLICATIONS: 'studentapplications',
  SESSIONS: 'testsessions',
  CHEATING_LOGS: 'cheatinglogs'
};

// Socket events
const SOCKET_EVENTS = {
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  JOIN_TEST: 'join-test',
  CHEATING_ALERT: 'cheating-alert',
  CHEATING_DETECTED: 'cheating-detected',
  TEST_TERMINATED: 'test-terminated',
  PROGRESS_UPDATE: 'progress-update'
};

// Environment variables
const ENV = {
  DEVELOPMENT: 'development',
  STAGING: 'staging',
  PRODUCTION: 'production'
};

// Default admin credentials (for initial setup)
const DEFAULT_ADMIN = {
  name: 'System Administrator',
  email: 'admin@examplatform.com',
  password: 'Admin@123',
  role: USER_ROLES.ADMIN
};

module.exports = {
  USER_ROLES,
  TEST_STATUS,
  APPLICATION_STATUS,
  RESULT_STATUS,
  QUESTION_TYPES,
  DIFFICULTY_LEVELS,
  CHEATING_TYPES,
  CHEATING_SEVERITY,
  CHEATING_PENALTIES,
  HTTP_STATUS,
  RESPONSE_MESSAGES,
  PAGINATION,
  FILE_UPLOAD,
  TOKEN_EXPIRY,
  CACHE_DURATION,
  RATE_LIMIT,
  GRADE_RANGES,
  API_ENDPOINTS,
  COLLECTIONS,
  SOCKET_EVENTS,
  ENV,
  DEFAULT_ADMIN
};