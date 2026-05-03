const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Import configurations
const { connectDB, setupIndexes, enableDebug } = require('./config/database');
const { initSocket } = require('./config/socket');

// Import routes
const authRoutes = require('./routes/authRoutes');
const testRoutes = require('./routes/testRoutes');
const resultRoutes = require('./routes/resultRoutes');
const studentRoutes = require('./routes/studentRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Import middleware
const { errorHandler, notFound, requestLogger, performanceMonitor } = require('./middleware/errorHandler');

// Initialize express app
const app = express();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created uploads directory');
}

// Create subdirectories for different upload types
const subDirs = ['profiles', 'tests', 'applications', 'screenshots'];
subDirs.forEach(dir => {
  const dirPath = path.join(uploadsDir, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

// ====================
// Middleware
// ====================

// Security middleware (simplified for now)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
app.use(requestLogger);
app.use(performanceMonitor);

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ====================
// Routes
// ====================

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// API info endpoint
app.get('/api/info', (req, res) => {
  res.json({
    name: 'Exam Platform API',
    version: '1.0.0',
    description: 'Backend API for Online Exam Platform',
    endpoints: {
      auth: '/api/auth',
      tests: '/api/tests',
      results: '/api/results',
      students: '/api/students',
      admin: '/api/admin'
    }
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/admin', adminRoutes);

// Welcome route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Exam Platform API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      api: '/api/info'
    }
  });
});

// ====================
// Error Handling
// ====================

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// ====================
// Server Initialization
// ====================

const PORT = process.env.PORT || 5000;
let server = null;

// Graceful shutdown function
const gracefulShutdown = async () => {
  console.log('\n🛑 Received shutdown signal');
  
  if (server) {
    server.close(async () => {
      console.log('🔌 HTTP server closed');
      
      // Close database connection
      const { closeDB } = require('./config/database');
      await closeDB();
      
      console.log('✅ Graceful shutdown completed');
      process.exit(0);
    });
    
    // Force shutdown after 10 seconds
    setTimeout(() => {
      console.error('⚠️ Could not close connections in time, forcing shutdown');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
};

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Setup database indexes
    await setupIndexes();
    
    // Enable database debugging in development
    if (process.env.NODE_ENV === 'development') {
      enableDebug();
    }
    
    // Create HTTP server
    server = app.listen(PORT, () => {
      console.log(`\n🚀 Server running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Client URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
      console.log(`📡 API URL: http://localhost:${PORT}/api`);
      console.log(`❤️ Health check: http://localhost:${PORT}/health`);
      console.log(`📁 Uploads directory: ${uploadsDir}`);
    });
    
    // Initialize Socket.IO
    const io = initSocket(server);
    app.set('io', io);
    console.log('🔌 WebSocket server initialized');
    
    // Handle process termination
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      gracefulShutdown();
    });
    
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection:', reason);
      gracefulShutdown();
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

module.exports = { app, server };