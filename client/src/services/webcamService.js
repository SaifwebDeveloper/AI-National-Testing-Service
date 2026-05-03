class WebcamService {
  constructor() {
    this.stream = null;
    this.videoElement = null;
    this.canvasElement = null;
    this.detectionInterval = null;
    this.isMonitoring = false;
    this.onCheatingDetected = null;
    this.warnings = 0;
    this.maxWarnings = 3;
    this.socket = null;
    this.testId = null;
  }
  
  // Initialize webcam
  async initWebcam(videoElement, canvasElement) {
    this.videoElement = videoElement;
    this.canvasElement = canvasElement;
    
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });
      
      if (this.videoElement) {
        this.videoElement.srcObject = this.stream;
        await this.videoElement.play();
      }
      
      return true;
    } catch (error) {
      console.error('Webcam initialization failed:', error);
      throw new Error('Unable to access webcam. Please ensure you have granted camera permissions.');
    }
  }
  
  // Start monitoring
  startMonitoring(testId, onCheatingDetected, socket) {
    this.testId = testId;
    this.onCheatingDetected = onCheatingDetected;
    this.socket = socket;
    this.isMonitoring = true;
    this.warnings = 0;
    
    // Start detection interval (check every 2 seconds)
    this.detectionInterval = setInterval(() => {
      this.detectCheating();
    }, 2000);
    
    // Set up event listeners for tab/window focus
    this.setupEventListeners();
  }
  
  // Stop monitoring
  stopMonitoring() {
    this.isMonitoring = false;
    
    if (this.detectionInterval) {
      clearInterval(this.detectionInterval);
      this.detectionInterval = null;
    }
    
    this.removeEventListeners();
  }
  
  // Stop webcam stream
  stopWebcam() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
  }
  
  // Detect cheating activities
  async detectCheating() {
    if (!this.isMonitoring || !this.videoElement || !this.canvasElement) return;
    
    const canvas = this.canvasElement;
    const context = canvas.getContext('2d');
    
    // Set canvas dimensions
    canvas.width = this.videoElement.videoWidth;
    canvas.height = this.videoElement.videoHeight;
    
    // Draw current video frame
    context.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);
    
    // Get image data for analysis
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    
    // Perform cheating detection
    const detections = await this.analyzeImage(imageData);
    
    if (detections.hasCheating) {
      this.handleCheating(detections.type);
    }
  }
  
  // Analyze image for cheating patterns
  async analyzeImage(imageData) {
    // This is a simplified version. In production, you would:
    // 1. Use TensorFlow.js or a similar library for face detection
    // 2. Use object detection for mobile phones
    // 3. Use pose estimation for multiple persons
    
    const detections = {
      hasCheating: false,
      type: null,
    };
    
    // Simulated detection (replace with actual ML model)
    // You can integrate with services like:
    // - Google Cloud Vision API
    // - AWS Rekognition
    // - Azure Face API
    // - TensorFlow.js models
    
    // For demonstration, we'll use random detection (remove in production)
    // In production, implement actual face/object detection
    
    return detections;
  }
  
  // Handle cheating detection
  handleCheating(type) {
    this.warnings++;
    
    let penalty = 0;
    let shouldTerminate = false;
    
    // Determine penalty based on warning count
    if (this.warnings === 1) {
      penalty = 0; // Just warning
    } else if (this.warnings === 2) {
      penalty = 30; // 30 seconds deduction
    } else if (this.warnings >= 3) {
      penalty = 60; // 60 seconds deduction
      if (this.warnings >= this.maxWarnings) {
        shouldTerminate = true;
      }
    }
    
    // Call callback
    if (this.onCheatingDetected) {
      this.onCheatingDetected({
        type,
        warningCount: this.warnings,
        penalty,
        shouldTerminate,
      });
    }
    
    // Emit socket event
    if (this.socket && this.testId) {
      this.socket.emit('cheating-alert', {
        testId: this.testId,
        type,
        warningCount: this.warnings,
        penalty,
      });
    }
  }
  
  // Setup event listeners for anti-cheating
  setupEventListeners() {
    // Tab/window focus loss detection
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    
    // Copy-paste prevention
    document.addEventListener('copy', this.preventCopyPaste);
    document.addEventListener('paste', this.preventCopyPaste);
    document.addEventListener('cut', this.preventCopyPaste);
    
    // Right-click prevention
    document.addEventListener('contextmenu', this.preventContextMenu);
    
    // Keyboard shortcut prevention
    document.addEventListener('keydown', this.preventKeyboardShortcuts);
    
    // Fullscreen change detection
    document.addEventListener('fullscreenchange', this.handleFullscreenChange);
  }
  
  // Remove event listeners
  removeEventListeners() {
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    document.removeEventListener('copy', this.preventCopyPaste);
    document.removeEventListener('paste', this.preventCopyPaste);
    document.removeEventListener('cut', this.preventCopyPaste);
    document.removeEventListener('contextmenu', this.preventContextMenu);
    document.removeEventListener('keydown', this.preventKeyboardShortcuts);
    document.removeEventListener('fullscreenchange', this.handleFullscreenChange);
  }
  
  // Handle visibility change (tab switching)
  handleVisibilityChange = () => {
    if (document.hidden && this.isMonitoring) {
      this.handleCheating('tab_switch');
    }
  };
  
  // Prevent copy-paste
  preventCopyPaste = (e) => {
    e.preventDefault();
    if (this.isMonitoring) {
      this.handleCheating('copy_paste');
    }
    return false;
  };
  
  // Prevent right-click
  preventContextMenu = (e) => {
    e.preventDefault();
    if (this.isMonitoring) {
      this.handleCheating('right_click');
    }
    return false;
  };
  
  // Prevent keyboard shortcuts
  preventKeyboardShortcuts = (e) => {
    const forbiddenKeys = [
      'F12',
      'F5',
      'F11',
      'PrintScreen',
    ];
    
    const forbiddenCombos = [
      { ctrl: true, key: 'c' },
      { ctrl: true, key: 'v' },
      { ctrl: true, key: 'x' },
      { ctrl: true, key: 's' },
      { ctrl: true, key: 'p' },
      { ctrl: true, shift: true, key: 'i' },
      { ctrl: true, shift: true, key: 'j' },
      { ctrl: true, shift: true, key: 'c' },
    ];
    
    // Check forbidden keys
    if (forbiddenKeys.includes(e.key)) {
      e.preventDefault();
      if (this.isMonitoring) {
        this.handleCheating('keyboard_shortcut');
      }
      return false;
    }
    
    // Check forbidden combos
    for (const combo of forbiddenCombos) {
      if (
        (combo.ctrl === e.ctrlKey) &&
        (combo.shift === e.shiftKey || !combo.shift) &&
        (combo.key === e.key.toLowerCase())
      ) {
        e.preventDefault();
        if (this.isMonitoring) {
          this.handleCheating('keyboard_shortcut');
        }
        return false;
      }
    }
  };
  
  // Handle fullscreen change
  handleFullscreenChange = () => {
    if (!document.fullscreenElement && this.isMonitoring) {
      this.handleCheating('fullscreen_exit');
    }
  };
  
  // Request fullscreen (recommended for test taking)
  requestFullscreen() {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    }
  }
  
  // Exit fullscreen
  exitFullscreen() {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
  
  // Take snapshot
  takeSnapshot() {
    if (!this.videoElement || !this.canvasElement) return null;
    
    const canvas = this.canvasElement;
    const context = canvas.getContext('2d');
    
    canvas.width = this.videoElement.videoWidth;
    canvas.height = this.videoElement.videoHeight;
    context.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);
    
    return canvas.toDataURL('image/jpeg', 0.8);
  }
  
  // Check webcam availability
  static async isWebcamAvailable() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      return videoDevices.length > 0;
    } catch {
      return false;
    }
  }
  
  // Request permissions
  static async requestPermissions() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
const webcamService = new WebcamService();
export default webcamService;