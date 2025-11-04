const cron = require('node-cron');
const HelpRequest = require('../models/HelpRequest');
const notificationService = require('./notificationService');

//Timeout Service - Automatically expires pending requests after configurable time
//Runs every 60 seconds to check for timeouts
class TimeoutService {
  constructor() {
    this.isRunning = false;
    this.timeoutMinutes = parseInt(process.env.HELP_REQUEST_TIMEOUT_MINUTES) || 10;
    this.cronJob = null;
  }

  //Start the timeout checker
  start() {
    if (this.isRunning) return;
    
    console.log(`Timeout service started (expires after ${this.timeoutMinutes} min)`);
    
    // Run every 60 seconds
    this.cronJob = cron.schedule('*/1 * * * *', async () => {
      await this.checkTimeouts();
    });
    
    this.isRunning = true;
  }

  //Stop the service
  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
    }
    this.isRunning = false;
    console.log('Timeout service stopped');
  }

  //Check for timed-out requests and handle them
  async checkTimeouts() {
    try {
      const now = new Date();
      const timedOutRequests = await HelpRequest.find({
        status: 'pending',
        timeoutAt: { $lte: now }
      });

      if (timedOutRequests.length > 0) {
        console.log(`Processing ${timedOutRequests.length} timed-out requests`);
      }

      for (const request of timedOutRequests) {
        // Mark as timeout
        await request.markAsTimeout();
        
        // Notify customer (simulated)
        await notificationService.notifyCustomerTimeout(request);
        
        console.log(`Request ${request._id} timed out and notified customer`);
      }
    } catch (error) {
      console.error('Timeout check error:', error);
    }
  }

  //Get service status (for health check)
  getStatus() {
    return {
      isRunning: this.isRunning,
      timeoutMinutes: this.timeoutMinutes,
      lastCheck: new Date().toISOString()
    };
  }
}

module.exports = new TimeoutService();