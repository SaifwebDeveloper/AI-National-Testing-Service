const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  testId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test',
    required: true
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TestSession'
  },
  totalMarks: {
    type: Number,
    required: true,
    default: 0
  },
  obtainedMarks: {
    type: Number,
    required: true,
    default: 0
  },
  percentage: {
    type: Number,
    required: true,
    default: 0
  },
  status: {
    type: String,
    enum: ['pass', 'fail'],
    required: true
  },
  correctAnswers: {
    type: Number,
    default: 0
  },
  incorrectAnswers: {
    type: Number,
    default: 0
  },
  unanswered: {
    type: Number,
    default: 0
  },
  timeTaken: {
    type: Number,
    default: 0
  },
  answers: {
    type: mongoose.Schema.Types.Mixed,
    default: []
  },
  certificateId: {
    type: String,
    unique: true,
    sparse: true
  },
  completedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// NO pre-save hooks - completely removed to avoid errors

// Simple indexes
resultSchema.index({ studentId: 1, testId: 1 });
resultSchema.index({ testId: 1, percentage: -1 });
resultSchema.index({ studentId: 1, createdAt: -1 });
resultSchema.index({ certificateId: 1 });

module.exports = mongoose.model('Result', resultSchema);