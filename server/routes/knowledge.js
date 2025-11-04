const express = require('express');
const router = express.Router();
const knowledgeController = require('../controllers/knowledgeController');

// POST /api/knowledge/search - Search KB (used by agent)
router.post('/search', knowledgeController.search);

// GET /api/knowledge - All entries
router.get('/', knowledgeController.getAll);

// GET /api/knowledge/learned - Learned only
router.get('/learned', knowledgeController.getLearned);

// POST /api/knowledge - Add new
router.post('/', knowledgeController.create);

module.exports = router;