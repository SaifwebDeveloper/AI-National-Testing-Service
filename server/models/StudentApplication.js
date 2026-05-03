const mongoose = require('mongoose');

const studentApplicationSchema = new mongoose.Schema({
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
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  remarks: {
    type: String,
    default: ''
  },
  applicationData: {
    type: Object,
    default: {}
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  appliedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// NO PRE-SAVE HOOKS - Completely removed to avoid errors

// Create indexes
studentApplicationSchema.index({ studentId: 1, testId: 1 }, { unique: true });
studentApplicationSchema.index({ testId: 1 });
studentApplicationSchema.index({ status: 1 });
studentApplicationSchema.index({ appliedAt: -1 });

module.exports = mongoose.model('StudentApplication', studentApplicationSchema);