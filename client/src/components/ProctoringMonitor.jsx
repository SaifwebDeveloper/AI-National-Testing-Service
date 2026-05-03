// src/components/ProctoringMonitor.jsx
import React, { useEffect, useRef, useState } from 'react';
import { Camera, Cpu, AlertTriangle, Wifi, WifiOff } from 'lucide-react';
import aiService from '../services/aiService';

const ProctoringMonitor = ({ testId, sessionId, onViolation, isActive }) => {
  const [webcamActive, setWebcamActive] = useState(false);
  const [webcamStream, setWebcamStream] = useState(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [aiStatus, setAiStatus] = useState('checking');
  const [lastDetection, setLastDetection] = useState(null);
  const [violationCount, setViolationCount] = useState(0);
  
  const videoRef = useRef(null);
  const aiIntervalRef = useRef(null);

  // Check AI service connection
  useEffect(() => {
    const checkConnection = async () => {
      const connected = await aiService.checkHealth();
      setAiStatus(connected ? 'online' : 'offline');
    };
    
    if (isActive) {
      checkConnection();
      const interval = setInterval(checkConnection, 30000);
      return () => clearInterval(interval);
    }
  }, [isActive]);

  // Setup webcam
  const setupWebcam = async () => {
    if (!isActive) return;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });
      
      setWebcamStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setWebcamActive(true);
      setPermissionDenied(false);
      
      // Start AI detection
      startAIDetection();
    } catch (error) {
      console.error('Webcam error:', error);
      setPermissionDenied(true);
      setWebcamActive(false);
      if (onViolation) {
        onViolation('webcam_error', 'Webcam access denied', { type: 'permission_denied' });
      }
    }
  };

  // Start AI detection loop
  const startAIDetection = () => {
    if (aiIntervalRef.current) clearInterval(aiIntervalRef.current);
    
    aiIntervalRef.current = setInterval(async () => {
      if (videoRef.current && webcamActive && isActive && aiStatus === 'online') {
        const frame = captureFrame();
        if (frame) {
          const detection = await aiService.detectFrame(frame, testId, sessionId);
          setLastDetection(detection);
          
          if (detection.violation && onViolation) {
            setViolationCount(prev => prev + 1);
            onViolation(detection.violation, detection.violation_details?.message, detection);
          }
        }
      }
    }, 5000); // Detect every 5 seconds
  };

  // Capture frame from webcam
  const captureFrame = () => {
    if (!videoRef.current || videoRef.current.videoWidth === 0) return null;
    
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', 0.5);
    }
    return null;
  };

  // Cleanup on unmount
  useEffect(() => {
    if (isActive) {
      setupWebcam();
    }
    
    return () => {
      if (aiIntervalRef.current) clearInterval(aiIntervalRef.current);
      if (webcamStream) {
        webcamStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isActive]);

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-3 border border-gray-700">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <Camera className="h-4 w-4 text-blue-400" />
          <span className="text-white text-sm font-medium">Proctoring Monitor</span>
        </div>
        <div className="flex items-center gap-2">
          {aiStatus === 'online' ? (
            <div className="flex items-center gap-1">
              <Cpu className="h-3 w-3 text-green-400" />
              <span className="text-green-400 text-xs">AI Active</span>
            </div>
          ) : aiStatus === 'checking' ? (
            <span className="text-yellow-400 text-xs">Connecting...</span>
          ) : (
            <div className="flex items-center gap-1">
              <WifiOff className="h-3 w-3 text-red-400" />
              <span className="text-red-400 text-xs">AI Offline</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Webcam Feed */}
      <div className="relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full rounded-lg bg-gray-900"
          style={{ minHeight: '180px' }}
        />
        
        {!webcamActive && !permissionDenied && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 rounded-lg">
            <button
              onClick={setupWebcam}
              className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs"
            >
              Enable Camera
            </button>
          </div>
        )}
        
        {permissionDenied && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-900/90 rounded-lg">
            <div className="text-center text-white text-xs p-2">
              <AlertTriangle className="h-8 w-8 mx-auto mb-1" />
              <p>Camera access required</p>
              <p className="text-gray-300 mt-1">Please enable camera to continue</p>
            </div>
          </div>
        )}
        
        {/* Detection Overlay */}
        {lastDetection && lastDetection.violation && (
          <div className="absolute top-2 left-2 right-2 bg-red-600 text-white text-xs p-2 rounded-lg animate-pulse">
            <AlertTriangle className="h-3 w-3 inline mr-1" />
            {lastDetection.violation_details?.message || 'Suspicious activity detected'}
          </div>
        )}
      </div>
      
      {/* Status Indicators */}
      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
        <div className="bg-gray-700 rounded p-1 text-center">
          <span className="text-gray-400">Violations:</span>
          <span className={`ml-1 font-bold ${violationCount > 0 ? 'text-red-400' : 'text-green-400'}`}>
            {violationCount}
          </span>
        </div>
        <div className="bg-gray-700 rounded p-1 text-center">
          <span className="text-gray-400">Status:</span>
          <span className={`ml-1 font-bold ${webcamActive ? 'text-green-400' : 'text-red-400'}`}>
            {webcamActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>
      
      {/* Detection Details */}
      {lastDetection && lastDetection.persons > 0 && (
        <div className="mt-2 text-xs text-gray-400">
          <div className="flex justify-between">
            <span>Persons: {lastDetection.persons}</span>
            <span>Faces: {lastDetection.faces || 0}</span>
            {lastDetection.mobile && <span className="text-red-400">📱 Mobile</span>}
            {lastDetection.laptop && <span className="text-red-400">💻 Laptop</span>}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProctoringMonitor;