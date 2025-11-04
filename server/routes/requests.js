const express = require('express');
const router = express.Router();
const requestsController = require('../controllers/requestsController');

// GET all pending requests
router.get('/pending', requestsController.getPending);

// GET all resolved requests
router.get('/resolved', requestsController.getResolved);

// GET single request by ID
router.get('/:id', requestsController.getById);

// POST create new help request (called by agent)
router.post('/', requestsController.createRequest);

// PUT resolve help request (supervisor submits answer)
router.put('/:id/resolve', requestsController.resolveRequest);

// GET statistics/dashboard data
router.get('/stats/overview', requestsController.getStats);

module.exports = router;