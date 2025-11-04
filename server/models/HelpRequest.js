const mongoose = require('mongoose');

const helpRequestSchema = new mongoose.Schema({
  // Caller Information
  callerPhone: {
    type: String,
    required: true,
    index: true
  },
  
  // Request Details
  question: {
    type: String,
    required: true
  },
  
  conversationContext: {
    type: String,
    default: ''
  },
  
  // LiveKit Session Info
  callSessionId: {
    type: String,
    required: true,
    index: true
  },
  
  // Status Management
  status: {
    type: String,
    enum: ['pending', 'resolved', 'timeout'],
    default: 'pending',
    index: true
  },
  
  // Supervisor Response
  supervisorAnswer: {
    type: String,
    default: null
  },
  
  supervisorId: {
    type: String,
    default: null
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  resolvedAt: {
    type: Date,
    default: null
  },
  
  timeoutAt: {
    type: Date,
    default: function() {
      // Auto-timeout after 10 minutes
      return new Date(Date.now() + 10 * 60 * 1000);
    },
    index: true
  },
  
  // Callback Status
  callbackSent: {
    type: Boolean,
    default: false
  },
  
  callbackSentAt: {
    type: Date,
    default: null
  },
  
  // Knowledge Base Update
  addedToKnowledgeBase: {
    type: Boolean,
    default: false
  },
  
  knowledgeBaseEntryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Knowledge',
    default: null
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
helpRequestSchema.index({ status: 1, createdAt: -1 });
helpRequestSchema.index({ timeoutAt: 1, status: 1 });

// Methods
helpRequestSchema.methods.resolve = function(answer, supervisorId) {
  this.status = 'resolved';
  this.supervisorAnswer = answer;
  this.supervisorId = supervisorId;
  this.resolvedAt = new Date();
  return this.save();
};

helpRequestSchema.methods.markAsTimeout = function() {
  this.status = 'timeout';
  this.resolvedAt = new Date();
  return this.save();
};

helpRequestSchema.methods.markCallbackSent = function() {
  this.callbackSent = true;
  this.callbackSentAt = new Date();
  return this.save();
};

// Static methods
helpRequestSchema.statics.getPendingRequests = function() {
  return this.find({ status: 'pending' })
    .sort({ createdAt: -1 });
};

helpRequestSchema.statics.getResolvedRequests = function(limit = 50) {
  return this.find({ status: { $in: ['resolved', 'timeout'] } })
    .sort({ resolvedAt: -1 })
    .limit(limit);
};

helpRequestSchema.statics.checkTimeouts = async function() {
  const now = new Date();
  const timedOutRequests = await this.find({
    status: 'pending',
    timeoutAt: { $lte: now }
  });
  
  for (const request of timedOutRequests) {
    await request.markAsTimeout();
  }
  
  return timedOutRequests;
};

module.exports = mongoose.model('HelpRequest', helpRequestSchema);