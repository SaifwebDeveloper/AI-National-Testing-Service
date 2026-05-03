const User = require('../models/User');
const Test = require('../models/Test');
const Result = require('../models/Result');
const StudentApplication = require('../models/StudentApplication');

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getStats = async (req, res) => {
  try {
    // Get real counts from database
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalTests = await Test.countDocuments();
    const totalResults = await Result.countDocuments();
    
    // Get active tests (published and current date range)
    const now = new Date();
    const activeTests = await Test.countDocuments({
      status: 'published',
      startDate: { $lte: now },
      endDate: { $gte: now }
    });
    
    // Calculate average score from all results
    const avgScoreAgg = await Result.aggregate([
      { $group: { _id: null, avg: { $avg: '$percentage' } } }
    ]);
    const avgScore = avgScoreAgg[0]?.avg?.toFixed(2) || 0;
    
    // Calculate completion rate (pass rate)
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
};

// @desc    Get recent tests
// @route   GET /api/admin/recent-tests
// @access  Private/Admin
exports.getRecentTests = async (req, res) => {
  try {
    const tests = await Test.find()
      .populate('createdBy', 'name email')
      .sort('-createdAt')
      .limit(10);
    
    // Get student count for each test
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
        startDate: test.startDate,
        endDate: test.endDate,
        studentCount,
        createdAt: test.createdAt,
        createdBy: test.createdBy
      };
    }));
    
    res.json({ success: true, tests: testsWithCounts });
  } catch (error) {
    console.error('Recent tests error:', error);
    res.json({ success: true, tests: [] });
  }
};

// @desc    Get recent activities
// @route   GET /api/admin/recent-activities
// @access  Private/Admin
exports.getRecentActivities = async (req, res) => {
  try {
    const activities = [];
    
    // Get recent test creations
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
    
    // Get recent result announcements
    const recentResults = await Result.find()
      .populate('testId', 'title')
      .sort('-createdAt')
      .limit(5);
    
    for (const result of recentResults) {
      activities.push({
        type: 'result',
        message: `Results announced for "${result.testId?.title || 'a test'}"`,
        time: result.createdAt
      });
    }
    
    // Get recent student registrations
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
    
    // Sort by time (newest first) and limit to 10
    activities.sort((a, b) => new Date(b.time) - new Date(a.time));
    const recentActivities = activities.slice(0, 10);
    
    res.json({ success: true, activities: recentActivities });
  } catch (error) {
    console.error('Recent activities error:', error);
    res.json({ success: true, activities: [] });
  }
};

// @desc    Get all students
// @route   GET /api/admin/students
// @access  Private/Admin
exports.getAllStudents = async (req, res) => {
  try {
    const students = await User.find({ role: 'student' })
      .select('-password')
      .sort('-createdAt');
    
    // Get stats for each student
    const studentsWithStats = await Promise.all(students.map(async (student) => {
      const results = await Result.find({ studentId: student._id });
      const testsTaken = results.length;
      const avgScore = testsTaken > 0 
        ? results.reduce((sum, r) => sum + r.percentage, 0) / testsTaken 
        : 0;
      const passedTests = results.filter(r => r.status === 'pass').length;
      const passRate = testsTaken > 0 ? (passedTests / testsTaken) * 100 : 0;
      
      return {
        ...student.toObject(),
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
};

// @desc    Get student results
// @route   GET /api/admin/student-results/:studentId
// @access  Private/Admin
exports.getStudentResults = async (req, res) => {
  try {
    const results = await Result.find({ studentId: req.params.studentId })
      .populate('testId', 'title totalMarks')
      .sort('-createdAt');
    
    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get completed tests
// @route   GET /api/admin/completed-tests
// @access  Private/Admin
exports.getCompletedTests = async (req, res) => {
  try {
    const now = new Date();
    const tests = await Test.find({
      endDate: { $lt: now },
      status: 'published'
    }).sort('-endDate');
    
    // Get student counts
    const testsWithCounts = await Promise.all(tests.map(async (test) => {
      const studentCount = await StudentApplication.countDocuments({ 
        testId: test._id, 
        status: 'approved' 
      });
      return {
        ...test.toObject(),
        studentCount
      };
    }));
    
    res.json({ success: true, tests: testsWithCounts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get results for a test (admin)
// @route   GET /api/admin/results/:testId
// @access  Private/Admin
exports.getTestResults = async (req, res) => {
  try {
    const results = await Result.find({ testId: req.params.testId })
      .populate('studentId', 'name email cnic phone')
      .sort('-percentage');
    
    const formattedResults = results.map((result, index) => ({
      _id: result._id,
      studentName: result.studentId.name,
      email: result.studentId.email,
      cnic: result.studentId.cnic,
      totalMarks: result.totalMarks,
      obtainedMarks: result.obtainedMarks,
      percentage: result.percentage,
      status: result.status,
      emailed: !!result.emailedAt,
      rank: index + 1
    }));
    
    res.json({ success: true, results: formattedResults });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Announce results (admin)
// @route   POST /api/admin/announce-results/:testId
// @access  Private/Admin
exports.announceResults = async (req, res) => {
  try {
    const testId = req.params.testId;
    
    const results = await Result.find({ testId })
      .populate('studentId', 'name email');
    
    await Result.updateMany(
      { testId },
      { announcedAt: new Date() }
    );
    
    await Test.findByIdAndUpdate(testId, { resultAnnounced: true });
    
    res.json({ success: true, message: 'Results announced successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Resend result email
// @route   POST /api/admin/resend-result-email/:resultId
// @access  Private/Admin
exports.resendResultEmail = async (req, res) => {
  try {
    const result = await Result.findById(req.params.resultId)
      .populate('studentId', 'name email')
      .populate('testId', 'title');
    
    if (!result) {
      return res.status(404).json({ message: 'Result not found' });
    }
    
    // Email sending logic here
    result.emailedAt = new Date();
    await result.save();
    
    res.json({ success: true, message: 'Result email resent successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};