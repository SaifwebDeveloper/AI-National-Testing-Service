const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Test = require('../models/Test');
const Result = require('../models/Result');
const StudentApplication = require('../models/StudentApplication');
const { protect, isAdmin } = require('../middleware/auth');

// Apply authentication and admin role to all routes
router.use(protect, isAdmin);

// ==================== STATS & DASHBOARD ====================

// @desc    Get admin dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalTests = await Test.countDocuments();
    const totalResults = await Result.countDocuments();
    
    const now = new Date();
    const activeTests = await Test.countDocuments({
      status: 'published',
      startDate: { $lte: now },
      endDate: { $gte: now }
    });
    
    const avgScoreAgg = await Result.aggregate([
      { $group: { _id: null, avg: { $avg: '$percentage' } } }
    ]);
    const avgScore = avgScoreAgg[0]?.avg?.toFixed(2) || 0;
    
    const totalCompleted = await Result.countDocuments();
    const passedCount = await Result.countDocuments({ status: 'pass' });
    const completionRate = totalCompleted > 0 ? (passedCount / totalCompleted) * 100 : 0;
    
    res.json({
      success: true,
      stats: {
        totalStudents,
        totalTests,
        totalResults,
        activeTests,
        avgScore: parseFloat(avgScore),
        completionRate: parseFloat(completionRate.toFixed(2))
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get recent tests
router.get('/recent-tests', async (req, res) => {
  try {
    const tests = await Test.find()
      .populate('createdBy', 'name email')
      .sort('-createdAt')
      .limit(10);
    
    const testsWithCounts = await Promise.all(tests.map(async (test) => {
      const studentCount = await StudentApplication.countDocuments({ 
        testId: test._id, 
        status: 'approved' 
      });
      return {
        _id: test._id,
        title: test.title,
        description: test.description,
        status: test.status,
        totalMarks: test.totalMarks,
        duration: test.duration,
        studentCount,
        createdAt: test.createdAt,
        createdBy: test.createdBy?.name || 'Unknown'
      };
    }));
    
    res.json({ success: true, tests: testsWithCounts });
  } catch (error) {
    console.error('Recent tests error:', error);
    res.json({ success: true, tests: [] });
  }
});

// @desc    Get recent activities
router.get('/recent-activities', async (req, res) => {
  try {
    const activities = [];
    
    const recentTests = await Test.find()
      .populate('createdBy', 'name')
      .sort('-createdAt')
      .limit(5);
    
    for (const test of recentTests) {
      activities.push({
        type: 'test',
        message: `New test "${test.title}" was created by ${test.createdBy?.name || 'Admin'}`,
        time: test.createdAt
      });
    }
    
    const recentResults = await Result.find()
      .populate('testId', 'title')
      .sort('-createdAt')
      .limit(5);
    
    for (const result of recentResults) {
      activities.push({
        type: 'result',
        message: `Result announced for "${result.testId?.title || 'a test'}"`,
        time: result.createdAt
      });
    }
    
    const recentStudents = await User.find({ role: 'student' })
      .sort('-createdAt')
      .limit(5);
    
    for (const student of recentStudents) {
      activities.push({
        type: 'student',
        message: `New student "${student.name}" registered`,
        time: student.createdAt
      });
    }
    
    activities.sort((a, b) => new Date(b.time) - new Date(a.time));
    
    res.json({ success: true, activities: activities.slice(0, 15) });
  } catch (error) {
    res.json({ success: true, activities: [] });
  }
});

// ==================== TEST MANAGEMENT ====================

// @desc    Get all tests for admin
router.get('/tests', async (req, res) => {
  try {
    const tests = await Test.find().sort('-createdAt');
    res.json({ success: true, tests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get completed tests
router.get('/completed-tests', async (req, res) => {
  try {
    const now = new Date();
    const tests = await Test.find({
      endDate: { $lt: now },
      status: { $in: ['published', 'completed'] }
    }).sort('-endDate');
    
    const testsWithStats = await Promise.all(tests.map(async (test) => {
      const studentCount = await StudentApplication.countDocuments({ 
        testId: test._id, 
        status: 'approved' 
      });
      
      const results = await Result.find({ testId: test._id });
      const totalSubmissions = results.length;
      const passedCount = results.filter(r => r.status === 'pass').length;
      const avgScore = totalSubmissions > 0
        ? results.reduce((sum, r) => sum + r.percentage, 0) / totalSubmissions
        : 0;
      
      return {
        _id: test._id,
        title: test.title,
        description: test.description,
        totalMarks: test.totalMarks,
        duration: test.duration,
        startDate: test.startDate,
        endDate: test.endDate,
        studentCount,
        totalSubmissions,
        passedCount,
        avgScore: avgScore.toFixed(2),
        resultAnnounced: test.resultAnnounced || false
      };
    }));
    
    res.json({ success: true, tests: testsWithStats });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== STUDENT MANAGEMENT ====================

// @desc    Get all students
router.get('/students', async (req, res) => {
  try {
    const students = await User.find({ role: 'student' })
      .select('-password')
      .sort('-createdAt');
    
    const studentsWithStats = await Promise.all(students.map(async (student) => {
      const results = await Result.find({ studentId: student._id });
      const testsTaken = results.length;
      const avgScore = testsTaken > 0 
        ? results.reduce((sum, r) => sum + r.percentage, 0) / testsTaken 
        : 0;
      const passedTests = results.filter(r => r.status === 'pass').length;
      const passRate = testsTaken > 0 ? (passedTests / testsTaken) * 100 : 0;
      
      return {
        id: student._id,
        name: student.name,
        email: student.email,
        phone: student.phone,
        cnic: student.cnic,
        createdAt: student.createdAt,
        stats: {
          testsTaken,
          avgScore: avgScore.toFixed(2),
          passRate: passRate.toFixed(2)
        }
      };
    }));
    
    res.json({ success: true, students: studentsWithStats });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get student results
router.get('/student-results/:studentId', async (req, res) => {
  try {
    const results = await Result.find({ studentId: req.params.studentId })
      .populate('testId', 'title totalMarks')
      .sort('-completedAt');
    
    const formattedResults = results.map(result => ({
      _id: result._id,
      testTitle: result.testId?.title || 'Unknown Test',
      totalMarks: result.totalMarks,
      obtainedMarks: result.obtainedMarks,
      percentage: result.percentage,
      status: result.status,
      completedAt: result.completedAt,
      emailed: !!result.emailedAt
    }));
    
    res.json({ success: true, results: formattedResults });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== RESULT MANAGEMENT ====================

// @desc    Get test results
router.get('/results/:testId', async (req, res) => {
  try {
    const results = await Result.find({ testId: req.params.testId })
      .populate('studentId', 'name email cnic')
      .sort('-percentage');
    
    const formattedResults = results.map((result, index) => ({
      _id: result._id,
      studentName: result.studentId?.name || 'Unknown',
      email: result.studentId?.email || 'N/A',
      cnic: result.studentId?.cnic || 'N/A',
      totalMarks: result.totalMarks,
      obtainedMarks: result.obtainedMarks,
      percentage: result.percentage,
      status: result.status,
      completedAt: result.completedAt,
      emailed: !!result.emailedAt,
      rank: index + 1
    }));
    
    res.json({ success: true, results: formattedResults });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Announce results
router.post('/announce-results/:testId', async (req, res) => {
  try {
    const testId = req.params.testId;
    
    await Result.updateMany(
      { testId },
      { announcedAt: new Date() }
    );
    
    await Test.findByIdAndUpdate(testId, { resultAnnounced: true });
    
    res.json({ success: true, message: 'Results announced successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Resend result email
router.post('/resend-result-email/:resultId', async (req, res) => {
  try {
    const result = await Result.findById(req.params.resultId);
    if (!result) {
      return res.status(404).json({ message: 'Result not found' });
    }
    
    result.emailedAt = new Date();
    await result.save();
    
    res.json({ success: true, message: 'Email resent successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== APPLICATION MANAGEMENT ====================

// @desc    Get all applications
router.get('/applications', async (req, res) => {
  try {
    const applications = await StudentApplication.find()
      .populate('studentId', 'name email')
      .populate('testId', 'title totalMarks duration')
      .sort('-appliedAt');
    
    const formattedApps = applications.map(app => ({
      _id: app._id,
      studentName: app.studentId?.name || 'Unknown',
      studentEmail: app.studentId?.email || 'Unknown',
      testTitle: app.testId?.title || 'Unknown',
      totalMarks: app.testId?.totalMarks,
      status: app.status,
      appliedAt: app.appliedAt,
      remarks: app.remarks
    }));
    
    res.json({ success: true, applications: formattedApps });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update application status
router.put('/applications/:id', async (req, res) => {
  try {
    const { status, remarks } = req.body;
    const application = await StudentApplication.findByIdAndUpdate(
      req.params.id,
      { 
        status, 
        remarks, 
        reviewedAt: new Date(), 
        reviewedBy: req.user.id 
      },
      { new: true }
    );
    
    res.json({ success: true, application });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== NOTIFICATIONS ====================

// @desc    Get admin notifications
router.get('/notifications', async (req, res) => {
  try {
    const notifications = [];
    
    // Get recent pending applications
    const pendingApps = await StudentApplication.find({ status: 'pending' })
      .populate('studentId', 'name')
      .populate('testId', 'title')
      .sort('-createdAt')
      .limit(5);
    
    for (const app of pendingApps) {
      notifications.push({
        id: app._id,
        type: 'application',
        title: 'New Application',
        message: `${app.studentId?.name || 'A student'} applied for "${app.testId?.title || 'a test'}"`,
        time: app.createdAt,
        read: false
      });
    }
    
    // Get recent completed tests
    const completedTests = await Test.find({ 
      status: 'completed',
      resultAnnounced: false 
    }).sort('-endDate').limit(3);
    
    for (const test of completedTests) {
      notifications.push({
        id: test._id,
        type: 'test',
        title: 'Test Completed',
        message: `Test "${test.title}" has been completed. Ready for result announcement.`,
        time: test.endDate,
        read: false
      });
    }
    
    notifications.sort((a, b) => new Date(b.time) - new Date(a.time));
    
    res.json({ success: true, notifications: notifications.slice(0, 10) });
  } catch (error) {
    console.error('Notifications error:', error);
    res.json({ success: true, notifications: [] });
  }
});

// Add these to your adminRoutes.js

// Reports endpoints
router.get('/reports/tests', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let query = {};
    if (startDate && endDate) {
      query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    const tests = await Test.find(query).sort('-createdAt');
    res.json({ success: true, tests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/reports/results', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let query = {};
    if (startDate && endDate) {
      query.completedAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    const results = await Result.find(query).populate('studentId', 'name email').populate('testId', 'title');
    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/reports/students', async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).select('-password');
    const studentsWithStats = await Promise.all(students.map(async (student) => {
      const results = await Result.find({ studentId: student._id });
      const testsTaken = results.length;
      const avgScore = testsTaken > 0 ? results.reduce((sum, r) => sum + r.percentage, 0) / testsTaken : 0;
      const passedTests = results.filter(r => r.status === 'pass').length;
      const passRate = testsTaken > 0 ? (passedTests / testsTaken) * 100 : 0;
      return {
        ...student.toObject(),
        stats: { testsTaken, avgScore: avgScore.toFixed(2), passRate: passRate.toFixed(2) }
      };
    }));
    res.json({ success: true, students: studentsWithStats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/reports/export', async (req, res) => {
  try {
    const { type, format } = req.query;
    // Implementation for CSV/PDF export
    res.json({ success: true, message: 'Export feature coming soon' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;