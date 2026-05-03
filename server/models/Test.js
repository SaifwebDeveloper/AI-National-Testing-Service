const mongoose = require('mongoose');

const testSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Test title is required'],
    trim: true,
    minlength: [1, 'Title must be at least 1 character'],
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
    default: ''
  },
  subject: {
    type: String,
    trim: true,
    default: ''
  },
  category: {
    type: String,
    enum: ['academic', 'professional', 'government', 'certification', 'other'],
    default: 'academic'
  },
  totalMarks: {
    type: Number,
    required: [true, 'Total marks is required'],
    min: [1, 'Total marks must be at least 1'],
    max: [1000, 'Total marks cannot exceed 1000']
  },
  passingMarks: {
    type: Number,
    required: [true, 'Passing marks is required'],
    min: [0, 'Passing marks must be at least 0'],
    validate: {
      validator: function(v) {
        return v <= this.totalMarks;
      },
      message: 'Passing marks cannot exceed total marks'
    }
  },
  duration: {
    type: Number,
    required: [true, 'Duration is required'],
    min: [1, 'Duration must be at least 1 minute'],
    max: [360, 'Duration cannot exceed 360 minutes']
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required'],
    validate: {
      validator: function(v) {
        return v > this.startDate;
      },
      message: 'End date must be after start date'
    }
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'ongoing', 'completed', 'cancelled'],
    default: 'draft'
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard', 'expert'],
    default: 'medium'
  },
  questions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  }],
  totalQuestions: {
    type: Number,
    default: 0
  },
  instructions: {
    type: String,
    default: ''
  },
  resultAnnounced: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  uploadedFile: {
    filename: String,
    originalName: String,
    path: String,
    size: Number,
    mimetype: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// NO PRE-SAVE HOOKS - REMOVED COMPLETELY to avoid errors

// Virtual for total applicants
testSchema.virtual('applicantCount', {
  ref: 'StudentApplication',
  localField: '_id',
  foreignField: 'testId',
  count: true
});

// Virtual for total submissions
testSchema.virtual('submissionCount', {
  ref: 'Result',
  localField: '_id',
  foreignField: 'testId',
  count: true
});

// Indexes
testSchema.index({ title: 'text' });
testSchema.index({ status: 1 });
testSchema.index({ startDate: 1, endDate: 1 });
testSchema.index({ createdBy: 1 });
testSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Test', testSchema);