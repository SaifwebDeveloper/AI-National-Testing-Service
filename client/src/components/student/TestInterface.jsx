import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Clock, AlertCircle, CheckCircle, ChevronLeft, ChevronRight, 
  Flag, Camera, Monitor, Shield, AlertTriangle, Wifi, WifiOff, 
  Maximize2, Brain, User, Grid, ChevronsLeft, ChevronsRight,
  XCircle, SkipForward, BookOpen, Award, HelpCircle,
  Save, Move, Minimize2, Maximize, FileText, Calendar,
  Wifi as WifiIcon, Eye, EyeOff
} from 'lucide-react';
import axios from 'axios';

const TestInterface = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [markedForReview, setMarkedForReview] = useState([]);
  const [skippedQuestions, setSkippedQuestions] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [testDetails, setTestDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [showInstructions, setShowInstructions] = useState(true);
  const [cheatingWarnings, setCheatingWarnings] = useState(0);
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [currentPalettePage, setCurrentPalettePage] = useState(0);
  const QUESTIONS_PER_PAGE = 15;
  
  // WebSocket Proctoring States
  const [wsConnected, setWsConnected] = useState(false);
  const [proctoringStatus, setProctoringStatus] = useState({
    canContinue: true,
    hasViolations: false,
    violations: [],
    warnings: [],
    totalViolations: 0,
    faceDetected: true,
    lastAlert: null
  });
  const [testBlocked, setTestBlocked] = useState(false);
  const [proctoringActive, setProctoringActive] = useState(false);
  const wsRef = useRef(null);
  const proctoringIntervalRef = useRef(null);
  const reconnectAttempts = useRef(0);
  
  // Proctoring states
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [webcamActive, setWebcamActive] = useState(false);
  const [webcamStream, setWebcamStream] = useState(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [networkStatus, setNetworkStatus] = useState(true);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showFullscreenWarning, setShowFullscreenWarning] = useState(false);
  
  const timerRef = useRef(null);
  const autoSaveInterval = useRef(null);
  const videoRef = useRef(null);

  // WebSocket Connection Functions
  const connectWebSocket = () => {
    return new Promise((resolve, reject) => {
      try {
        const ws = new WebSocket('ws://localhost:8765');
        
        ws.onopen = () => {
          console.log('Connected to proctoring server');
          setWsConnected(true);
          reconnectAttempts.current = 0;
          
          ws.send(JSON.stringify({
            type: 'init',
            session_id: sessionId || testId
          }));
          resolve();
        };
        
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          handleProctoringMessage(data);
        };
        
        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          setWsConnected(false);
          reject(error);
        };
        
        ws.onclose = () => {
          console.log('Disconnected from proctoring server');
          setWsConnected(false);
          
          if (reconnectAttempts.current < 3 && proctoringActive) {
            setTimeout(() => {
              reconnectAttempts.current++;
              connectWebSocket().catch(console.error);
            }, 2000);
          }
        };
        
        wsRef.current = ws;
      } catch (error) {
        console.error('Failed to create WebSocket:', error);
        reject(error);
      }
    });
  };
  
  const handleProctoringMessage = (data) => {
    if (data.type === 'analysis') {
      setProctoringStatus({
        canContinue: data.can_continue,
        hasViolations: data.has_violations,
        violations: data.violations,
        warnings: data.warnings,
        totalViolations: data.total_violations,
        faceDetected: data.face_detected,
        lastAlert: new Date()
      });
      
      if (data.has_violations && data.violations.length > 0) {
        data.violations.forEach(violation => {
          showToast(violation.message, 'warning');
          addCheatingWarning(violation.type, violation.message);
        });
      }
      
      if (data.warnings && data.warnings.length > 0) {
        data.warnings.forEach(warning => {
          showToast(warning.message, 'info');
        });
      }
      
      if (!data.can_continue && !testBlocked) {
        setTestBlocked(true);
        showToast('Test terminated due to multiple violations!', 'error');
        submitTest(true);
      }
      
      if (data.total_violations !== cheatingWarnings) {
        setCheatingWarnings(data.total_violations);
      }
    }
    
    if (data.type === 'terminate') {
      setTestBlocked(true);
      showToast(data.message, 'error');
      submitTest(true);
    }
  };
  
  const sendFrameForAnalysis = () => {
    if (videoRef.current && videoRef.current.videoWidth > 0 && wsRef.current && wsRef.current.readyState === WebSocket.OPEN && !testBlocked) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const frameData = canvas.toDataURL('image/jpeg', 0.5);
      
      wsRef.current.send(JSON.stringify({
        type: 'frame',
        session_id: sessionId || testId,
        image: frameData
      }));
    }
  };
  
  const startProctoring = async () => {
    setProctoringActive(true);
    try {
      await connectWebSocket();
      
      proctoringIntervalRef.current = setInterval(() => {
        sendFrameForAnalysis();
      }, 2000);
    } catch (error) {
      console.error('Failed to start proctoring:', error);
      showToast('Proctoring service unavailable. Continuing without AI monitoring.', 'warning');
    }
  };
  
  const stopProctoring = () => {
    setProctoringActive(false);
    if (proctoringIntervalRef.current) {
      clearInterval(proctoringIntervalRef.current);
      proctoringIntervalRef.current = null;
    }
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'close',
        session_id: sessionId || testId
      }));
      wsRef.current.close();
    }
  };
  
  // Proctoring Status Component
  const ProctoringStatusBar = () => (
    <div className="fixed top-20 right-4 z-50 bg-white rounded-xl shadow-lg p-3 border border-gray-200 min-w-[200px]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-blue-600" />
          <span className="text-xs font-semibold text-gray-700">AI Proctoring</span>
        </div>
        <div className={`flex items-center gap-1 ${wsConnected ? 'text-green-600' : 'text-red-600'}`}>
          <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
          <span className="text-xs">{wsConnected ? 'Active' : 'Connecting...'}</span>
        </div>
      </div>
      
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">Face Status:</span>
          <span className={proctoringStatus.faceDetected ? 'text-green-600' : 'text-red-600'}>
            {proctoringStatus.faceDetected ? 'Detected ✓' : 'Not Detected ✗'}
          </span>
        </div>
        
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">Violations:</span>
          <span className={`font-semibold ${cheatingWarnings === 0 ? 'text-green-600' : cheatingWarnings >= 2 ? 'text-red-600' : 'text-yellow-600'}`}>
            {cheatingWarnings}/3
          </span>
        </div>
        
        {proctoringStatus.violations.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-100">
            <div className="text-xs text-red-600 font-medium">Recent Violations:</div>
            {proctoringStatus.violations.slice(-2).map((v, i) => (
              <div key={i} className="text-xs text-red-500 mt-1">{v.message}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Get student info from localStorage
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setStudentName(user.name || 'Student');
      setStudentId(user.id || user._id || 'N/A');
    }
    
    window.history.pushState(null, null, window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, null, window.location.href);
      addCheatingWarning('back_navigation', 'Back button pressed');
    };
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
      stopProctoring();
    };
  }, []);

  // Fullscreen handling
  const enterFullscreen = async () => {
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
        setIsFullscreen(true);
        setShowFullscreenWarning(false);
      }
    } catch (error) {
      setShowFullscreenWarning(true);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isNowFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isNowFullscreen);
      
      if (!isNowFullscreen && timeLeft > 0 && timeLeft < 999999 && !showInstructions && !submitting) {
        addCheatingWarning('fullscreen_exit', 'Fullscreen mode exited');
        setShowFullscreenWarning(true);
        setTimeout(enterFullscreen, 2000);
      } else if (isNowFullscreen) {
        setShowFullscreenWarning(false);
      }
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [timeLeft, showInstructions, submitting]);

  const setupWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' } 
      });
      setWebcamStream(stream);
      if (videoRef.current) videoRef.current.srcObject = stream;
      setWebcamActive(true);
      setPermissionDenied(false);
      
      setTimeout(() => {
        startProctoring();
      }, 2000);
    } catch (error) {
      setPermissionDenied(true);
      addCheatingWarning('webcam_error', 'Webcam access denied');
    }
  };

  const logCheatingAttempt = async (type, details) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/tests/cheating-log/${testId}`, {
        sessionId, violationType: type, details, warningCount: cheatingWarnings
      }, { headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
    } catch (error) {}
  };

  const addCheatingWarning = async (type, message) => {
    const newWarningCount = cheatingWarnings + 1;
    setCheatingWarnings(newWarningCount);
    
    if (newWarningCount === 2) {
      setTimeLeft(prev => Math.max(0, prev - 30));
      showToast('⚠️ 30 seconds deducted for violation!', 'warning');
    } else if (newWarningCount >= 3) {
      showToast('❌ Test terminated due to multiple violations!', 'error');
      submitTest(true);
    }
    
    const warningDiv = document.createElement('div');
    warningDiv.className = `fixed top-24 left-4 right-4 z-50 p-3 rounded-lg text-center ${newWarningCount >= 2 ? 'bg-red-600' : 'bg-yellow-600'} text-white shadow-lg animate-pulse`;
    warningDiv.innerHTML = `<p class="text-sm font-medium">⚠️ Warning ${newWarningCount}/3: ${message}</p>`;
    document.body.appendChild(warningDiv);
    setTimeout(() => warningDiv.remove(), 4000);
    
    await logCheatingAttempt(type, `${message} | Warning ${newWarningCount}/3`);
  };

  const showToast = (message, type = 'info') => {
    const toastDiv = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-green-600' : type === 'warning' ? 'bg-orange-500' : type === 'error' ? 'bg-red-600' : 'bg-blue-600';
    toastDiv.className = `fixed bottom-4 right-4 z-50 p-3 rounded-lg shadow-lg ${bgColor} text-white text-sm animate-bounce`;
    toastDiv.innerHTML = message;
    document.body.appendChild(toastDiv);
    setTimeout(() => toastDiv.remove(), 3000);
  };

  // Anti-cheating measures
  useEffect(() => {
    if (showInstructions) return;
    const preventContextMenu = (e) => { e.preventDefault(); addCheatingWarning('right_click', 'Right-click disabled'); };
    const preventCopyPaste = (e) => { e.preventDefault(); addCheatingWarning('copy_paste', 'Copy-paste disabled'); };
    const preventKeyEvents = (e) => {
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) || (e.ctrlKey && e.key === 'u')) {
        e.preventDefault(); addCheatingWarning('devtools', 'DevTools shortcut detected');
      }
      if (e.ctrlKey && ['c', 'v', 'x', 'p', 's', 'u', 'a'].includes(e.key.toLowerCase())) {
        e.preventDefault(); addCheatingWarning('keyboard_shortcut', `Ctrl+${e.key.toUpperCase()} disabled`);
      }
    };
    const handleVisibilityChange = () => { if (document.hidden) { setTabSwitchCount(prev => prev + 1); addCheatingWarning('tab_switch', `Tab switch detected (${tabSwitchCount + 1}/3)`); } };
    
    document.addEventListener('contextmenu', preventContextMenu);
    document.addEventListener('copy', preventCopyPaste);
    document.addEventListener('paste', preventCopyPaste);
    document.addEventListener('cut', preventCopyPaste);
    document.addEventListener('keydown', preventKeyEvents);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('contextmenu', preventContextMenu);
      document.removeEventListener('copy', preventCopyPaste);
      document.removeEventListener('paste', preventCopyPaste);
      document.removeEventListener('cut', preventCopyPaste);
      document.removeEventListener('keydown', preventKeyEvents);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [showInstructions]);

  const fetchTest = async () => {
    try {
      const token = localStorage.getItem('token');
      sessionStorage.setItem(`test_${testId}_started`, Date.now().toString());
      sessionStorage.setItem(`test_${testId}_active`, 'true');
      
      const response = await axios.post(`http://localhost:5000/api/tests/start/${testId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setQuestions(response.data.questions || []);
      setTestDetails(response.data.test);
      setSessionId(response.data.sessionId);
      setTimeLeft(response.data.test.duration * 60);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to load test');
      window.location.href = '/student/tests';
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTest(); }, [testId]);

  useEffect(() => {
    if (timeLeft > 0 && !loading && questions.length > 0 && !showInstructions) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => { if (prev <= 1) { clearInterval(timerRef.current); submitTest(); return 0; } return prev - 1; });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [loading, questions, showInstructions]);

  const handleAnswer = (questionId, optionIndex) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
    if (skippedQuestions.includes(questionId)) setSkippedQuestions(prev => prev.filter(id => id !== questionId));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) setCurrentIndex(prev => prev + 1);
  };

  const handlePrevious = () => {
    if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
  };

  const handleSkip = () => {
    const currentQId = questions[currentIndex]?._id;
    if (!skippedQuestions.includes(currentQId) && !answers[currentQId]) {
      setSkippedQuestions(prev => [...prev, currentQId]);
      showToast('Question skipped. You can return to it later.', 'info');
    }
    if (currentIndex < questions.length - 1) setCurrentIndex(prev => prev + 1);
  };

  const handleFlag = () => {
    const currentQId = questions[currentIndex]?._id;
    const isMarked = markedForReview.includes(currentQId);
    setMarkedForReview(prev => prev.includes(currentQId) ? prev.filter(id => id !== currentQId) : [...prev, currentQId]);
    showToast(isMarked ? 'Removed from review list' : 'Question flagged for review', 'info');
  };

  const submitTest = async (isForced = false) => {
    if (submitting) return;
    setSubmitting(true);
    
    stopProctoring();
    
    try {
      const token = localStorage.getItem('token');
      const totalTime = testDetails?.duration * 60 || 0;
      const response = await axios.post(`http://localhost:5000/api/tests/submit/${testId}`, {
        answers, timeSpent: totalTime - timeLeft, sessionId, cheatingWarnings, tabSwitchCount, skippedQuestions
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      clearInterval(timerRef.current);
      localStorage.removeItem(`test_progress_${testId}`);
      sessionStorage.removeItem(`test_${testId}_active`);
      if (webcamStream) webcamStream.getTracks().forEach(track => track.stop());
      if (document.exitFullscreen) document.exitFullscreen();
      
      window.location.href = `/student/result/${response.data.resultId}`;
    } catch (error) {
      alert('Error submitting test. Please try again.');
    } finally {
      setSubmitting(false);
      setShowSubmitModal(false);
    }
  };

  const handleStartTest = async () => {
    setShowInstructions(false);
    await enterFullscreen();
    await setupWebcam();
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-50 to-white flex items-center justify-center">
        <div className="text-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div><p className="text-gray-600">Loading AINTS Test...</p></div>
      </div>
    );
  }

  if (showInstructions) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-50 to-white flex items-center justify-center p-4">
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl max-w-2xl w-full p-8 border border-white/60 shadow-2xl">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-xl"><Brain className="h-8 w-8 text-white" /></div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">AINTS</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Test Instructions</h1>
            <p className="text-gray-500 mt-1">AI-Proctored Assessment</p>
          </div>
          
          <div className="space-y-4 mb-8">
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-2">📋 Test Information</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <p><strong>Test:</strong> {testDetails?.title}</p>
                <p><strong>Duration:</strong> {testDetails?.duration} min</p>
                <p><strong>Questions:</strong> {questions.length}</p>
                <p><strong>Total Marks:</strong> {testDetails?.totalMarks}</p>
              </div>
            </div>
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-600" />AI Proctoring Rules</h3>
              <div className="grid grid-cols-2 gap-1 text-sm">
                <li>✅ Fullscreen required</li><li>✅ Webcam mandatory</li>
                <li>❌ No tab switching</li><li>❌ Copy-paste disabled</li>
                <li>📸 Periodic snapshots</li><li>🤖 AI violation detection</li>
                <li>⚠️ 3 violations = auto-submit</li>
              </div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-2">🎯 Test Guidelines</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Keep your face clearly visible in the camera</li>
                <li>• Ensure proper lighting in the room</li>
                <li>• Do not cover the camera or leave your seat</li>
                <li>• Only one person should be visible on camera</li>
              </ul>
            </div>
          </div>
          
          <div className="flex gap-4">
            <button onClick={() => window.close()} className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200">Cancel</button>
            <button onClick={handleStartTest} className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg flex items-center justify-center gap-2">Start Test</button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const totalPalettePages = Math.ceil(questions.length / QUESTIONS_PER_PAGE);
  const startIndex = currentPalettePage * QUESTIONS_PER_PAGE;
  const visibleQuestions = questions.slice(startIndex, startIndex + QUESTIONS_PER_PAGE);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-50 to-white">
      {/* Fullscreen Warning */}
      {showFullscreenWarning && !isFullscreen && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center">
          <div className="text-center p-8">
            <Maximize2 className="h-20 w-20 text-yellow-500 mx-auto mb-4 animate-pulse" />
            <h2 className="text-3xl font-bold text-white">Fullscreen Required!</h2>
            <button onClick={enterFullscreen} className="mt-6 px-8 py-3 bg-yellow-500 text-white rounded-xl">Enter Fullscreen</button>
          </div>
        </div>
      )}

      {/* AI Proctoring Status Bar */}
      <ProctoringStatusBar />

      {/* Top Bar - Student Info Left, Timer Right */}
      <div className="fixed top-0 left-0 right-0 bg-white shadow-md p-4 z-40">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-xl">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">AINTS</h1>
                <p className="text-xs text-gray-500">AI Integrated National Testing Service</p>
              </div>
            </div>
            <div className="h-8 w-px bg-gray-300"></div>
            <div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="font-semibold text-gray-700">{studentName}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                <FileText className="h-3 w-3" />
                <span>Test ID: {testId?.slice(-8)}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2 rounded-xl shadow-lg">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-white" />
                <span className="text-2xl font-bold font-mono text-white">{formatTime(timeLeft)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Webcam Window */}
      <div className="fixed bottom-4 right-4 z-50 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="h-3 w-3 text-white" />
            <span className="text-white text-xs">Proctoring Camera</span>
          </div>
          {wsConnected && <WifiIcon className="h-3 w-3 text-green-400" />}
        </div>
        <div className="p-2">
          <video ref={videoRef} autoPlay playsInline muted className="w-full rounded-lg bg-gray-900" />
          {permissionDenied && <p className="text-red-500 text-xs text-center mt-1">Camera access required</p>}
          {wsConnected && proctoringStatus.faceDetected && (
            <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">Face Detected</div>
          )}
          {wsConnected && !proctoringStatus.faceDetected && (
            <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">No Face</div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-24 pb-8 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Sidebar - Question Palette */}
            <div className="lg:col-span-1 order-2 lg:order-1">
              <div className="bg-white rounded-2xl shadow-lg p-4 sticky top-28">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-800">Questions</h3>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{answeredCount}/{questions.length}</span>
                </div>
                
                {totalPalettePages > 1 && (
                  <div className="flex items-center justify-between mb-3">
                    <button onClick={() => setCurrentPalettePage(p => Math.max(0, p-1))} disabled={currentPalettePage === 0} className="p-1 rounded bg-gray-100 disabled:opacity-50"><ChevronsLeft className="h-4 w-4" /></button>
                    <span className="text-xs text-gray-500">Page {currentPalettePage + 1} of {totalPalettePages}</span>
                    <button onClick={() => setCurrentPalettePage(p => Math.min(totalPalettePages-1, p+1))} disabled={currentPalettePage === totalPalettePages-1} className="p-1 rounded bg-gray-100 disabled:opacity-50"><ChevronsRight className="h-4 w-4" /></button>
                  </div>
                )}
                
                <div className="grid grid-cols-5 gap-2">
                  {visibleQuestions.map((q, idx) => {
                    const actualIdx = startIndex + idx;
                    const qId = q._id;
                    let status = 'unanswered';
                    if (answers[qId] !== undefined) status = 'answered';
                    else if (markedForReview.includes(qId)) status = 'marked';
                    else if (skippedQuestions.includes(qId)) status = 'skipped';
                    
                    const colors = { answered: 'bg-green-500 text-white', marked: 'bg-yellow-500 text-white', skipped: 'bg-blue-400 text-white', unanswered: 'bg-gray-200 text-gray-600' };
                    return (
                      <button key={actualIdx} onClick={() => setCurrentIndex(actualIdx)} className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${colors[status]} ${currentIndex === actualIdx ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}>
                        {actualIdx + 1}
                      </button>
                    );
                  })}
                </div>
                
                <div className="flex flex-wrap justify-center gap-2 mt-3 pt-2 border-t">
                  <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-500 rounded"></div><span className="text-xs">Ans</span></div>
                  <div className="flex items-center gap-1"><div className="w-3 h-3 bg-yellow-500 rounded"></div><span className="text-xs">Flag</span></div>
                  <div className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-400 rounded"></div><span className="text-xs">Skip</span></div>
                  <div className="flex items-center gap-1"><div className="w-3 h-3 bg-gray-300 rounded"></div><span className="text-xs">Pending</span></div>
                </div>
              </div>
            </div>

            {/* Center - MCQ Area */}
            <div className="lg:col-span-3 order-1 lg:order-2">
              <div className="bg-white rounded-2xl shadow-xl p-8">
                {/* Question Header */}
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold">Q{currentIndex + 1}</div>
                    <div className="flex items-center gap-1 text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                      <Award className="h-3.5 w-3.5" />{currentQuestion?.marks || 0} marks
                    </div>
                  </div>
                  <button onClick={handleFlag} className={`flex items-center gap-2 px-4 py-2 rounded-xl transition text-sm ${markedForReview.includes(currentQuestion?._id) ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                    <Flag className="h-4 w-4" />{markedForReview.includes(currentQuestion?._id) ? 'Flagged' : 'Flag'}
                  </button>
                </div>

                <p className="text-xl text-gray-800 mb-8 leading-relaxed">{currentQuestion?.text}</p>

                <div className="space-y-3 mb-8">
                  {currentQuestion?.options?.map((option, idx) => {
                    const isSelected = answers[currentQuestion._id] === idx;
                    const letters = ['A', 'B', 'C', 'D', 'E'];
                    return (
                      <label key={idx} className={`flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all ${isSelected ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/30'}`}>
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-3 font-bold text-sm ${isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>{letters[idx]}</div>
                        <input type="radio" name="answer" value={idx} checked={isSelected} onChange={() => handleAnswer(currentQuestion._id, idx)} className="hidden" />
                        <span className="text-gray-700 flex-1">{option}</span>
                        {isSelected && <CheckCircle className="h-5 w-5 text-blue-600" />}
                      </label>
                    );
                  })}
                </div>

                {/* Action Buttons - Submit Test Button Added Here */}
                <div className="flex flex-wrap gap-3 justify-center pt-4 border-t border-gray-200">
                  <button onClick={handlePrevious} disabled={currentIndex === 0} className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium transition">
                    <ChevronLeft className="h-4 w-4" /> Previous
                  </button>
                  <button onClick={handleSkip} className="px-5 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 flex items-center gap-2 font-medium transition">
                    <SkipForward className="h-4 w-4" /> Skip
                  </button>
                  <button onClick={handleFlag} className={`px-5 py-2.5 rounded-xl flex items-center gap-2 font-medium transition ${markedForReview.includes(currentQuestion?._id) ? 'bg-yellow-500 text-white hover:bg-yellow-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                    <Flag className="h-4 w-4" /> {markedForReview.includes(currentQuestion?._id) ? 'Flagged' : 'Flag'}
                  </button>
                  <button onClick={handleNext} disabled={currentIndex === questions.length - 1} className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium transition">
                    Next <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                {/* SUBMIT TEST BUTTON - Added as a separate row for visibility */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <button 
                    onClick={() => setShowSubmitModal(true)}
                    className="w-full py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="h-5 w-5" />
                    Submit Test
                  </button>
                  <p className="text-center text-xs text-gray-400 mt-2">
                    You have answered {answeredCount} out of {questions.length} questions
                  </p>
                </div>

                {/* Progress Indicator */}
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-500">Question {currentIndex + 1} of {questions.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center"><AlertCircle className="h-6 w-6 text-yellow-600" /></div>
              <h3 className="text-xl font-bold text-gray-800">Submit Test</h3>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <div className="flex justify-between py-1"><span>Answered:</span><span className="font-semibold">{answeredCount}/{questions.length}</span></div>
              <div className="flex justify-between py-1"><span>Flagged:</span><span className="font-semibold">{markedForReview.length}</span></div>
              <div className="flex justify-between py-1"><span>Skipped:</span><span className="font-semibold">{skippedQuestions.length}</span></div>
              <div className="flex justify-between py-1"><span>Time Remaining:</span><span className="font-semibold">{formatTime(timeLeft)}</span></div>
              <div className="flex justify-between py-1"><span>AI Warnings:</span><span className="font-semibold text-yellow-600">{cheatingWarnings}/3</span></div>
            </div>
            <p className="text-sm text-red-600 mb-4">⚠️ Once submitted, you cannot change your answers!</p>
            <div className="flex gap-3">
              <button onClick={() => setShowSubmitModal(false)} className="flex-1 px-4 py-2 bg-gray-100 rounded-xl hover:bg-gray-200">Cancel</button>
              <button onClick={() => submitTest(false)} disabled={submitting} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700">
                {submitting ? 'Submitting...' : 'Submit Test'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestInterface;