const mongoose = require('mongoose');

const frameworkSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  version: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  controls: [{
    id: String,
    title: String,
    description: String,
    severity: {
      type: String,
      enum: ['critical', 'high', 'medium', 'low'],
      required: true
    },
    category: String,
    requirements: [String],
    remediation: String,
    automated: {
      type: Boolean,
      default: false
    }
  }],
  status: {
    type: String,
    enum: ['not-assessed', 'in-progress', 'completed', 'compliant', 'non-compliant'],
    default: 'not-assessed'
  },
  compliantCount: {
    type: Number,
    default: 0
  },
  totalControls: {
    type: Number,
    required: true
  },
  supportedTools: [{
    type: String,
    required: true
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Add any middleware or methods here if needed
frameworkSchema.pre('save', function(next) {
  this.totalControls = this.controls.length;
  next();
});

const Framework = mongoose.model('Framework', frameworkSchema);

module.exports = Framework; 