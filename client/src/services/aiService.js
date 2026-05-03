// src/services/aiService.js
import axios from 'axios';

const AI_SERVICE_URL = 'http://localhost:8000';

class AIService {
  constructor() {
    this.isConnected = false;
    this.modelLoaded = false;
  }

  async checkHealth() {
    try {
      const response = await axios.get(`${AI_SERVICE_URL}/health`, { timeout: 3000 });
      this.isConnected = response.data.status === 'healthy';
      this.modelLoaded = response.data.model_loaded;
      return this.isConnected;
    } catch (error) {
      this.isConnected = false;
      this.modelLoaded = false;
      return false;
    }
  }

  async detectFrame(imageData, testId, sessionId) {
    if (!this.isConnected) {
      return { error: 'AI Service not connected', violation: null };
    }

    try {
      const response = await axios.post(`${AI_SERVICE_URL}/detect`, {
        image: imageData,
        testId: testId,
        sessionId: sessionId,
        timestamp: new Date().toISOString()
      }, { timeout: 5000 });
      
      return response.data;
    } catch (error) {
      console.error('AI detection error:', error);
      return { error: error.message, violation: null };
    }
  }

  async batchDetect(images) {
    if (!this.isConnected || images.length === 0) {
      return { error: 'AI Service not connected', batch_results: [] };
    }

    try {
      const response = await axios.post(`${AI_SERVICE_URL}/batch-detect`, {
        images: images
      }, { timeout: 10000 });
      
      return response.data;
    } catch (error) {
      console.error('Batch detection error:', error);
      return { error: error.message, batch_results: [] };
    }
  }
}

export default new AIService();