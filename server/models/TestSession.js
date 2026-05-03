const mongoose = require('mongoose');

const testSessionSchema = new mongoose.Schema({
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
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: Date,
  answers: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  cheatingIncidents: {
    type: Array,
    default: []
  },
  totalPenalty: {
    type: Number,
    default: 0
  },
  warningCount: {
    type: Number,
    default: 0
  },
  timeLeft: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['ongoing', 'submitted', 'terminated', 'expired'],
    default: 'ongoing'
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// No pre-save hooks at all - simplest version
testSessionSchema.index({ studentId: 1, testId: 1 });
testSessionSchema.index({ testId: 1, status: 1 });

module.exports = mongoose.model('TestSession', testSessionSchema);