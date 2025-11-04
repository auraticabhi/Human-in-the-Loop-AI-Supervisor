const HelpRequest = require('../models/HelpRequest');
const Knowledge = require('../models/Knowledge');
const notificationService = require('../services/notificationService');

// GET all pending requests
exports.getPending = async (req, res) => {
  try {
    const requests = await HelpRequest.getPendingRequests();
    res.json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    console.error('Error fetching pending requests:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pending requests'
    });
  }
};

// GET all resolved requests
exports.getResolved = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const requests = await HelpRequest.getResolvedRequests(limit);
    res.json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    console.error('Error fetching resolved requests:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch resolved requests'
    });
  }
};

// GET single request by ID
exports.getById = async (req, res) => {
  try {
    const request = await HelpRequest.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Request not found'
      });
    }
    
    res.json({
      success: true,
      data: request
    });
  } catch (error) {
    console.error('Error fetching request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch request'
    });
  }
};

// POST create new help request (called by agent)
exports.createRequest = async (req, res) => {
  try {
    const { callerPhone, question, conversationContext, callSessionId } = req.body;
    
    // Validation
    if (!callerPhone || !question || !callSessionId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: callerPhone, question, callSessionId'
      });
    }
    
    // Create help request
    const helpRequest = await HelpRequest.create({
      callerPhone,
      question,
      conversationContext: conversationContext || '',
      callSessionId
    });
    
    // Simulate notification to supervisor (console log)
    console.log('🚨NEW HELP REQUEST - SUPERVISOR NOTIFICATION');
    await notificationService.notifySupervisor(helpRequest);
    
    res.status(201).json({
      success: true,
      data: helpRequest,
      message: 'Help request created and supervisor notified'
    });
  } catch (error) {
    console.error('Error creating help request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create help request'
    });
  }
};

// PUT resolve help request (supervisor submits answer)
exports.resolveRequest = async (req, res) => {
  try {
    const { answer, supervisorId } = req.body;
    
    if (!answer) {
      return res.status(400).json({
        success: false,
        error: 'Answer is required'
      });
    }
    
    const request = await HelpRequest.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Request not found'
      });
    }
    
    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Request is not pending'
      });
    }
    
    // Resolve the request
    await request.resolve(answer, supervisorId || 'supervisor-1');
    
    // Add to knowledge base
    const knowledgeEntry = await Knowledge.createFromHelpRequest(request);
    request.addedToKnowledgeBase = true;
    request.knowledgeBaseEntryId = knowledgeEntry._id;
    await request.save();
    
    // Send callback to customer (simulated)
    console.log('📱CALLBACK TO CUSTOMER');
    await notificationService.sendCallbackToCustomer(request, answer);

    await request.markCallbackSent();
    
    res.json({
      success: true,
      data: request,
      knowledgeEntry: knowledgeEntry,
      message: 'Request resolved, customer notified, and knowledge base updated'
    });
  } catch (error) {
    console.error('Error resolving request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resolve request'
    });
  }
};

// GET statistics/dashboard data
exports.getStats = async (req, res) => {
  try {
    const [pending, resolved, timeout, totalKnowledge] = await Promise.all([
      HelpRequest.countDocuments({ status: 'pending' }),
      HelpRequest.countDocuments({ status: 'resolved' }),
      HelpRequest.countDocuments({ status: 'timeout' }),
      Knowledge.countDocuments({ isActive: true })
    ]);
    
    res.json({
      success: true,
      data: {
        pending,
        resolved,
        timeout,
        total: pending + resolved + timeout,
        knowledgeBaseSize: totalKnowledge
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
};