const Test = require('../models/Test');
const Question = require('../models/Question');
const StudentApplication = require('../models/StudentApplication');
const TestSession = require('../models/TestSession');
const Result = require('../models/Result');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');

// ==================== HELPER FUNCTIONS ====================

// Call AI Service for question extraction
const callAIServiceForExtraction = async (filePath, totalMarks) => {
  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));
    formData.append('total_marks', totalMarks);
    
    console.log('Calling AI Service at http://localhost:8000/extract-questions');
    
    const response = await axios.post('http://localhost:8000/extract-questions', formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: 120000
    });
    
    return response.data;
  } catch (error) {
    console.error('AI Service error:', error.message);
    if (error.response) {
      console.error('AI Service response:', error.response.data);
    }
    return { 
      success: false, 
      message: 'AI Service unavailable. Please make sure the AI service is running on port 8000.',
      questions: []
    };
  }
};

// ==================== CONTROLLER FUNCTIONS ====================

const createTest = async (req, res) => {
  try {
    const test = await Test.create({ ...req.body, createdBy: req.user.id });
    res.status(201).json({ success: true, message: 'Test created successfully', test });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllTests = async (req, res) => {
  try {
    const tests = await Test.find().populate('createdBy', 'name email').sort({ createdAt: -1 });
    res.json({ success: true, tests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTestById = async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });
    
    const questions = await Question.find({ testId: test._id }).sort('order');
    
    const testWithQuestions = {
      ...test.toObject(),
      questions: questions.map(q => ({
        _id: q._id,
        text: q.text,
        options: q.options.map(opt => opt.text),
        correctAnswer: q.correctAnswer,
        marks: q.marks
      }))
    };
    
    res.json({ success: true, test: testWithQuestions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateTest = async (req, res) => {
  try {
    const test = await Test.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });
    res.json({ success: true, message: 'Test updated successfully', test });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteTest = async (req, res) => {
  try {
    const test = await Test.findByIdAndDelete(req.params.id);
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });
    await Question.deleteMany({ testId: req.params.id });
    res.json({ success: true, message: 'Test deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const publishTest = async (req, res) => {
  try {
    const test = await Test.findByIdAndUpdate(req.params.id, { status: 'published' }, { new: true });
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });
    res.json({ success: true, message: 'Test published successfully', test });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAvailableTests = async (req, res) => {
  try {
    const now = new Date();
    const tests = await Test.find({
      status: 'published',
      startDate: { $lte: now },
      endDate: { $gte: now }
    }).select('-questions');
    const applications = await StudentApplication.find({ studentId: req.user.id });
    const appliedTestIds = applications.map(app => app.testId.toString());
    const testsWithStatus = tests.map(test => ({ ...test.toObject(), applied: appliedTestIds.includes(test._id.toString()) }));
    res.json({ success: true, tests: testsWithStatus });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const applyForTest = async (req, res) => {
  try {
    const testId = req.params.id;
    const studentId = req.user.id;
    const test = await Test.findById(testId);
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });
    if (test.status !== 'published') return res.status(400).json({ success: false, message: 'Test is not available for application' });
    const existingApplication = await StudentApplication.findOne({ testId, studentId });
    if (existingApplication) return res.status(400).json({ success: false, message: 'Already applied for this test' });
    const application = await StudentApplication.create({ testId, studentId, status: 'pending' });
    res.status(201).json({ success: true, message: `Applied for test ${testId} successfully`, application });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const startTest = async (req, res) => {
  try {
    const testId = req.params.id;
    const studentId = req.user.id;
    
    console.log('Starting test:', { testId, studentId });
    
    // Check if application is approved
    const application = await StudentApplication.findOne({
      testId,
      studentId,
      status: 'approved'
    });
    
    if (!application) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to take this test. Your application is not approved yet.' 
      });
    }
    
    // CHECK IF TEST ALREADY SUBMITTED
    const existingResult = await Result.findOne({ studentId, testId });
    if (existingResult) {
      return res.status(400).json({ 
        success: false, 
        message: 'You have already completed this test. You cannot take it again.',
        alreadyCompleted: true,
        resultId: existingResult._id
      });
    }
    
    // Get the test
    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ 
        success: false, 
        message: 'Test not found' 
      });
    }
    
    // Get questions separately
    let questions = await Question.find({ testId: test._id }).sort('order');
    
    console.log(`Found ${questions.length} questions for test ${testId}`);
    
    if (questions.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No questions found for this test. Please contact the administrator.' 
      });
    }
    
    // Format questions for frontend
    const formattedQuestions = questions.map(q => ({
      _id: q._id,
      text: q.text,
      options: q.options.map(opt => opt.text),
      correctAnswer: q.correctAnswer,
      marks: q.marks
    }));
    
    // Check if test session already exists
    let session = await TestSession.findOne({
      testId,
      studentId,
      status: 'ongoing'
    });
    
    if (!session) {
      session = await TestSession.create({
        testId,
        studentId,
        startTime: new Date()
      });
    }
    
    res.json({
      success: true,
      test: {
        id: test._id,
        title: test.title,
        duration: test.duration,
        totalMarks: test.totalMarks
      },
      questions: formattedQuestions,
      sessionId: session._id,
      startTime: session.startTime
    });
    
  } catch (error) {
    console.error('Start test error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// FIXED: Submit test with proper error handling and simplified Result creation
const submitTest = async (req, res) => {
  try {
    const { answers, timeSpent, sessionId } = req.body;
    const testId = req.params.id;
    const studentId = req.user.id;
    
    console.log('===== SUBMIT TEST =====');
    console.log('Test ID:', testId);
    console.log('Student ID:', studentId);
    console.log('Time Spent:', timeSpent);
    
    // Get the test
    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found' });
    }
    
    // Get questions
    const questions = await Question.find({ testId: test._id });
    console.log(`Found ${questions.length} questions`);
    
    if (questions.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No questions found for this test' 
      });
    }
    
    let totalMarks = 0;
    let obtainedMarks = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;
    const processedAnswers = [];
    
    for (const question of questions) {
      totalMarks += question.marks;
      const questionIdStr = question._id.toString();
      let userAnswer = answers ? answers[questionIdStr] : undefined;
      
      if (userAnswer === undefined && answers) {
        userAnswer = answers[question._id];
      }
      
      const isCorrect = userAnswer === question.correctAnswer;
      
      if (userAnswer === undefined || userAnswer === null) {
        unansweredCount++;
      } else if (isCorrect) {
        obtainedMarks += question.marks;
        correctCount++;
      } else {
        incorrectCount++;
      }
      
      processedAnswers.push({
        questionId: question._id,
        selectedOption: userAnswer,
        isCorrect: isCorrect || false,
        marksObtained: isCorrect ? question.marks : 0
      });
    }
    
    const percentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;
    const status = percentage >= test.passingMarks ? 'pass' : 'fail';
    
    console.log(`Score: ${obtainedMarks}/${totalMarks} (${percentage.toFixed(2)}%) - ${status}`);
    console.log(`Correct: ${correctCount}, Incorrect: ${incorrectCount}, Unanswered: ${unansweredCount}`);
    
    // Update test session
    let session = await TestSession.findOne({ 
      testId, 
      studentId, 
      status: 'ongoing' 
    });
    
    if (session) {
      session.endTime = new Date();
      session.status = 'submitted';
      session.answers = processedAnswers;
      await session.save();
      console.log('Session updated');
    }
    
    // Create result using new Result() to avoid any pre-save issues
    const result = new Result({
      studentId,
      testId,
      sessionId: session ? session._id : null,
      totalMarks,
      obtainedMarks,
      percentage: parseFloat(percentage.toFixed(2)),
      status,
      correctAnswers: correctCount,
      incorrectAnswers: incorrectCount,
      unanswered: unansweredCount,
      answers: processedAnswers,
      timeTaken: timeSpent || 0,
      completedAt: new Date()
    });
    
    await result.save();
    console.log(`Result created: ${result._id}`);
    
    res.json({
      success: true,
      message: 'Test submitted successfully',
      resultId: result._id,
      percentage: percentage.toFixed(2),
      status,
      obtainedMarks,
      totalMarks
    });
    
  } catch (error) {
    console.error('Submit test error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

const saveProgress = async (req, res) => {
  try {
    const { answers, timeLeft } = req.body;
    let session = await TestSession.findOne({ 
      testId: req.params.id, 
      studentId: req.user.id, 
      status: 'ongoing' 
    });
    
    if (session) {
      session.answers = answers || {};
      session.timeLeft = timeLeft || 0;
      await session.save();
    }
    
    res.json({ success: true, message: 'Progress saved successfully' });
  } catch (error) {
    console.error('Save progress error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const uploadTest = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const test = await Test.create({
      title: req.body.title,
      description: req.body.description || '',
      totalMarks: parseInt(req.body.totalMarks),
      passingMarks: parseInt(req.body.passingMarks),
      duration: parseInt(req.body.duration),
      startDate: new Date(req.body.startDate),
      endDate: new Date(req.body.endDate),
      status: 'draft',
      createdBy: req.user.id,
      uploadedFile: { filename: req.file.filename, originalName: req.file.originalname, path: req.file.path, size: req.file.size }
    });
    res.status(201).json({ success: true, message: 'Test uploaded successfully', test });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const extractQuestions = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { totalMarks = '50' } = req.body;
    const filePath = req.file.path;
    
    console.log('Processing file for question extraction:', req.file.originalname);
    console.log('File type:', req.file.mimetype);
    
    const aiResponse = await callAIServiceForExtraction(filePath, parseInt(totalMarks));
    
    fs.unlink(filePath, (err) => err && console.error('Error deleting temp file:', err));
    
    if (aiResponse.success === false) {
      return res.status(400).json({
        success: false,
        message: aiResponse.message || 'Failed to extract questions from document',
        extractedTextPreview: aiResponse.extractedTextPreview || '',
        questions: [],
        totalQuestions: 0
      });
    }
    
    console.log(`AI Service extracted ${aiResponse.totalQuestions} questions`);
    
    res.json({
      success: true,
      questions: aiResponse.questions,
      totalQuestions: aiResponse.totalQuestions,
      extractedTextPreview: aiResponse.extractedTextPreview,
      message: aiResponse.message || `Successfully extracted ${aiResponse.totalQuestions} questions from the document`
    });
    
  } catch (error) {
    console.error('Extract questions error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const uploadTestWithQuestions = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    
    const { title, description, totalMarks, passingMarks, duration, startDate, endDate, subject, difficulty, questions } = req.body;
    
    const missingFields = [];
    if (!title) missingFields.push('title');
    if (!totalMarks) missingFields.push('totalMarks');
    if (!passingMarks) missingFields.push('passingMarks');
    if (!duration) missingFields.push('duration');
    if (!startDate) missingFields.push('startDate');
    if (!endDate) missingFields.push('endDate');
    
    if (missingFields.length > 0) {
      return res.status(400).json({ success: false, message: `Missing required fields: ${missingFields.join(', ')}` });
    }
    
    let parsedQuestions = [];
    try {
      parsedQuestions = typeof questions === 'string' ? JSON.parse(questions) : questions;
    } catch (e) {
      parsedQuestions = [];
    }
    
    if (!parsedQuestions.length) {
      return res.status(400).json({ success: false, message: 'No questions provided' });
    }
    
    const test = await Test.create({
      title, 
      description: description || '', 
      totalMarks: parseInt(totalMarks), 
      passingMarks: parseInt(passingMarks),
      duration: parseInt(duration), 
      startDate: new Date(startDate), 
      endDate: new Date(endDate),
      subject: subject || '', 
      difficulty: difficulty || 'medium', 
      status: 'draft', 
      createdBy: req.user.id,
      totalQuestions: parsedQuestions.length, 
      uploadedFile: { filename: req.file.filename, originalName: req.file.originalname, path: req.file.path, size: req.file.size }
    });
    
    const createdQuestions = [];
    for (let i = 0; i < parsedQuestions.length; i++) {
      const q = parsedQuestions[i];
      const question = await Question.create({
        testId: test._id, 
        text: q.text, 
        options: q.options.map((opt, idx) => ({ text: opt, isCorrect: idx === q.correctAnswer })),
        correctAnswer: q.correctAnswer, 
        marks: q.marks || 1, 
        explanation: q.explanation || '', 
        order: i
      });
      createdQuestions.push(question._id);
    }
    
    test.questions = createdQuestions;
    await test.save();
    
    res.status(201).json({ 
      success: true, 
      message: `Test "${title}" created successfully with ${createdQuestions.length} questions`, 
      test: { 
        id: test._id, 
        title: test.title, 
        totalMarks: test.totalMarks, 
        totalQuestions: createdQuestions.length, 
        status: test.status, 
        duration: test.duration, 
        startDate: test.startDate, 
        endDate: test.endDate 
      } 
    });
  } catch (error) {
    console.error('Upload with questions error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const logCheating = async (req, res) => {
  try {
    const { sessionId, violationType, warningCount, penalty } = req.body;
    const testId = req.params.id;
    const studentId = req.user.id;
    
    console.log('Cheating incident logged:', { testId, studentId, violationType, warningCount, penalty });
    
    let session = await TestSession.findOne({ _id: sessionId, studentId, testId });
    
    if (!session) {
      session = await TestSession.findOne({ testId, studentId, status: 'ongoing' });
    }
    
    if (session) {
      if (!session.cheatingIncidents) {
        session.cheatingIncidents = [];
      }
      
      session.cheatingIncidents.push({
        type: violationType,
        timestamp: new Date(),
        penalty: penalty || 0,
        warningCount: warningCount || 1
      });
      
      if (penalty && penalty > 0) {
        session.totalPenalty = (session.totalPenalty || 0) + penalty;
      }
      
      await session.save();
    }
    
    res.json({ 
      success: true, 
      message: 'Cheating incident logged',
      warningCount,
      penalty
    });
  } catch (error) {
    console.error('Log cheating error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== EXPORT ALL FUNCTIONS ====================
module.exports = {
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
  logCheating
};