import api from './api';

const TEST_ENDPOINTS = {
  GET_ALL_TESTS: '/tests',
  GET_TEST: '/tests',
  CREATE_TEST: '/tests',
  UPDATE_TEST: '/tests',
  DELETE_TEST: '/tests',
  PUBLISH_TEST: '/tests/publish',
  UPLOAD_TEST: '/tests/upload',
  AI_GENERATE: '/tests/ai-generate',
  SAVE_TEST: '/tests/save',
  GET_AVAILABLE_TESTS: '/tests/available',
  APPLY_FOR_TEST: '/tests/apply',
  START_TEST: '/tests/start',
  SUBMIT_TEST: '/tests/submit',
  SAVE_PROGRESS: '/tests/save-progress',
  GET_RESULT: '/tests/result',
  GET_STUDENT_TESTS: '/tests/my-tests',
};

class TestService {
  // Admin endpoints
  async getAllTests(params = {}) {
    try {
      const response = await api.get(TEST_ENDPOINTS.GET_ALL_TESTS, params);
      return response;
    } catch (error) {
      throw error;
    }
  }
  
  async getTestById(testId) {
    try {
      const response = await api.get(`${TEST_ENDPOINTS.GET_TEST}/${testId}`);
      return response;
    } catch (error) {
      throw error;
    }
  }
  
  async createTest(testData) {
    try {
      const response = await api.post(TEST_ENDPOINTS.CREATE_TEST, testData);
      return response;
    } catch (error) {
      throw error;
    }
  }
  
  async updateTest(testId, testData) {
    try {
      const response = await api.put(`${TEST_ENDPOINTS.UPDATE_TEST}/${testId}`, testData);
      return response;
    } catch (error) {
      throw error;
    }
  }
  
  async deleteTest(testId) {
    try {
      const response = await api.delete(`${TEST_ENDPOINTS.DELETE_TEST}/${testId}`);
      return response;
    } catch (error) {
      throw error;
    }
  }
  
  async publishTest(testId) {
    try {
      const response = await api.post(`${TEST_ENDPOINTS.PUBLISH_TEST}/${testId}`);
      return response;
    } catch (error) {
      throw error;
    }
  }
  
  async uploadTestDocument(file, testDetails) {
    try {
      const response = await api.upload(TEST_ENDPOINTS.UPLOAD_TEST, file, testDetails);
      return response;
    } catch (error) {
      throw error;
    }
  }
  
  async generateTestWithAI(file, testDetails) {
    try {
      const response = await api.ai.generateTest(file, testDetails);
      return response;
    } catch (error) {
      throw error;
    }
  }
  
  async saveGeneratedTest(testData) {
    try {
      const response = await api.post(TEST_ENDPOINTS.SAVE_TEST, testData);
      return response;
    } catch (error) {
      throw error;
    }
  }
  
  // Student endpoints
  async getAvailableTests(params = {}) {
    try {
      const response = await api.get(TEST_ENDPOINTS.GET_AVAILABLE_TESTS, params);
      return response;
    } catch (error) {
      throw error;
    }
  }
  
  async applyForTest(testId, applicationData = {}) {
    try {
      const response = await api.post(`${TEST_ENDPOINTS.APPLY_FOR_TEST}/${testId}`, applicationData);
      return response;
    } catch (error) {
      throw error;
    }
  }
  
  async startTest(testId) {
    try {
      const response = await api.post(`${TEST_ENDPOINTS.START_TEST}/${testId}`);
      return response;
    } catch (error) {
      throw error;
    }
  }
  
  async submitTest(testId, answers, timeSpent) {
    try {
      const response = await api.post(`${TEST_ENDPOINTS.SUBMIT_TEST}/${testId}`, {
        answers,
        timeSpent,
      });
      return response;
    } catch (error) {
      throw error;
    }
  }
  
  async saveTestProgress(testId, answers, timeLeft) {
    try {
      const response = await api.post(`${TEST_ENDPOINTS.SAVE_PROGRESS}/${testId}`, {
        answers,
        timeLeft,
      });
      return response;
    } catch (error) {
      throw error;
    }
  }
  
  async getTestResult(resultId) {
    try {
      const response = await api.get(`${TEST_ENDPOINTS.GET_RESULT}/${resultId}`);
      return response;
    } catch (error) {
      throw error;
    }
  }
  
  async getMyTests() {
    try {
      const response = await api.get(TEST_ENDPOINTS.GET_STUDENT_TESTS);
      return response;
    } catch (error) {
      throw error;
    }
  }
  
  async getTestQuestions(testId) {
    try {
      const response = await api.get(`${TEST_ENDPOINTS.GET_TEST}/${testId}/questions`);
      return response;
    } catch (error) {
      throw error;
    }
  }
}

const testService = new TestService();
export default testService;