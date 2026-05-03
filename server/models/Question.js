const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  testId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test',
    required: true
  },
  text: {
    type: String,
    required: true
  },
  options: [{
    text: String,
    isCorrect: { type: Boolean, default: false }
  }],
  correctAnswer: {
    type: Number,
    required: true,
    default: 0
  },
  marks: {
    type: Number,
    required: true,
    default: 1
  },
  explanation: {
    type: String,
    default: ''
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Simple indexes for better query performance
questionSchema.index({ testId: 1 });
questionSchema.index({ testId: 1, order: 1 });

module.exports = mongoose.model('Question', questionSchema);