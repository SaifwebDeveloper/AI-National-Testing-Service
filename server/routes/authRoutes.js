const express = require('express');
const { body } = require('express-validator');
const { 
  register, 
  login, 
  getMe, 
  updateProfile, 
  changePassword,
  forgotPassword,      // ADD THIS
  resetPassword,       // ADD THIS
  verifyResetToken     // ADD THIS
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const registerValidation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

const loginValidation = [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

const forgotPasswordValidation = [
  body('email').isEmail().withMessage('Please enter a valid email')
];

const resetPasswordValidation = [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

// ====================
// Public Routes
// ====================
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/forgot-password', forgotPasswordValidation, forgotPassword);  // ADD THIS
router.post('/reset-password', resetPasswordValidation, resetPassword);      // ADD THIS
router.get('/verify-reset-token', verifyResetToken);                         // ADD THIS

// ====================
// Protected Routes
// ====================
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);

module.exports = router;