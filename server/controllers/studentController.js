const User = require('../models/User');
const Test = require('../models/Test');
const Result = require('../models/Result');
const StudentApplication = require('../models/StudentApplication');

// @desc    Get student dashboard stats
// @route   GET /api/students/stats
// @access  Private/Student
exports.getStats = async (req, res) => {
  try {
    const studentId = req.user.id;
    
    const testsTaken = await Result.countDocuments({ studentId });
    const results = await Result.find({ studentId });
    const averageScore = results.length > 0 
      ? results.reduce((sum, r) => sum + r.percentage, 0) / results.length 
      : 0;
    
    const applications = await StudentApplication.find({ 
      studentId, 
      status: 'approved' 
    });
    
    const pendingTests = applications.length - testsTaken;
    
    const certificatesEarned = results.filter(r => r.status === 'pass').length;
    
    // Calculate rank among all students
    const allResults = await Result.find();
    const studentTotalScore = results.reduce((sum, r) => sum + r.percentage, 0);
    const higherScores = await Result.aggregate([
      { $group: { _id: '$studentId', total: { $sum: '$percentage' } } },
      { $match: { total: { $gt: studentTotalScore } } }
    ]);
    const rank = higherScores.length + 1;
    
    res.json({
      success: true,
      stats: {
        testsTaken,
        averageScore: averageScore.toFixed(2),
        pendingTests: Math.max(0, pendingTests),
        certificatesEarned,
        rank
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get upcoming tests
// @route   GET /api/students/upcoming-tests
// @access  Private/Student
exports.getUpcomingTests = async (req, res) => {
  try {
    const now = new Date();
    
    // Get approved applications
    const applications = await StudentApplication.find({
      studentId: req.user.id,
      status: 'approved'
    }).populate('testId');
    
    const upcomingTests = applications
      .filter(app => app.testId && new Date(app.testId.startDate) > now)
      .map(app => ({
        ...app.testId.toObject(),
        applicationStatus: app.status,
        appliedAt: app.appliedAt
      }));
    
    res.json({ success: true, tests: upcomingTests });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get recent results
// @route   GET /api/students/recent-results
// @access  Private/Student
exports.getRecentResults = async (req, res) => {
  try {
    const results = await Result.find({ studentId: req.user.id })
      .populate('testId', 'title')
      .sort('-createdAt')
      .limit(5);
    
    const formattedResults = results.map(result => ({
      _id: result._id,
      testTitle: result.testId.title,
      obtainedMarks: result.obtainedMarks,
      totalMarks: result.totalMarks,
      percentage: result.percentage,
      status: result.status,
      completedAt: result.completedAt
    }));
    
    res.json({ success: true, results: formattedResults });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get student profile
// @route   GET /api/students/profile
// @access  Private/Student
exports.getProfile = async (req, res) => {
  try {
    const student = await User.findById(req.user.id).select('-password');
    res.json({ success: true, student });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update student profile
// @route   PUT /api/students/profile
// @access  Private/Student
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, cnic, address, education } = req.body;
    
    const student = await User.findById(req.user.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    if (name) student.name = name;
    if (phone) student.phone = phone;
    if (cnic) student.cnic = cnic;
    
    await student.save();
    
    res.json({
      success: true,
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
        phone: student.phone,
        cnic: student.cnic
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get applied tests
// @route   GET /api/students/applied-tests
// @access  Private/Student
exports.getAppliedTests = async (req, res) => {
  try {
    const applications = await StudentApplication.find({ studentId: req.user.id })
      .populate('testId')
      .sort('-appliedAt');
    
    res.json({ success: true, applications });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get notifications
// @route   GET /api/students/notifications
// @access  Private/Student
exports.getNotifications = async (req, res) => {
  try {
    // Get recent results and application status changes
    const recentResults = await Result.find({ 
      studentId: req.user.id,
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });
    
    const recentApplications = await StudentApplication.find({
      studentId: req.user.id,
      updatedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });
    
    const notifications = [
      ...recentResults.map(r => ({
        message: `Your result for ${r.testId?.title || 'a test'} has been announced. Score: ${r.percentage}%`,
        time: r.createdAt,
        type: 'result'
      })),
      ...recentApplications.map(a => ({
        message: `Your application for ${a.testId?.title || 'a test'} has been ${a.status}`,
        time: a.updatedAt,
        type: 'application'
      }))
    ].sort((a, b) => new Date(b.time) - new Date(a.time));
    
    res.json({ success: true, notifications });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// @desc    Mark notification as read
// @route   PUT /api/students/notifications/:id/read
// @access  Private/Student
// Add these to your studentController.js

// @desc    Mark notification as read
// @route   PUT /api/students/notifications/:id/read
// @access  Private/Student
exports.markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.user.id;
    
    // Check if it's a result notification
    const result = await Result.findOne({ _id: id, studentId });
    if (result) {
      // You can add a `notificationRead` field to Result model
      // For now, we'll just return success
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
// @access  Private/Student
exports.markAllAsRead = async (req, res) => {
  try {
    const studentId = req.user.id;
    
    // In a real implementation, you would update a `read` field
    // For now, return success
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update getNotifications to include read status
exports.getNotifications = async (req, res) => {
  try {
    const notifications = [];
    const studentId = req.user.id;
    
    // Get recent results (last 30 days)
    const recentResults = await Result.find({ 
      studentId,
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    }).populate('testId', 'title').limit(10);
    
    for (const result of recentResults) {
      notifications.push({
        id: result._id,
        type: 'result',
        title: 'Test Result Available',
        message: `Your result for "${result.testId?.title}" is now available. Score: ${result.percentage}%`,
        time: result.createdAt,
        read: result.notificationRead || false
      });
    }
    
    // Get application status updates
    const recentApplications = await StudentApplication.find({ 
      studentId,
      updatedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    }).populate('testId', 'title').limit(10);
    
    for (const app of recentApplications) {
      notifications.push({
        id: app._id,
        type: 'application',
        title: `Application ${app.status === 'approved' ? 'Approved' : 'Updated'}`,
        message: `Your application for "${app.testId?.title}" has been ${app.status}.`,
        time: app.updatedAt,
        read: app.notificationRead || false
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

// @desc    Mark all notifications as read
// @route   PUT /api/students/notifications/read-all
// @access  Private/Student
// Add these to your studentController.js

// @desc    Mark notification as read
// @route   PUT /api/students/notifications/:id/read
// @access  Private/Student
exports.markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.user.id;
    
    // Check if it's a result notification
    const result = await Result.findOne({ _id: id, studentId });
    if (result) {
      // You can add a `notificationRead` field to Result model
      // For now, we'll just return success
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
// @access  Private/Student
exports.markAllAsRead = async (req, res) => {
  try {
    const studentId = req.user.id;
    
    // In a real implementation, you would update a `read` field
    // For now, return success
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update getNotifications to include read status
exports.getNotifications = async (req, res) => {
  try {
    const notifications = [];
    const studentId = req.user.id;
    
    // Get recent results (last 30 days)
    const recentResults = await Result.find({ 
      studentId,
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    }).populate('testId', 'title').limit(10);
    
    for (const result of recentResults) {
      notifications.push({
        id: result._id,
        type: 'result',
        title: 'Test Result Available',
        message: `Your result for "${result.testId?.title}" is now available. Score: ${result.percentage}%`,
        time: result.createdAt,
        read: result.notificationRead || false
      });
    }
    
    // Get application status updates
    const recentApplications = await StudentApplication.find({ 
      studentId,
      updatedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    }).populate('testId', 'title').limit(10);
    
    for (const app of recentApplications) {
      notifications.push({
        id: app._id,
        type: 'application',
        title: `Application ${app.status === 'approved' ? 'Approved' : 'Updated'}`,
        message: `Your application for "${app.testId?.title}" has been ${app.status}.`,
        time: app.updatedAt,
        read: app.notificationRead || false
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