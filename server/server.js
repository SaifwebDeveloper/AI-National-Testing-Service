const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config();

// Import configurations
const { connectDB, setupIndexes, enableDebug } = require('./config/database');
const { initSocket } = require('./config/socket');

// Routes
const authRoutes = require('./routes/authRoutes');
const testRoutes = require('./routes/testRoutes');
const resultRoutes = require('./routes/resultRoutes');
const studentRoutes = require('./routes/studentRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Middleware
const { errorHandler, notFound, requestLogger, performanceMonitor } = require('./middleware/errorHandler');

const app = express();

// ====================
// Upload folders
// ====================
const uploadsDir = path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

['profiles', 'tests', 'applications', 'screenshots'].forEach(dir => {
  const p = path.join(uploadsDir, dir);
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
});

// ====================
// Middleware
// ====================

app.use(helmet());

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(requestLogger);
app.use(performanceMonitor);

// Static files
app.use('/uploads', express.static(uploadsDir));

// ====================
// Routes
// ====================

app.get('/', (req, res) => {
  res.json({ message: 'API Running' });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    mongodb: mongoose.connection.readyState === 1
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/admin', adminRoutes);

// ====================
// Error Handling
// ====================
app.use(notFound);
app.use(errorHandler);

// ====================
// Server Setup (Render FIX)
// ====================

const PORT = process.env.PORT || 5000;

let server;

const startServer = async () => {
  try {
    await connectDB();
    await setupIndexes();

    if (process.env.NODE_ENV === 'development') {
      enableDebug();
    }

    server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

    // Socket only if needed
    const io = initSocket(server);
    app.set('io', io);

  } catch (err) {
    console.error('❌ Server start failed:', err);
    process.exit(1);
  }
};

// ====================
// Graceful shutdown
// ====================
const shutdown = () => {
  console.log('Shutting down...');

  if (server) {
    server.close(() => {
      mongoose.connection.close(false, () => {
        process.exit(0);
      });
    });
  }
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

startServer();

module.exports = app;