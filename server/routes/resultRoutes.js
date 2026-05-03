const express = require('express');
const { param } = require('express-validator');
const {
  getMyResults,
  getResultById,
  getTestResults,
  announceResults,
  getStatistics,
  exportResults,
  getTopPerformers,
  getPerformanceTrend
} = require('../controllers/resultController');
const { protect, isAdmin, isStudent } = require('../middleware/auth');  // Fixed: changed from authMiddleware to auth
const { validate } = require('../middleware/validation');

const router = express.Router();

// Validation for ID parameter
const idValidation = [
  param('id')
    .notEmpty().withMessage('ID is required')
    .isMongoId().withMessage('Invalid ID format')
];

const testIdValidation = [
  param('testId')
    .notEmpty().withMessage('Test ID is required')
    .isMongoId().withMessage('Invalid test ID format')
];

// Student routes
router.get('/my-results', protect, isStudent, getMyResults);
router.get('/:id', protect, idValidation, validate, getResultById);

// Debug route - add this temporarily to test
router.get('/debug/:id', async (req, res) => {
  try {
    const Result = require('../models/Result');
    const result = await Result.findById(req.params.id);
    res.json({
      fromDatabase: {
        id: result?._id,
        totalMarks: result?.totalMarks,
        obtainedMarks: result?.obtainedMarks,
        percentage: result?.percentage,
        status: result?.status
      }
    });
  } catch (error) {
    res.json({ error: error.message });
  }
});

// Admin routes
router.get('/test/:testId', protect, isAdmin, testIdValidation, validate, getTestResults);
router.post('/announce/:testId', protect, isAdmin, testIdValidation, validate, announceResults);
router.get('/statistics/:testId', protect, isAdmin, testIdValidation, validate, getStatistics);
router.get('/export/:testId', protect, isAdmin, testIdValidation, validate, exportResults);
router.get('/top-performers', protect, isAdmin, getTopPerformers);
router.get('/trend/:studentId', protect, getPerformanceTrend);

module.exports = router;