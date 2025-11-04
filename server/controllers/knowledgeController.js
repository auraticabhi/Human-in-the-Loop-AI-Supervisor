const Knowledge = require('../models/Knowledge');

// POST /api/knowledge/search - Search KB (used by agent)
exports.search = async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ success: false, error: 'Question required' });
    }

    const entry = await Knowledge.findSimilar(question);
    if (entry) {
      res.json({
        success: true,
        found: true,
        data: { question: entry.question, answer: entry.answer }
      });
    } else {
      res.json({ success: true, found: false });
    }
  } catch (error) {
    console.error('KB search error:', error);
    res.status(500).json({ success: false, error: 'Search failed' });
  }
};

// GET /api/knowledge - All entries
exports.getAll = async (req, res) => {
  try {
    const entries = await Knowledge.find({ isActive: true }).sort({ createdAt: -1 });
    res.json({ success: true, data: entries });
  } catch (error) {
    console.error('KB fetch error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch KB' });
  }
};

// GET /api/knowledge/learned - Learned only
exports.getLearned = async (req, res) => {
  try {
    const entries = await Knowledge.getLearned();
    res.json({ success: true, data: entries });
  } catch (error) {
    console.error('Learned KB fetch error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch learned KB' });
  }
};

// POST /api/knowledge - Add new
exports.create = async (req, res) => {
  try {
    const { question, answer, category } = req.body;
    const normalized = Knowledge.normalizeQuestion(question);
    
    const entry = await Knowledge.create({
      question,
      normalizedQuestion: normalized,
      answer,
      category: category || 'general',
      source: 'initial'
    });
    
    res.status(201).json({ success: true, data: entry });
  } catch (error) {
    console.error('KB create error:', error);
    res.status(500).json({ success: false, error: 'Failed to add KB entry' });
  }
};