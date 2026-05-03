const express = require('express');
const { body, param } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
  createTest,
  getAllTests,
  getTestById,
  updateTest,
  deleteTest,
  publishTest,
  getAvailableTests,
  applyForTest,
  startTest,
  submitTest,
  saveProgress,
  uploadTest,
  extractQuestions,
  uploadTestWithQuestions,
  logCheating  // ADD THIS LINE - import logCheating
} = require('../controllers/testController');
const { protect, isAdmin, isStudent } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

// Debug: Check which functions are defined
console.log('=== TEST CONTROLLER FUNCTIONS CHECK ===');
console.log('createTest:', typeof createTest);
console.log('getAllTests:', typeof getAllTests);
console.log('getTestById:', typeof getTestById);
console.log('updateTest:', typeof updateTest);
console.log('deleteTest:', typeof deleteTest);
console.log('publishTest:', typeof publishTest);
console.log('getAvailableTests:', typeof getAvailableTests);
console.log('applyForTest:', typeof applyForTest);
console.log('startTest:', typeof startTest);
console.log('submitTest:', typeof submitTest);
console.log('saveProgress:', typeof saveProgress);
console.log('uploadTest:', typeof uploadTest);
console.log('extractQuestions:', typeof extractQuestions);
console.log('uploadTestWithQuestions:', typeof uploadTestWithQuestions);
console.log('logCheating:', typeof logCheating);  // ADD THIS
console.log('======================================');

const router = express.Router();

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads/tests');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'test-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF and Word documents are allowed'), false);
  }
};

const upload = multer({ 
  storage: storage, 
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
});

// Validation rules
const testValidation = [
  body('title').notEmpty().withMessage('Test title is required'),
  body('totalMarks').isInt({ min: 1 }).withMessage('Total marks must be at least 1'),
  body('passingMarks').isInt({ min: 0 }).withMessage('Passing marks must be a positive number'),
  body('duration').isInt({ min: 1 }).withMessage('Duration must be at least 1 minute'),
  body('startDate').isISO8601().withMessage('Invalid start date'),
  body('endDate').isISO8601().withMessage('Invalid end date')
];

const testUpdateValidation = [
  body('title').optional().isLength({ min: 3 }),
  body('totalMarks').optional().isInt({ min: 1 }),
  body('duration').optional().isInt({ min: 1 })
];

const idValidation = [
  param('id').isMongoId().withMessage('Invalid test ID format')
];

// Admin routes
router.post('/', protect, isAdmin, testValidation, validate, createTest);
router.get('/', protect, isAdmin, getAllTests);
router.get('/available', protect, isStudent, getAvailableTests);
router.get('/:id', protect, idValidation, validate, getTestById);
router.put('/:id', protect, isAdmin, idValidation, validate, testUpdateValidation, validate, updateTest);
router.delete('/:id', protect, isAdmin, idValidation, validate, deleteTest);
router.put('/:id/publish', protect, isAdmin, idValidation, validate, publishTest);

// Student routes
router.post('/apply/:id', protect, isStudent, idValidation, validate, applyForTest);
router.post('/start/:id', protect, isStudent, idValidation, validate, startTest);
router.post('/submit/:id', protect, isStudent, idValidation, validate, submitTest);
router.post('/save-progress/:id', protect, isStudent, idValidation, validate, saveProgress);
router.post('/cheating-log/:id', protect, isStudent, logCheating);  // This line now works

// File upload routes
router.post('/upload', protect, isAdmin, upload.single('file'), uploadTest);
router.post('/extract-questions', protect, isAdmin, upload.single('file'), extractQuestions);
router.post('/upload-with-questions', protect, isAdmin, upload.single('file'), uploadTestWithQuestions);

// Debug route to check if router is working
router.get('/ping', (req, res) => {
  res.json({ message: 'Test routes are working!' });
});

module.exports = router;