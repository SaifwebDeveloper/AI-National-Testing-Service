import React, { useRef, useEffect, useState } from 'react';
import { Camera, AlertTriangle, Mic, Video, Shield, X } from 'lucide-react';
import io from 'socket.io-client';

const WebcamMonitor = ({ onCheatingDetected, testId }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const detectionInterval = useRef(null);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [warnings, setWarnings] = useState(0);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const socketRef = useRef(null);

  useEffect(() => {
    initWebcam();
    initSocket();
    
    return () => {
      if (detectionInterval.current) {
        clearInterval(detectionInterval.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const initSocket = () => {
    socketRef.current = io('http://localhost:5000');
    socketRef.current.emit('join-test', testId);
    
    socketRef.current.on('cheating-alert', (data) => {
      handleCheatingDetection(data.type);
    });
  };

  const initWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true,
        audio: false 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        // Start detection after video is loaded
        videoRef.current.onloadedmetadata = () => {
          startDetection();
        };
      }
    } catch (error) {
      console.error('Webcam error:', error);
      showAlertMessage('Please allow webcam access to continue the test', 'error');
    }
  };

  const startDetection = () => {
    detectionInterval.current = setInterval(async () => {
      if (videoRef.current && canvasRef.current) {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        
        // Draw current video frame to canvas
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        
        // Get image data for analysis
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        
        // Analyze for cheating behaviors
        await analyzeFrame(imageData);
      }
    }, 2000); // Check every 2 seconds
  };

  const analyzeFrame = async (imageData) => {
    // This would integrate with a face detection/object detection API
    // For now, we'll simulate detection
    
    // Simulated detection logic - replace with actual ML model
    const simulatedDetection = {
      multipleFaces: Math.random() < 0.05, // 5% chance for demo
      phoneDetected: Math.random() < 0.03,
      faceNotVisible: Math.random() < 0.1,
      lookingAway: Math.random() < 0.08
    };
    
    if (simulatedDetection.multipleFaces) {
      handleCheatingDetection('multiple_persons');
    } else if (simulatedDetection.phoneDetected) {
      handleCheatingDetection('phone_detected');
    } else if (simulatedDetection.faceNotVisible) {
      handleCheatingDetection('face_not_visible');
    } else if (simulatedDetection.lookingAway) {
      handleCheatingDetection('looking_away');
    }
  };

  const handleCheatingDetection = (type) => {
    let message = '';
    let penalty = 0;
    
    switch(type) {
      case 'multiple_persons':
        message = '⚠️ Multiple persons detected in frame!';
        break;
      case 'phone_detected':
        message = '📱 Mobile phone detected!';
        break;
      case 'face_not_visible':
        message = '👤 Face not visible! Please look at the camera.';
        break;
      case 'looking_away':
        message = '👀 Looking away from screen detected!';
        break;
      case 'tab_switch':
        message = '🔄 Tab switching detected!';
        break;
      default:
        message = 'Suspicious activity detected!';
    }
    
    // Determine penalty based on warning count
    if (warnings === 0) {
      message += ' (Warning 1/3)';
      penalty = 0;
    } else if (warnings === 1) {
      message += ' - 30 seconds deducted!';
      penalty = 30;
    } else if (warnings === 2) {
      message += ' - 60 seconds deducted! Final warning!';
      penalty = 60;
    } else {
      message += ' - Test terminated!';
      penalty = -1; // Terminate test
    }
    
    showAlertMessage(message, 'warning');
    setWarnings(prev => prev + 1);
    
    // Send cheating event to server
    if (socketRef.current) {
      socketRef.current.emit('cheating-alert', {
        testId,
        type,
        warningCount: warnings + 1,
        penalty
      });
    }
    
    // Call parent callback
    if (onCheatingDetected) {
      onCheatingDetected(type, penalty);
    }
  };

  const showAlertMessage = (message, type) => {
    setAlertMessage(message);
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 5000);
  };

  // Disable copy-paste, right-click, and keyboard shortcuts
  useEffect(() => {
    const disableKeyEvents = (e) => {
      // Disable Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+P
      if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'x', 'p', 's', 'u'].includes(e.key.toLowerCase())) {
        e.preventDefault();
        handleCheatingDetection('keyboard_shortcut');
        return false;
      }
      
      // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key))) {
        e.preventDefault();
        handleCheatingDetection('devtools');
        return false;
      }
      
      // Disable Alt+Tab detection
      if (e.altKey && e.key === 'Tab') {
        handleCheatingDetection('tab_switch');
      }
    };
    
    const disableContextMenu = (e) => {
      e.preventDefault();
      return false;
    };
    
    const disableCopyPaste = (e) => {
      e.preventDefault();
      handleCheatingDetection('copy_paste');
      return false;
    };
    
    // Handle page visibility change (tab switching)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleCheatingDetection('tab_switch');
      }
    };
    
    document.addEventListener('keydown', disableKeyEvents);
    document.addEventListener('contextmenu', disableContextMenu);
    document.addEventListener('copy', disableCopyPaste);
    document.addEventListener('paste', disableCopyPaste);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('keydown', disableKeyEvents);
      document.removeEventListener('contextmenu', disableContextMenu);
      document.removeEventListener('copy', disableCopyPaste);
      document.removeEventListener('paste', disableCopyPaste);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <>
      {/* Webcam Feed */}
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-gray-900 rounded-lg shadow-xl overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 bg-gray-800">
            <div className="flex items-center space-x-2">
              <Video className="h-4 w-4 text-green-500 animate-pulse" />
              <span className="text-white text-xs">Monitoring Active</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-500 text-xs">REC</span>
            </div>
          </div>
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-48 h-36 object-cover"
            />
            <canvas
              ref={canvasRef}
              width="320"
              height="240"
              className="hidden"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 px-2 py-1">
              <p className="text-white text-xs text-center">Face must be visible at all times</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Modal */}
      {showAlert && (
        <div className="fixed top-20 right-4 z-50 animate-slideInRight">
          <div className={`bg-red-500 text-white rounded-lg shadow-lg p-4 max-w-sm flex items-start space-x-3`}>
            <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium">{alertMessage}</p>
              <p className="text-xs opacity-90 mt-1">Warning {warnings}/3</p>
            </div>
            <button onClick={() => setShowAlert(false)} className="flex-shrink-0">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="fixed top-20 left-4 z-40 bg-white rounded-lg shadow-md p-3 max-w-xs">
        <div className="flex items-center space-x-2 mb-2">
          <Shield className="h-4 w-4 text-blue-600" />
          <h4 className="text-sm font-semibold text-gray-900">Exam Rules</h4>
        </div>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>✓ Keep your face visible at all times</li>
          <li>✓ No mobile phones or other devices</li>
          <li>✓ No other persons in the room</li>
          <li>✓ Don't switch tabs or windows</li>
          <li>✓ Copy-paste is disabled</li>
        </ul>
      </div>
    </>
  );
};

export default WebcamMonitor;