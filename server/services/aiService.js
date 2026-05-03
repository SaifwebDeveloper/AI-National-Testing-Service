const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// Generate test questions from document
const generateTestFromDocument = async (filePath, testDetails) => {
  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));
    formData.append('title', testDetails.title);
    formData.append('totalMarks', testDetails.totalMarks);
    formData.append('subject', testDetails.subject || 'General');
    formData.append('difficulty', testDetails.difficulty || 'medium');
    
    const response = await axios.post(`${AI_SERVICE_URL}/generate-test`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Content-Type': 'multipart/form-data'
      },
      timeout: 120000 // 2 minutes timeout for AI processing
    });
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('AI Service error:', error.message);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'AI service unavailable'
    };
  }
};

// Generate questions from text content
const generateQuestionsFromText = async (text, numberOfQuestions, difficulty = 'medium') => {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/generate-questions`, {
      text,
      numberOfQuestions,
      difficulty
    }, {
      timeout: 90000
    });
    
    return {
      success: true,
      questions: response.data.questions
    };
  } catch (error) {
    console.error('Question generation error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

// Analyze answer for grading (for subjective questions)
const analyzeAnswer = async (question, studentAnswer, modelAnswer) => {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/analyze-answer`, {
      question,
      studentAnswer,
      modelAnswer
    }, {
      timeout: 30000
    });
    
    return {
      success: true,
      score: response.data.score,
      feedback: response.data.feedback
    };
  } catch (error) {
    console.error('Answer analysis error:', error.message);
    return {
      success: false,
      error: error.message,
      score: 0,
      feedback: 'Unable to analyze answer'
    };
  }
};

// Check for plagiarism in answer
const checkPlagiarism = async (text) => {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/check-plagiarism`, {
      text
    }, {
      timeout: 30000
    });
    
    return {
      success: true,
      plagiarismScore: response.data.plagiarismScore,
      sources: response.data.sources
    };
  } catch (error) {
    console.error('Plagiarism check error:', error.message);
    return {
      success: false,
      error: error.message,
      plagiarismScore: 0
    };
  }
};

// Extract text from document
const extractTextFromDocument = async (filePath, fileType) => {
  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));
    formData.append('fileType', fileType);
    
    const response = await axios.post(`${AI_SERVICE_URL}/extract-text`, formData, {
      headers: formData.getHeaders(),
      timeout: 60000
    });
    
    return {
      success: true,
      text: response.data.text
    };
  } catch (error) {
    console.error('Text extraction error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

// Generate test summary and insights
const generateTestInsights = async (testData, results) => {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/generate-insights`, {
      testData,
      results
    }, {
      timeout: 60000
    });
    
    return {
      success: true,
      insights: response.data.insights,
      recommendations: response.data.recommendations
    };
  } catch (error) {
    console.error('Insights generation error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

// Check AI service health
const checkAIHealth = async () => {
  try {
    const response = await axios.get(`${AI_SERVICE_URL}/health`, {
      timeout: 5000
    });
    return response.data.status === 'healthy';
  } catch (error) {
    console.error('AI service health check failed:', error.message);
    return false;
  }
};

// Queue for AI requests (to handle rate limiting)
class AIRequestQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
  }
  
  async add(request) {
    return new Promise((resolve, reject) => {
      this.queue.push({ request, resolve, reject });
      this.process();
    });
  }
  
  async process() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    const { request, resolve, reject } = this.queue.shift();
    
    try {
      const result = await request();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.processing = false;
      this.process();
    }
  }
}

const aiQueue = new AIRequestQueue();

// Queue a request (use for rate-limited endpoints)
const queueAIRequest = async (requestFn) => {
  return aiQueue.add(requestFn);
};

module.exports = {
  generateTestFromDocument,
  generateQuestionsFromText,
  analyzeAnswer,
  checkPlagiarism,
  extractTextFromDocument,
  generateTestInsights,
  checkAIHealth,
  queueAIRequest
};