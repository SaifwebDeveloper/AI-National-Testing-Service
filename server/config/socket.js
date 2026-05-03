const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const TestSession = require('../models/TestSession');

// Store connected users
const connectedUsers = new Map();
const testRooms = new Map();

// Mock cheating detection if service doesn't exist
const logCheatingIncident = async (studentId, testId, sessionId, violationType, screenshot) => {
  // Simple implementation without external service
  const penalty = 30;
  const warningCount = 1;
  const shouldTerminate = false;
  const severity = 'medium';
  
  return {
    penalty,
    warningCount,
    shouldTerminate,
    severity,
    message: `Warning: ${violationType} detected`
  };
};

// Initialize Socket.IO
const initSocket = (server) => {
  const io = socketIO(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }
      
      socket.user = user;
      socket.userId = user._id.toString();
      next();
    } catch (error) {
      console.error('Socket auth error:', error.message);
      next(new Error('Authentication error: ' + error.message));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id} (User: ${socket.userId})`);
    
    // Store connected user
    connectedUsers.set(socket.userId, {
      socketId: socket.id,
      userId: socket.userId,
      connectedAt: new Date()
    });
    
    // Join test room
    socket.on('join-test', async (data) => {
      const { testId, sessionId } = data;
      
      try {
        if (!testId || !sessionId) {
          socket.emit('error', { message: 'Test ID and Session ID are required' });
          return;
        }
        
        // Verify student has access to this test
        const session = await TestSession.findById(sessionId);
        if (!session) {
          socket.emit('error', { message: 'Test session not found' });
          return;
        }
        
        if (session.studentId.toString() !== socket.userId) {
          socket.emit('error', { message: 'Not authorized to join this test' });
          return;
        }
        
        socket.join(`test-${testId}`);
        socket.testId = testId;
        socket.sessionId = sessionId;
        
        // Store room info
        if (!testRooms.has(testId)) {
          testRooms.set(testId, new Set());
        }
        testRooms.get(testId).add(socket.userId);
        
        socket.emit('joined-test', { testId, sessionId });
        console.log(`📝 User ${socket.userId} joined test ${testId}`);
      } catch (error) {
        console.error('Join test error:', error);
        socket.emit('error', { message: 'Failed to join test: ' + error.message });
      }
    });
    
    // Handle cheating alert
    socket.on('cheating-alert', async (data) => {
      const { violationType, screenshot } = data;
      
      try {
        if (!socket.testId || !socket.sessionId) {
          socket.emit('error', { message: 'Not in a test session' });
          return;
        }
        
        const result = await logCheatingIncident(
          socket.userId,
          socket.testId,
          socket.sessionId,
          violationType || 'unknown',
          screenshot
        );
        
        // Send response to student
        socket.emit('cheating-response', {
          penalty: result.penalty,
          warningCount: result.warningCount,
          shouldTerminate: result.shouldTerminate,
          message: result.message
        });
        
        // Notify admin room
        io.to('admin-room').emit('cheating-notification', {
          studentId: socket.userId,
          testId: socket.testId,
          violationType: violationType || 'unknown',
          timestamp: new Date(),
          severity: result.severity || 'medium'
        });
        
        // Terminate test if needed
        if (result.shouldTerminate) {
          await TestSession.findByIdAndUpdate(socket.sessionId, { status: 'terminated' });
          socket.emit('test-terminated', {
            message: 'Your test has been terminated due to multiple cheating violations.'
          });
          socket.disconnect();
        }
        
        console.log(`⚠️ Cheating detected: User ${socket.userId} - ${violationType}`);
      } catch (error) {
        console.error('Cheating alert error:', error);
        socket.emit('error', { message: 'Failed to process cheating alert' });
      }
    });
    
    // Handle answer submission (real-time save)
    socket.on('save-answer', async (data) => {
      const { questionId, answer } = data;
      
      try {
        if (!socket.sessionId) {
          socket.emit('error', { message: 'No active test session' });
          return;
        }
        
        const session = await TestSession.findById(socket.sessionId);
        if (!session) {
          socket.emit('error', { message: 'Test session not found' });
          return;
        }
        
        // Update or add answer
        const answerIndex = session.answers.findIndex(a => 
          a.questionId && a.questionId.toString() === questionId
        );
        
        if (answerIndex !== -1) {
          session.answers[answerIndex].selectedOption = answer;
          session.answers[answerIndex].answeredAt = new Date();
        } else {
          session.answers.push({
            questionId,
            selectedOption: answer,
            answeredAt: new Date()
          });
        }
        
        await session.save();
        socket.emit('answer-saved', { questionId, answer, success: true });
      } catch (error) {
        console.error('Save answer error:', error);
        socket.emit('error', { message: 'Failed to save answer: ' + error.message });
      }
    });
    
    // Handle progress update
    socket.on('progress-update', async (data) => {
      const { timeLeft, currentQuestion } = data;
      
      try {
        if (!socket.sessionId) return;
        
        await TestSession.findByIdAndUpdate(socket.sessionId, {
          timeLeft: timeLeft,
          currentQuestion: currentQuestion,
          lastActivity: new Date()
        });
      } catch (error) {
        console.error('Progress update error:', error);
      }
    });
    
    // Handle admin join admin room
    socket.on('join-admin', () => {
      if (socket.user && socket.user.role === 'admin') {
        socket.join('admin-room');
        socket.emit('joined-admin', { success: true });
        console.log(`👑 Admin ${socket.userId} joined admin room`);
      } else {
        socket.emit('error', { message: 'Not authorized to join admin room' });
      }
    });
    
    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id} (User: ${socket.userId})`);
      
      // Remove from connected users
      connectedUsers.delete(socket.userId);
      
      // Remove from test room
      if (socket.testId && testRooms.has(socket.testId)) {
        testRooms.get(socket.testId).delete(socket.userId);
        if (testRooms.get(socket.testId).size === 0) {
          testRooms.delete(socket.testId);
        }
      }
    });
  });
  
  return io;
};

// Get connected users count
const getConnectedUsersCount = () => {
  return connectedUsers.size;
};

// Get users in test room
const getUsersInTest = (testId) => {
  if (!testRooms.has(testId)) return [];
  return Array.from(testRooms.get(testId));
};

// Send message to specific user
const sendToUser = (io, userId, event, data) => {
  const user = connectedUsers.get(userId);
  if (user) {
    io.to(user.socketId).emit(event, data);
    return true;
  }
  return false;
};

// Send message to all users in test
const sendToTest = (io, testId, event, data) => {
  io.to(`test-${testId}`).emit(event, data);
};

// Send message to all admins
const sendToAdmins = (io, event, data) => {
  io.to('admin-room').emit(event, data);
};

// Broadcast to all connected clients
const broadcastToAll = (io, event, data) => {
  io.emit(event, data);
};

// Get all connected users
const getAllConnectedUsers = () => {
  return Array.from(connectedUsers.values());
};

// Kick user from test (admin function)
const kickUserFromTest = async (io, userId, testId, reason) => {
  const user = connectedUsers.get(userId);
  if (user) {
    io.to(user.socketId).emit('kicked-from-test', { reason });
    const session = await TestSession.findOne({ testId, studentId: userId, status: 'ongoing' });
    if (session) {
      session.status = 'terminated';
      await session.save();
    }
    return true;
  }
  return false;
};

module.exports = {
  initSocket,
  getConnectedUsersCount,
  getUsersInTest,
  sendToUser,
  sendToTest,
  sendToAdmins,
  broadcastToAll,
  getAllConnectedUsers,
  kickUserFromTest
};