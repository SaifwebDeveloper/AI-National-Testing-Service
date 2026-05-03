import api from './api';

const RESULT_ENDPOINTS = {
  GET_RESULTS: '/results',
  GET_RESULT: '/results',
  ANNOUNCE_RESULTS: '/results/announce',
  GET_STUDENT_RESULTS: '/results/student',
  GET_TEST_RESULTS: '/results/test',
  EXPORT_RESULTS: '/results/export',
  SEND_EMAILS: '/results/send-emails',
  DOWNLOAD_CERTIFICATE: '/results/certificate',
  GET_STATISTICS: '/results/statistics',
  GET_RANKINGS: '/results/rankings',
};

class ResultService {
  // Get all results (admin)
  async getAllResults(params = {}) {
    try {
      const response = await api.get(RESULT_ENDPOINTS.GET_RESULTS, params);
      return response;
    } catch (error) {
      throw error;
    }
  }
  
  // Get result by ID
  async getResultById(resultId) {
    try {
      const response = await api.get(`${RESULT_ENDPOINTS.GET_RESULT}/${resultId}`);
      return response;
    } catch (error) {
      throw error;
    }
  }
  
  // Get results for a specific test (admin)
  async getTestResults(testId, params = {}) {
    try {
      const response = await api.get(`${RESULT_ENDPOINTS.GET_TEST_RESULTS}/${testId}`, params);
      return response;
    } catch (error) {
      throw error;
    }
  }
  
  // Get student's own results
  async getMyResults(params = {}) {
    try {
      const response = await api.get(RESULT_ENDPOINTS.GET_STUDENT_RESULTS, params);
      return response;
    } catch (error) {
      throw error;
    }
  }
  
  // Announce results for a test (admin)
  async announceResults(testId) {
    try {
      const response = await api.post(`${RESULT_ENDPOINTS.ANNOUNCE_RESULTS}/${testId}`);
      return response;
    } catch (error) {
      throw error;
    }
  }
  
  // Send result emails to students (admin)
  async sendResultEmails(testId, studentIds = []) {
    try {
      const response = await api.post(`${RESULT_ENDPOINTS.SEND_EMAILS}/${testId}`, { studentIds });
      return response;
    } catch (error) {
      throw error;
    }
  }
  
  // Export results to CSV/Excel (admin)
  async exportResults(testId, format = 'csv') {
    try {
      const response = await api.get(`${RESULT_ENDPOINTS.EXPORT_RESULTS}/${testId}`, { format });
      return response;
    } catch (error) {
      throw error;
    }
  }
  
  // Download certificate (student)
  async downloadCertificate(resultId) {
    try {
      const response = await api.get(`${RESULT_ENDPOINTS.DOWNLOAD_CERTIFICATE}/${resultId}`, {
        responseType: 'blob',
      });
      
      // Create download link
      const url = window.URL.createObjectURL(response);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificate_${resultId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      return response;
    } catch (error) {
      throw error;
    }
  }
  
  // Get test statistics (admin)
  async getTestStatistics(testId) {
    try {
      const response = await api.get(`${RESULT_ENDPOINTS.GET_STATISTICS}/${testId}`);
      return response;
    } catch (error) {
      throw error;
    }
  }
  
  // Get student rankings
  async getRankings(testId, limit = 50) {
    try {
      const response = await api.get(`${RESULT_ENDPOINTS.GET_RANKINGS}/${testId}`, { limit });
      return response;
    } catch (error) {
      throw error;
    }
  }
  
  // Get overall statistics (admin dashboard)
  async getOverallStatistics() {
    try {
      const response = await api.get(RESULT_ENDPOINTS.GET_STATISTICS);
      return response;
    } catch (error) {
      throw error;
    }
  }
  
  // Calculate student's percentage
  calculatePercentage(obtainedMarks, totalMarks) {
    return ((obtainedMarks / totalMarks) * 100).toFixed(2);
  }
  
  // Determine pass/fail status
  getPassFailStatus(percentage, passingPercentage = 40) {
    return percentage >= passingPercentage ? 'pass' : 'fail';
  }
  
  // Get grade based on percentage
  getGrade(percentage) {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'F';
  }
  
  // Get performance message
  getPerformanceMessage(percentage) {
    if (percentage >= 90) return 'Excellent performance! Outstanding!';
    if (percentage >= 80) return 'Very good performance! Great job!';
    if (percentage >= 70) return 'Good performance! Keep improving!';
    if (percentage >= 60) return 'Satisfactory performance!';
    if (percentage >= 50) return 'Fair performance! Need improvement!';
    return 'Poor performance! Please work harder!';
  }
  
  // Format result data for display
  formatResultForDisplay(result) {
    return {
      ...result,
      percentageFormatted: `${result.percentage}%`,
      grade: this.getGrade(result.percentage),
      message: this.getPerformanceMessage(result.percentage),
      dateFormatted: new Date(result.completedAt).toLocaleString(),
      statusText: result.status === 'pass' ? 'Passed' : 'Failed',
      statusColor: result.status === 'pass' ? 'green' : 'red',
    };
  }
}

const resultService = new ResultService();
export default resultService;