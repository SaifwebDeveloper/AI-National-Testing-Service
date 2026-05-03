const Result = require('../models/Result');
const Test = require('../models/Test');
const User = require('../models/User');
const nodemailer = require('nodemailer');
const axios = require('axios');

// Helper function to send email with result
const sendResultEmail = async (studentEmail, studentName, testTitle, result, testId) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const statusColor = result.status === 'pass' ? '#10B981' : '#EF4444';
  const statusText = result.status === 'pass' ? 'PASSED' : 'FAILED';

  const mailOptions = {
    from: `"Exam Platform" <${process.env.EMAIL_USER}>`,
    to: studentEmail,
    subject: `Your Test Result - ${testTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #3B82F6, #8B5CF6); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Test Result</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1f2937;">Dear ${studentName},</h2>
          <p style="color: #4b5563; line-height: 1.6;">Your results for <strong>${testTitle}</strong> are now available.</p>
          
          <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h3 style="color: #1f2937; margin-top: 0;">Result Summary</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Total Marks:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: bold;">${result.totalMarks}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Obtained Marks:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: bold;">${result.obtainedMarks}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Percentage:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: bold;">${result.percentage}%</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Status:</td>
                <td style="padding: 8px 0; text-align: right;">
                  <span style="background: ${statusColor}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;">${statusText}</span>
                </td>
              </tr>
            </table>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.CLIENT_URL}/student/result/${result._id}" style="background: #3B82F6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">View Detailed Results</a>
          </div>
          
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">This is an automated message, please do not reply.</p>
        </div>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

// @desc    Get student's results
// @route   GET /api/results/my-results
// @access  Private/Student
exports.getMyResults = async (req, res) => {
  try {
    const results = await Result.find({ studentId: req.user.id })
      .populate('testId', 'title totalMarks duration')
      .sort('-createdAt');
    
    // Format results with correct data from the result document
    const formattedResults = results.map(result => ({
      _id: result._id,
      testId: result.testId,
      testTitle: result.testId?.title || 'Test',
      totalMarks: result.totalMarks,  // Use from result, NOT from test
      obtainedMarks: result.obtainedMarks,
      percentage: result.percentage,
      status: result.status,
      correctAnswers: result.correctAnswers || 0,
      incorrectAnswers: result.incorrectAnswers || 0,
      unanswered: result.unanswered || 0,
      timeTaken: result.timeTaken || 0,
      completedAt: result.completedAt
    }));
    
    res.json({ success: true, results: formattedResults });
  } catch (error) {
    console.error('Get my results error:', error);
    res.status(500).json({ message: error.message });
  }
};

/// @desc    Get result by ID
// @route   GET /api/results/:id
// @access  Private
exports.getResultById = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('===== GET RESULT BY ID =====');
    console.log('Requested ID:', id);
    
    // Get the result directly WITHOUT any population or modification
    const result = await Result.findById(id);
    
    if (!result) {
      return res.status(404).json({ message: 'Result not found' });
    }
    
    // Log the raw database values
    console.log('RAW DATABASE VALUES:', {
      totalMarks: result.totalMarks,
      obtainedMarks: result.obtainedMarks,
      percentage: result.percentage,
      status: result.status
    });
    
    // Check authorization
    if (req.user.role !== 'admin' && result.studentId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Get test title separately (but DON'T use test's marks)
    const test = await Test.findById(result.testId);
    
    // Return EXACT values from the result document - NO calculations
    const responseData = {
      success: true,
      result: {
        id: result._id,
        testTitle: test?.title || 'Test',
        // IMPORTANT: Use result's values, NOT test's values
        totalMarks: result.totalMarks,      // This should be 1
        obtainedMarks: result.obtainedMarks, // This should be 0
        percentage: result.percentage,       // This should be 0
        status: result.status,               // This should be 'fail'
        completedAt: result.completedAt,
        correctAnswers: result.correctAnswers || 0,
        incorrectAnswers: result.incorrectAnswers || 0,
        unanswered: result.unanswered || 0,
        timeTaken: result.timeTaken || 0,
        answers: result.answers || []
      }
    };
    
    console.log('SENDING RESPONSE:', responseData.result);
    console.log('===== END =====');
    
    res.json(responseData);
  } catch (error) {
    console.error('Get result by ID error:', error);
    res.status(500).json({ message: error.message });
  }
};
// @desc    Get all results for a test (Admin)
// @route   GET /api/results/test/:testId
// @access  Private/Admin
exports.getTestResults = async (req, res) => {
  try {
    const results = await Result.find({ testId: req.params.testId })
      .populate('studentId', 'name email cnic phone')
      .sort('-percentage');
    
    const resultsWithRank = results.map((result, index) => ({
      ...result.toObject(),
      rank: index + 1
    }));
    
    res.json({ success: true, results: resultsWithRank });
  } catch (error) {
    console.error('Get test results error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Announce results and send emails
// @route   POST /api/results/announce/:testId
// @access  Private/Admin
exports.announceResults = async (req, res) => {
  try {
    const testId = req.params.testId;
    
    const results = await Result.find({ testId })
      .populate('studentId', 'name email')
      .populate('testId', 'title');
    
    if (results.length === 0) {
      return res.status(404).json({ message: 'No results found for this test' });
    }
    
    await Result.updateMany(
      { testId },
      { announcedAt: new Date() }
    );
    
    await Test.findByIdAndUpdate(testId, { resultAnnounced: true });
    
    for (const result of results) {
      try {
        await sendResultEmail(
          result.studentId.email,
          result.studentId.name,
          result.testId.title,
          result,
          testId
        );
        result.emailedAt = new Date();
        await result.save();
      } catch (emailError) {
        console.error(`Failed to send email to ${result.studentId.email}:`, emailError);
      }
    }
    
    res.json({ 
      success: true, 
      message: `Results announced and emails sent to ${results.length} students` 
    });
  } catch (error) {
    console.error('Announce results error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get result statistics for a test
// @route   GET /api/results/statistics/:testId
// @access  Private/Admin
exports.getStatistics = async (req, res) => {
  try {
    const results = await Result.find({ testId: req.params.testId });
    
    const totalStudents = results.length;
    const passed = results.filter(r => r.status === 'pass').length;
    const failed = results.filter(r => r.status === 'fail').length;
    const passRate = totalStudents > 0 ? (passed / totalStudents) * 100 : 0;
    const avgScore = totalStudents > 0 
      ? results.reduce((sum, r) => sum + r.percentage, 0) / totalStudents 
      : 0;
    const highestScore = results.length > 0 
      ? Math.max(...results.map(r => r.percentage)) 
      : 0;
    const lowestScore = results.length > 0 
      ? Math.min(...results.map(r => r.percentage)) 
      : 0;
    
    const distribution = {
      '90-100': results.filter(r => r.percentage >= 90).length,
      '80-89': results.filter(r => r.percentage >= 80 && r.percentage < 90).length,
      '70-79': results.filter(r => r.percentage >= 70 && r.percentage < 80).length,
      '60-69': results.filter(r => r.percentage >= 60 && r.percentage < 70).length,
      '50-59': results.filter(r => r.percentage >= 50 && r.percentage < 60).length,
      'below-50': results.filter(r => r.percentage < 50).length
    };
    
    res.json({
      success: true,
      statistics: {
        totalStudents,
        passed,
        failed,
        passRate: passRate.toFixed(2),
        avgScore: avgScore.toFixed(2),
        highestScore: highestScore.toFixed(2),
        lowestScore: lowestScore.toFixed(2),
        distribution
      }
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Export results as CSV
// @route   GET /api/results/export/:testId
// @access  Private/Admin
exports.exportResults = async (req, res) => {
  try {
    const results = await Result.find({ testId: req.params.testId })
      .populate('studentId', 'name email cnic')
      .sort('-percentage');
    
    if (results.length === 0) {
      return res.status(404).json({ message: 'No results found for this test' });
    }
    
    const headers = ['Rank', 'Student Name', 'Email', 'CNIC', 'Total Marks', 'Obtained Marks', 'Percentage', 'Status', 'Completed At'];
    const rows = results.map((result, index) => [
      index + 1,
      `"${result.studentId.name}"`,
      result.studentId.email,
      result.studentId.cnic || 'N/A',
      result.totalMarks,
      result.obtainedMarks,
      result.percentage,
      result.status.toUpperCase(),
      new Date(result.completedAt).toLocaleString()
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const utf8BOM = "\uFEFF";
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=results_${req.params.testId}_${Date.now()}.csv`);
    res.send(utf8BOM + csvContent);
  } catch (error) {
    console.error('Export results error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get top performers
// @route   GET /api/results/top-performers
// @access  Private/Admin
exports.getTopPerformers = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const topPerformers = await Result.aggregate([
      {
        $group: {
          _id: '$studentId',
          averageScore: { $avg: '$percentage' },
          testsTaken: { $sum: 1 },
          totalMarks: { $sum: '$obtainedMarks' }
        }
      },
      { $sort: { averageScore: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'student'
        }
      },
      { $unwind: '$student' },
      {
        $project: {
          studentId: '$_id',
          name: '$student.name',
          email: '$student.email',
          averageScore: { $round: ['$averageScore', 2] },
          testsTaken: 1,
          totalMarks: 1
        }
      }
    ]);
    
    res.json({ success: true, performers: topPerformers });
  } catch (error) {
    console.error('Get top performers error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get student performance trend
// @route   GET /api/results/trend/:studentId
// @access  Private
exports.getPerformanceTrend = async (req, res) => {
  try {
    const studentId = req.params.studentId || req.user.id;
    
    if (req.user.role !== 'admin' && studentId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const results = await Result.find({ studentId })
      .populate('testId', 'title')
      .sort('completedAt')
      .limit(10);
    
    const trend = results.map(result => ({
      testTitle: result.testId.title,
      percentage: result.percentage,
      status: result.status,
      date: result.completedAt
    }));
    
    res.json({ success: true, trend });
  } catch (error) {
    console.error('Get performance trend error:', error);
    res.status(500).json({ message: error.message });
  }
};