const { body, param, query, validationResult } = require('express-validator');

// Handle validation errors
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }
  next();
};

// User validation rules
const userValidation = {
  register: [
    body('name')
      .notEmpty().withMessage('Name is required')
      .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters')
      .matches(/^[a-zA-Z\s]+$/).withMessage('Name can only contain letters and spaces'),
    
    body('email')
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Please enter a valid email address')
      .normalizeEmail(),
    
    body('password')
      .notEmpty().withMessage('Password is required')
      .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
      .matches(/^(?=.*[A-Za-z])(?=.*\d)/).withMessage('Password must contain at least one letter and one number'),
    
    body('role')
      .optional()
      .isIn(['admin', 'student']).withMessage('Role must be either admin or student'),
    
    body('cnic')
      .optional()
      .matches(/^\d{13}$/).withMessage('CNIC must be 13 digits'),
    
    body('phone')
      .optional()
      .matches(/^\d{11}$/).withMessage('Phone number must be 11 digits')
  ],
  
  login: [
    body('email')
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Please enter a valid email address'),
    
    body('password')
      .notEmpty().withMessage('Password is required'),
    
    body('role')
      .optional()
      .isIn(['admin', 'student']).withMessage('Invalid role')
  ],
  
  updateProfile: [
    body('name')
      .optional()
      .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters')
      .matches(/^[a-zA-Z\s]+$/).withMessage('Name can only contain letters and spaces'),
    
    body('phone')
      .optional()
      .matches(/^\d{11}$/).withMessage('Phone number must be 11 digits'),
    
    body('cnic')
      .optional()
      .matches(/^\d{13}$/).withMessage('CNIC must be 13 digits')
  ],
  
  changePassword: [
    body('currentPassword')
      .notEmpty().withMessage('Current password is required'),
    
    body('newPassword')
      .notEmpty().withMessage('New password is required')
      .isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
      .matches(/^(?=.*[A-Za-z])(?=.*\d)/).withMessage('New password must contain at least one letter and one number')
  ]
};

// Test validation rules
const testValidation = {
  create: [
    body('title')
      .notEmpty().withMessage('Test title is required')
      .isLength({ min: 3, max: 200 }).withMessage('Title must be between 3 and 200 characters'),
    
    body('totalMarks')
      .notEmpty().withMessage('Total marks is required')
      .isInt({ min: 1, max: 1000 }).withMessage('Total marks must be between 1 and 1000'),
    
    body('passingMarks')
      .notEmpty().withMessage('Passing marks is required')
      .isInt({ min: 0 }).withMessage('Passing marks must be a positive number')
      .custom((value, { req }) => value <= req.body.totalMarks)
      .withMessage('Passing marks cannot exceed total marks'),
    
    body('duration')
      .notEmpty().withMessage('Duration is required')
      .isInt({ min: 1, max: 360 }).withMessage('Duration must be between 1 and 360 minutes'),
    
    body('startDate')
      .notEmpty().withMessage('Start date is required')
      .isISO8601().withMessage('Invalid date format')
      .custom(value => new Date(value) > new Date())
      .withMessage('Start date must be in the future'),
    
    body('endDate')
      .notEmpty().withMessage('End date is required')
      .isISO8601().withMessage('Invalid date format')
      .custom((value, { req }) => new Date(value) > new Date(req.body.startDate))
      .withMessage('End date must be after start date')
  ],
  
  update: [
    body('title')
      .optional()
      .isLength({ min: 3, max: 200 }).withMessage('Title must be between 3 and 200 characters'),
    
    body('totalMarks')
      .optional()
      .isInt({ min: 1, max: 1000 }).withMessage('Total marks must be between 1 and 1000'),
    
    body('duration')
      .optional()
      .isInt({ min: 1, max: 360 }).withMessage('Duration must be between 1 and 360 minutes')
  ],
  
  question: [
    body('text')
      .notEmpty().withMessage('Question text is required')
      .isLength({ min: 5, max: 1000 }).withMessage('Question must be between 5 and 1000 characters'),
    
    body('options')
      .isArray({ min: 2, max: 6 }).withMessage('Options must have between 2 and 6 choices'),
    
    body('correctAnswer')
      .notEmpty().withMessage('Correct answer is required')
      .isInt({ min: 0 }).withMessage('Invalid correct answer index'),
    
    body('marks')
      .notEmpty().withMessage('Marks are required')
      .isInt({ min: 1, max: 100 }).withMessage('Marks must be between 1 and 100')
  ]
};

// Application validation
const applicationValidation = {
  apply: [
    body('cnic')
      .optional()
      .matches(/^\d{13}$/).withMessage('CNIC must be 13 digits'),
    
    body('education')
      .optional()
      .isLength({ max: 500 }).withMessage('Education info too long')
  ]
};

// ID parameter validation
const idValidation = [
  param('id')
    .notEmpty().withMessage('ID is required')
    .isMongoId().withMessage('Invalid ID format')
];

// Pagination validation
const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer')
    .toInt(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
    .toInt()
];

// Date range validation
const dateRangeValidation = [
  query('startDate')
    .optional()
    .isISO8601().withMessage('Invalid start date format'),
  
  query('endDate')
    .optional()
    .isISO8601().withMessage('Invalid end date format')
    .custom((value, { req }) => {
      if (req.query.startDate && new Date(value) <= new Date(req.query.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    })
];

module.exports = {
  validate,
  userValidation,
  testValidation,
  applicationValidation,
  idValidation,
  paginationValidation,
  dateRangeValidation
};