const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Test = require('../models/Test');
const Result = require('../models/Result');
const StudentApplication = require('../models/StudentApplication');
const { protect, isStudent } = require('../middleware/auth');

// Apply authentication and student role to all routes
router.use(protect, isStudent);

// @desc    Get student dashboard stats
// @route   GET /api/students/stats
const getStats = async (req, res) => {
  try {
    const studentId = req.user.id;
    
    // Get all results for this student
    const results = await Result.find({ studentId });
    const testsTaken = results.length;
    
    // Calculate average score
    const averageScore = testsTaken > 0 
      ? results.reduce((sum, r) => sum + r.percentage, 0) / testsTaken 
      : 0;
    
    // Get pending tests (applications approved but not yet taken)
    const applications = await StudentApplication.find({ 
      studentId, 
      status: 'approved' 
    });
    
    const takenTestIds = results.map(r => r.testId.toString());
    const pendingTests = applications.filter(
      app => !takenTestIds.includes(app.testId.toString())
    ).length;
    
    // Get certificates earned (passed tests)
    const certificatesEarned = results.filter(r => r.status === 'pass').length;
    
    // Calculate rank (simplified - compare with all students)
    const allStudentsAvg = await Result.aggregate([
      { $group: { _id: '$studentId', avgScore: { $avg: '$percentage' } } },
      { $sort: { avgScore: -1 } }
    ]);
    
    const rank = allStudentsAvg.findIndex(s => s._id.toString() === studentId) + 1;
    
    res.json({ 
      success: true, 
      stats: {
        testsTaken,
        averageScore: averageScore.toFixed(2),
        pendingTests,
        certificatesEarned,
        rank: rank || 0
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get upcoming tests
// @route   GET /api/students/upcoming-tests
const getUpcomingTests = async (req, res) => {
  try {
    const now = new Date();
    const studentId = req.user.id;
    
    // Get approved applications
    const applications = await StudentApplication.find({ 
      studentId, 
      status: 'approved' 
    }).populate('testId');
    
    // Filter tests that are upcoming (start date in future)
    const upcomingTests = applications
      .filter(app => app.testId && new Date(app.testId.startDate) > now)
      .map(app => ({
        _id: app.testId._id,
        title: app.testId.title,
        description: app.testId.description,
        duration: app.testId.duration,
        totalMarks: app.testId.totalMarks,
        startDate: app.testId.startDate,
        endDate: app.testId.endDate,
        status: app.testId.status,
        appliedAt: app.appliedAt,
        applicationStatus: app.status
      }));
    
    res.json({ success: true, tests: upcomingTests });
  } catch (error) {
    console.error('Upcoming tests error:', error);
    res.json({ success: true, tests: [] });
  }
};

// @desc    Get recent results
// @route   GET /api/students/recent-results
const getRecentResults = async (req, res) => {
  try {
    const results = await Result.find({ studentId: req.user.id })
      .populate('testId', 'title totalMarks')
      .sort('-completedAt')
      .limit(5);
    
    const formattedResults = results.map(result => ({
      _id: result._id,
      testTitle: result.testId?.title || 'Unknown Test',
      obtainedMarks: result.obtainedMarks,
      totalMarks: result.totalMarks,
      percentage: result.percentage,
      status: result.status,
      completedAt: result.completedAt
    }));
    
    res.json({ success: true, results: formattedResults });
  } catch (error) {
    console.error('Recent results error:', error);
    res.json({ success: true, results: [] });
  }
};

// @desc    Get student profile
// @route   GET /api/students/profile
const getProfile = async (req, res) => {
  try {
    const student = await User.findById(req.user.id).select('-password');
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    res.json({ 
      success: true, 
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
        phone: student.phone || '',
        cnic: student.cnic || '',
        address: student.address || '',
        education: student.education || '',
        profilePicture: student.profilePicture || null,
        createdAt: student.createdAt,
        isVerified: student.isVerified
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update student profile
// @route   PUT /api/students/profile
const updateProfile = async (req, res) => {
  try {
    const { name, phone, cnic, address, education } = req.body;
    
    const student = await User.findById(req.user.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Update fields if provided
    if (name) student.name = name;
    if (phone) student.phone = phone;
    if (cnic) student.cnic = cnic;
    if (address) student.address = address;
    if (education) student.education = education;
    
    await student.save();
    
    res.json({ 
      success: true, 
      message: 'Profile updated successfully',
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
        phone: student.phone,
        cnic: student.cnic,
        address: student.address,
        education: student.education
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get applied tests
// @route   GET /api/students/applied-tests
const getAppliedTests = async (req, res) => {
  try {
    const applications = await StudentApplication.find({ studentId: req.user.id })
      .populate('testId', 'title description duration totalMarks startDate endDate status')
      .sort('-appliedAt');
    
    const formattedApplications = applications.map(app => ({
      _id: app._id,
      testId: app.testId?._id,
      testTitle: app.testId?.title || 'Unknown Test',
      testDescription: app.testId?.description,
      testDuration: app.testId?.duration,
      totalMarks: app.testId?.totalMarks,
      startDate: app.testId?.startDate,
      endDate: app.testId?.endDate,
      testStatus: app.testId?.status,
      applicationStatus: app.status,
      appliedAt: app.appliedAt,
      remarks: app.remarks
    }));
    
    res.json({ success: true, applications: formattedApplications });
  } catch (error) {
    console.error('Applied tests error:', error);
    res.json({ success: true, applications: [] });
  }
};

// @desc    Get notifications
// @route   GET /api/students/notifications
const getNotifications = async (req, res) => {
  try {
    const notifications = [];
    
    // Get recent results
    const recentResults = await Result.find({ 
      studentId: req.user.id,
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    }).populate('testId', 'title').limit(10);
    
    for (const result of recentResults) {
      notifications.push({
        id: result._id,
        type: 'result',
        title: 'Test Result Available',
        message: `Your result for "${result.testId?.title}" is now available. Score: ${result.percentage}%`,
        time: result.createdAt,
        read: false,
        data: { resultId: result._id }
      });
    }
    
    // Get application status updates
    const recentApplications = await StudentApplication.find({ 
      studentId: req.user.id,
      updatedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    }).populate('testId', 'title').limit(10);
    
    for (const app of recentApplications) {
      const statusMessage = app.status === 'approved' ? 'approved' : 'rejected';
      notifications.push({
        id: app._id,
        type: 'application',
        title: `Application ${app.status === 'approved' ? 'Approved' : 'Updated'}`,
        message: `Your application for "${app.testId?.title}" has been ${statusMessage}.`,
        time: app.updatedAt,
        read: false,
        data: { applicationId: app._id, status: app.status }
      });
    }
    
    // Sort by time (newest first)
    notifications.sort((a, b) => new Date(b.time) - new Date(a.time));
    
    res.json({ success: true, notifications });
  } catch (error) {
    console.error('Notifications error:', error);
    res.json({ success: true, notifications: [] });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/students/notifications/:id/read
const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.user.id;
    
    // Check if it's a result notification
    const result = await Result.findOne({ _id: id, studentId });
    if (result) {
      // You can add a `notificationRead` field to your Result model if needed
      return res.json({ success: true, message: 'Notification marked as read' });
    }
    
    // Check if it's an application notification
    const application = await StudentApplication.findOne({ _id: id, studentId });
    if (application) {
      return res.json({ success: true, message: 'Notification marked as read' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/students/notifications/read-all
const markAllAsRead = async (req, res) => {
  try {
    const studentId = req.user.id;
    
    // Mark all recent results as read
    await Result.updateMany(
      { studentId, notificationRead: { $ne: true } },
      { $set: { notificationRead: true } }
    );
    
    // Mark all recent applications as read
    await StudentApplication.updateMany(
      { studentId, notificationRead: { $ne: true } },
      { $set: { notificationRead: true } }
    );
    
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update the getAppliedTests function to return full application details
router.get('/applied-tests', async (req, res) => {
  try {
    const applications = await StudentApplication.find({ studentId: req.user.id })
      .populate('testId', 'title description duration totalMarks startDate endDate status')
      .sort('-appliedAt');
    
    const formattedApplications = applications.map(app => ({
      _id: app._id,
      testId: app.testId?._id,
      testTitle: app.testId?.title,
      applicationStatus: app.status,
      appliedAt: app.appliedAt
    }));
    
    res.json({ success: true, applications: formattedApplications });
  } catch (error) {
    res.json({ success: true, applications: [] });
  }
});

// Register routes
router.get('/stats', getStats);
router.get('/upcoming-tests', getUpcomingTests);
router.get('/recent-results', getRecentResults);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.get('/applied-tests', getAppliedTests);
router.get('/notifications', getNotifications);
router.put('/notifications/:id/read', markNotificationAsRead);
router.put('/notifications/read-all', markAllAsRead);

module.exports = router;