const mongoose = require('mongoose');

const knowledgeSchema = new mongoose.Schema({
  // Core Content
  question: {
    type: String,
    required: true,
    index: true  // For quick lookups
  },
  normalizedQuestion: {
    type: String,
    required: true,
    unique: true  // Prevent duplicates
  },
  answer: {
    type: String,
    required: true
  },
  
  // Metadata
  category: {
    type: String,
    default: 'general',
    enum: ['hours', 'services', 'booking', 'policy', 'general', 'learned']
  },
  source: {
    type: String,
    enum: ['initial', 'learned'],
    default: 'initial'
  },
  learnedFromRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HelpRequest',
    default: null
  },
  timesUsed: {
    type: Number,
    default: 0
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  // Soft delete flag
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for performance
knowledgeSchema.index({ question: 'text', normalizedQuestion: 'text' });
knowledgeSchema.index({ category: 1, source: 1 });

// Normalize question for fuzzy matching
knowledgeSchema.statics.normalizeQuestion = function(question) {
  return question
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '')  // Remove punctuation
    .replace(/\s+/g, ' ')     // Normalize spaces
    .replace(/\b(the|a|an|and|or|but|in|on|at|to|for|of|with|by)\b/gi, '')  // Remove stop words
    .trim();
};

// Find similar questions
knowledgeSchema.statics.findSimilar = async function(question) {
  const normalized = this.normalizeQuestion(question);
  
  try {
    const results = await this.aggregate([
      // STEP 1: Perform a full-text search using the index
      {
        $match: {
          $text: {
            $search: normalized
          }
        }
      },
      // STEP 2: Add the relevance score as a new field
      {
        $addFields: {
          score: {
            $meta: 'textScore'
          }
        }
      },
      // STEP 3: Sort by the highest score to get the best match
      {
        $sort: {
          score: -1
        }
      },
      // STEP 4: Limit to the single best result
      {
        $limit: 1
      }
    ]);
    
    // If we have a result with a decent score, return it
    if (results.length > 0 && results[0].score > 1.0) {
      return results[0];
    }
    
    return null;

  } catch (error) {
    console.error("Error during knowledge base text search:", error);
    return null;
  }
};

// Static: Create from help request
knowledgeSchema.statics.createFromHelpRequest = async function(helpRequest) {
  const normalized = this.normalizeQuestion(helpRequest.question);
  const existing = await this.findOne({ normalizedQuestion: normalized });
  
  if (existing) {
    existing.timesUsed += 1;
    return existing.save();
  }
  
  return this.create({
    question: helpRequest.question,
    normalizedQuestion: normalized,
    answer: helpRequest.supervisorAnswer,
    source: 'learned',
    learnedFromRequestId: helpRequest._id,
    category: 'learned'
  });
};

// Static: Get learned entries only
knowledgeSchema.statics.getLearned = function() {
  return this.find({ source: 'learned', isActive: true })
    .sort({ createdAt: -1 });
};

module.exports = mongoose.model('Knowledge', knowledgeSchema);