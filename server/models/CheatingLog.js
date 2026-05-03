const mongoose = require('mongoose');

const cheatingLogSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student ID is required']
  },
  testId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test',
    required: [true, 'Test ID is required']
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TestSession',
    required: [true, 'Session ID is required']
  },
  violationType: {
    type: String,
    enum: [
      'tab_switch',
      'copy_paste',
      'right_click',
      'keyboard_shortcut',
      'multiple_persons',
      'phone_detected',
      'face_not_visible',
      'looking_away',
      'fullscreen_exit',
      'devtools',
      'other'
    ],
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  penalty: {
    type: Number, // seconds deducted
    default: 0
  },
  warningCount: {
    type: Number,
    default: 1
  },
  screenshot: {
    type: String, // base64 or URL
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  resolved: {
    type: Boolean,
    default: false
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedAt: Date,
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for student info
cheatingLogSchema.virtual('student', {
  ref: 'User',
  localField: 'studentId',
  foreignField: '_id',
  justOne: true
});

// Virtual for test info
cheatingLogSchema.virtual('test', {
  ref: 'Test',
  localField: 'testId',
  foreignField: '_id',
  justOne: true
});

// Virtual for session info
cheatingLogSchema.virtual('session', {
  ref: 'TestSession',
  localField: 'sessionId',
  foreignField: '_id',
  justOne: true
});

// Indexes
cheatingLogSchema.index({ studentId: 1, testId: 1 });
cheatingLogSchema.index({ sessionId: 1 });
cheatingLogSchema.index({ timestamp: -1 });
cheatingLogSchema.index({ violationType: 1 });
cheatingLogSchema.index({ severity: 1 });
cheatingLogSchema.index({ resolved: 1 });

module.exports = mongoose.model('CheatingLog', cheatingLogSchema);