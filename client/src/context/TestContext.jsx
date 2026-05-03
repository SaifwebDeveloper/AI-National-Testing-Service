import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import testService from '../services/testService';
import resultService from '../services/resultService';
import { TEST_STATUS, APPLICATION_STATUS } from '../utils/constants';

// Create Test Context
const TestContext = createContext(null);

// Custom hook to use test context
export const useTest = () => {
  const context = useContext(TestContext);
  if (!context) {
    throw new Error('useTest must be used within TestProvider');
  }
  return context;
};

export const TestProvider = ({ children }) => {
  const [tests, setTests] = useState([]);
  const [availableTests, setAvailableTests] = useState([]);
  const [myTests, setMyTests] = useState([]);
  const [currentTest, setCurrentTest] = useState(null);
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [testProgress, setTestProgress] = useState(null);

  // Load all tests (admin)
  const loadAllTests = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await testService.getAllTests(params);
      setTests(response.tests || []);
      return response;
    } catch (err) {
      setError(err.message || 'Failed to load tests');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Load available tests (student)
  const loadAvailableTests = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await testService.getAvailableTests(params);
      setAvailableTests(response.tests || []);
      return response;
    } catch (err) {
      setError(err.message || 'Failed to load available tests');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Load my tests (student)
  const loadMyTests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await testService.getMyTests();
      setMyTests(response.tests || []);
      return response;
    } catch (err) {
      setError(err.message || 'Failed to load your tests');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get test by ID
  const getTestById = useCallback(async (testId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await testService.getTestById(testId);
      setCurrentTest(response);
      return response;
    } catch (err) {
      setError(err.message || 'Failed to load test');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create test (admin)
  const createTest = useCallback(async (testData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await testService.createTest(testData);
      await loadAllTests();
      return response;
    } catch (err) {
      setError(err.message || 'Failed to create test');
      return null;
    } finally {
      setLoading(false);
    }
  }, [loadAllTests]);

  // Update test (admin)
  const updateTest = useCallback(async (testId, testData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await testService.updateTest(testId, testData);
      await loadAllTests();
      if (currentTest?._id === testId) {
        setCurrentTest(response);
      }
      return response;
    } catch (err) {
      setError(err.message || 'Failed to update test');
      return null;
    } finally {
      setLoading(false);
    }
  }, [loadAllTests, currentTest]);

  // Delete test (admin)
  const deleteTest = useCallback(async (testId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await testService.deleteTest(testId);
      await loadAllTests();
      if (currentTest?._id === testId) {
        setCurrentTest(null);
      }
      return response;
    } catch (err) {
      setError(err.message || 'Failed to delete test');
      return null;
    } finally {
      setLoading(false);
    }
  }, [loadAllTests, currentTest]);

  // Publish test (admin)
  const publishTest = useCallback(async (testId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await testService.publishTest(testId);
      await loadAllTests();
      return response;
    } catch (err) {
      setError(err.message || 'Failed to publish test');
      return null;
    } finally {
      setLoading(false);
    }
  }, [loadAllTests]);

  // Upload test document (admin)
  const uploadTestDocument = useCallback(async (file, testDetails) => {
    setLoading(true);
    setError(null);
    try {
      const response = await testService.uploadTestDocument(file, testDetails);
      await loadAllTests();
      return response;
    } catch (err) {
      setError(err.message || 'Failed to upload test');
      return null;
    } finally {
      setLoading(false);
    }
  }, [loadAllTests]);

  // Generate test with AI (admin)
  const generateTestWithAI = useCallback(async (file, testDetails) => {
    setLoading(true);
    setError(null);
    try {
      const response = await testService.generateTestWithAI(file, testDetails);
      return response;
    } catch (err) {
      setError(err.message || 'AI generation failed');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Apply for test (student)
  const applyForTest = useCallback(async (testId, applicationData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await testService.applyForTest(testId, applicationData);
      await loadAvailableTests();
      await loadMyTests();
      return response;
    } catch (err) {
      setError(err.message || 'Failed to apply for test');
      return null;
    } finally {
      setLoading(false);
    }
  }, [loadAvailableTests, loadMyTests]);

  // Start test (student)
  const startTest = useCallback(async (testId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await testService.startTest(testId);
      setCurrentTest(response);
      return response;
    } catch (err) {
      setError(err.message || 'Failed to start test');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Submit test (student)
  const submitTest = useCallback(async (testId, answers, timeSpent) => {
    setLoading(true);
    setError(null);
    try {
      const response = await testService.submitTest(testId, answers, timeSpent);
      await loadMyTests();
      return response;
    } catch (err) {
      setError(err.message || 'Failed to submit test');
      return null;
    } finally {
      setLoading(false);
    }
  }, [loadMyTests]);

  // Save test progress (student)
  const saveTestProgress = useCallback(async (testId, answers, timeLeft) => {
    try {
      const response = await testService.saveTestProgress(testId, answers, timeLeft);
      setTestProgress({
        testId,
        answers,
        timeLeft,
        lastSaved: new Date(),
      });
      // Save to localStorage as backup
      localStorage.setItem(`test_progress_${testId}`, JSON.stringify({
        answers,
        timeLeft,
        lastSaved: new Date(),
      }));
      return response;
    } catch (err) {
      console.error('Failed to save progress:', err);
      return null;
    }
  }, []);

  // Load saved test progress
  const loadTestProgress = useCallback((testId) => {
    const saved = localStorage.getItem(`test_progress_${testId}`);
    if (saved) {
      try {
        const progress = JSON.parse(saved);
        setTestProgress(progress);
        return progress;
      } catch (err) {
        console.error('Failed to load progress:', err);
      }
    }
    return null;
  }, []);

  // Clear test progress
  const clearTestProgress = useCallback((testId) => {
    localStorage.removeItem(`test_progress_${testId}`);
    setTestProgress(null);
  }, []);

  // Get test result (student)
  const getTestResult = useCallback(async (resultId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await testService.getTestResult(resultId);
      return response;
    } catch (err) {
      setError(err.message || 'Failed to load result');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Load test results (student)
  const loadTestResults = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await resultService.getMyResults();
      setTestResults(response.results || []);
      return response;
    } catch (err) {
      setError(err.message || 'Failed to load results');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get test statistics (admin)
  const getTestStatistics = useCallback(async (testId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await resultService.getTestStatistics(testId);
      return response;
    } catch (err) {
      setError(err.message || 'Failed to load statistics');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Announce results (admin)
  const announceResults = useCallback(async (testId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await resultService.announceResults(testId);
      return response;
    } catch (err) {
      setError(err.message || 'Failed to announce results');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Filter tests by status
  const getTestsByStatus = useCallback((status) => {
    return tests.filter(test => test.status === status);
  }, [tests]);

  // Filter tests by date range
  const getTestsByDateRange = useCallback((startDate, endDate) => {
    return tests.filter(test => {
      const testDate = new Date(test.createdAt);
      return testDate >= startDate && testDate <= endDate;
    });
  }, [tests]);

  // Get upcoming tests
  const getUpcomingTests = useCallback(() => {
    const now = new Date();
    return availableTests.filter(test => new Date(test.startDate) > now);
  }, [availableTests]);

  // Get ongoing tests
  const getOngoingTests = useCallback(() => {
    const now = new Date();
    return availableTests.filter(test => 
      new Date(test.startDate) <= now && new Date(test.endDate) >= now
    );
  }, [availableTests]);

  // Get completed tests
  const getCompletedTests = useCallback(() => {
    const now = new Date();
    return tests.filter(test => new Date(test.endDate) < now);
  }, [tests]);

  const value = {
    tests,
    availableTests,
    myTests,
    currentTest,
    testResults,
    testProgress,
    loading,
    error,
    loadAllTests,
    loadAvailableTests,
    loadMyTests,
    getTestById,
    createTest,
    updateTest,
    deleteTest,
    publishTest,
    uploadTestDocument,
    generateTestWithAI,
    applyForTest,
    startTest,
    submitTest,
    saveTestProgress,
    loadTestProgress,
    clearTestProgress,
    getTestResult,
    loadTestResults,
    getTestStatistics,
    announceResults,
    getTestsByStatus,
    getTestsByDateRange,
    getUpcomingTests,
    getOngoingTests,
    getCompletedTests,
  };

  return (
    <TestContext.Provider value={value}>
      {children}
    </TestContext.Provider>
  );
};

// Hook for test taking with auto-save
export const useTestTaking = (testId) => {
  const { 
    startTest, 
    submitTest, 
    saveTestProgress, 
    loadTestProgress, 
    clearTestProgress,
    loading 
  } = useTest();
  
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [testDetails, setTestDetails] = useState(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

  // Load saved progress on mount
  useEffect(() => {
    const savedProgress = loadTestProgress(testId);
    if (savedProgress) {
      setAnswers(savedProgress.answers || {});
      setTimeLeft(savedProgress.timeLeft || 0);
    }
  }, [testId, loadTestProgress]);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!autoSaveEnabled) return;
    
    const interval = setInterval(() => {
      if (Object.keys(answers).length > 0) {
        saveTestProgress(testId, answers, timeLeft);
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [testId, answers, timeLeft, autoSaveEnabled, saveTestProgress]);

  const handleAnswer = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleSubmit = async () => {
    const totalTime = testDetails?.duration * 60;
    const timeSpent = totalTime - timeLeft;
    const result = await submitTest(testId, answers, timeSpent);
    if (result) {
      clearTestProgress(testId);
      return result;
    }
    return null;
  };

  const handleTimeUpdate = (newTimeLeft) => {
    setTimeLeft(newTimeLeft);
  };

  return {
    answers,
    timeLeft,
    questions,
    testDetails,
    loading,
    autoSaveEnabled,
    setAutoSaveEnabled,
    handleAnswer,
    handleSubmit,
    handleTimeUpdate,
    setQuestions,
    setTestDetails,
    startTest: () => startTest(testId),
  };
};

export default TestContext;