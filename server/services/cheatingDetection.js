const CheatingLog = require('../models/CheatingLog');
const TestSession = require('../models/TestSession');
const WebSocket = require('ws');

// Cheating violation types with severity and penalties
const VIOLATION_TYPES = {
  TAB_SWITCH: {
    type: 'tab_switch',
    severity: 'medium',
    penalty: 30, // seconds
    maxWarnings: 3
  },
  COPY_PASTE: {
    type: 'copy_paste',
    severity: 'medium',
    penalty: 30,
    maxWarnings: 3
  },
  RIGHT_CLICK: {
    type: 'right_click',
    severity: 'low',
    penalty: 15,
    maxWarnings: 3
  },
  KEYBOARD_SHORTCUT: {
    type: 'keyboard_shortcut',
    severity: 'medium',
    penalty: 30,
    maxWarnings: 3
  },
  MULTIPLE_PERSONS: {
    type: 'multiple_persons',
    severity: 'high',
    penalty: 60,
    maxWarnings: 2
  },
  PHONE_DETECTED: {
    type: 'phone_detected',
    severity: 'high',
    penalty: 60,
    maxWarnings: 2
  },
  FACE_NOT_VISIBLE: {
    type: 'face_not_visible',
    severity: 'low',
    penalty: 10,
    maxWarnings: 5
  },
  LOOKING_AWAY: {
    type: 'looking_away',
    severity: 'low',
    penalty: 10,
    maxWarnings: 5
  },
  FULLSCREEN_EXIT: {
    type: 'fullscreen_exit',
    severity: 'medium',
    penalty: 30,
    maxWarnings: 3
  },
  DEVTOOLS: {
    type: 'devtools',
    severity: 'high',
    penalty: 60,
    maxWarnings: 2
  }
};

// Log cheating incident
const logCheatingIncident = async (studentId, testId, sessionId, violationType, screenshot = null) => {
  try {
    const violation = VIOLATION_TYPES[violationType.toUpperCase()];
    if (!violation) {
      throw new Error('Invalid violation type');
    }
    
    // Get current session to check warning count
    const session = await TestSession.findById(sessionId);
    const warningCount = (session?.cheatingIncidents?.length || 0) + 1;
    
    // Calculate penalty based on warning count
    let penalty = violation.penalty;
    if (warningCount >= violation.maxWarnings) {
      penalty = violation.penalty * 2; // Double penalty for exceeding max warnings
    }
    
    // Create cheating log
    const cheatingLog = await CheatingLog.create({
      studentId,
      testId,
      sessionId,
      violationType: violation.type,
      severity: violation.severity,
      penalty,
      warningCount,
      screenshot,
      timestamp: new Date()
    });
    
    // Update test session
    if (session) {
      session.cheatingIncidents.push({
        type: violation.type,
        timestamp: new Date(),
        penalty,
        warningCount
      });
      session.totalPenalty += penalty;
      await session.save();
    }
    
    // Check if test should be terminated
    const shouldTerminate = warningCount >= violation.maxWarnings;
    
    return {
      success: true,
      cheatingLog,
      penalty,
      warningCount,
      shouldTerminate,
      message: getViolationMessage(violation.type, warningCount, violation.maxWarnings)
    };
  } catch (error) {
    console.error('Error logging cheating incident:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get violation message
const getViolationMessage = (violationType, warningCount, maxWarnings) => {
  const messages = {
    tab_switch: `Tab switching detected. ${getWarningMessage(warningCount, maxWarnings)}`,
    copy_paste: `Copy/Paste attempt detected. ${getWarningMessage(warningCount, maxWarnings)}`,
    right_click: `Right-click detected. ${getWarningMessage(warningCount, maxWarnings)}`,
    keyboard_shortcut: `Keyboard shortcut detected. ${getWarningMessage(warningCount, maxWarnings)}`,
    multiple_persons: `Multiple persons detected in frame. ${getWarningMessage(warningCount, maxWarnings)}`,
    phone_detected: `Mobile phone detected. ${getWarningMessage(warningCount, maxWarnings)}`,
    face_not_visible: `Face not visible. Please look at the camera. ${getWarningMessage(warningCount, maxWarnings)}`,
    looking_away: `Looking away from screen detected. ${getWarningMessage(warningCount, maxWarnings)}`,
    fullscreen_exit: `Fullscreen mode exited. ${getWarningMessage(warningCount, maxWarnings)}`,
    devtools: `Developer tools detected. ${getWarningMessage(warningCount, maxWarnings)}`
  };
  
  return messages[violationType] || `Cheating detected: ${violationType}`;
};

// Get warning message based on count
const getWarningMessage = (current, max) => {
  if (current >= max) {
    return `This is your FINAL warning. Test will be terminated on next violation.`;
  }
  return `Warning ${current}/${max}. Further violations will result in penalties.`;
};

// Process webcam frame for cheating detection
const analyzeWebcamFrame = async (frameData) => {
  // This would integrate with computer vision API
  // For now, return simulated results
  return {
    faceDetected: true,
    faceCount: 1,
    phoneDetected: false,
    lookingAway: false,
    eyeContact: true
  };
};

// Calculate final penalty for test session
const calculateFinalPenalty = async (sessionId) => {
  const session = await TestSession.findById(sessionId);
  if (!session) return 0;
  
  // Calculate total penalty from cheating incidents
  const totalPenalty = session.cheatingIncidents.reduce((sum, incident) => sum + (incident.penalty || 0), 0);
  
  // Apply multiplier based on severity
  const severityMultiplier = {
    low: 1,
    medium: 1.5,
    high: 2
  };
  
  let adjustedPenalty = totalPenalty;
  for (const incident of session.cheatingIncidents) {
    const violation = VIOLATION_TYPES[incident.type.toUpperCase()];
    if (violation) {
      adjustedPenalty += totalPenalty * (severityMultiplier[violation.severity] - 1);
    }
  }
  
  return Math.min(adjustedPenalty, 300); // Max 5 minutes penalty
};

// Get cheating statistics for a test
const getCheatingStatistics = async (testId) => {
  try {
    const stats = await CheatingLog.aggregate([
      { $match: { testId: testId } },
      { $group: {
        _id: '$violationType',
        count: { $sum: 1 },
        totalPenalty: { $sum: '$penalty' }
      }},
      { $sort: { count: -1 } }
    ]);
    
    const totalIncidents = await CheatingLog.countDocuments({ testId });
    const uniqueStudents = await CheatingLog.distinct('studentId', { testId });
    
    return {
      totalIncidents,
      uniqueStudents: uniqueStudents.length,
      violationsByType: stats,
      averagePenalty: totalIncidents > 0 
        ? stats.reduce((sum, s) => sum + s.totalPenalty, 0) / totalIncidents 
        : 0
    };
  } catch (error) {
    console.error('Error getting cheating statistics:', error);
    return null;
  }
};

// Real-time cheating monitor (WebSocket handler)
const setupCheatingMonitor = (io) => {
  io.on('connection', (socket) => {
    console.log('Client connected to cheating monitor');
    
    socket.on('cheating-alert', async (data) => {
      const { studentId, testId, sessionId, violationType, screenshot } = data;
      
      const result = await logCheatingIncident(studentId, testId, sessionId, violationType, screenshot);
      
      // Broadcast to admin panel
      io.emit('cheating-notification', {
        studentId,
        testId,
        violationType,
        timestamp: new Date(),
        severity: VIOLATION_TYPES[violationType.toUpperCase()]?.severity
      });
      
      // Send response to student
      socket.emit('cheating-response', {
        penalty: result.penalty,
        warningCount: result.warningCount,
        shouldTerminate: result.shouldTerminate,
        message: result.message
      });
      
      // Terminate test if needed
      if (result.shouldTerminate) {
        await TestSession.findByIdAndUpdate(sessionId, { status: 'terminated' });
        socket.emit('test-terminated', {
          message: 'Your test has been terminated due to multiple cheating violations.'
        });
      }
    });
  });
};

module.exports = {
  VIOLATION_TYPES,
  logCheatingIncident,
  analyzeWebcamFrame,
  calculateFinalPenalty,
  getCheatingStatistics,
  setupCheatingMonitor
};