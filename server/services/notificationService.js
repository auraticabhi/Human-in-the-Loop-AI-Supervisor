//Notification Service
//Handles simulated notifications to supervisors and callbacks to customers, In production, this would integrate with Twilio or webhook services

class NotificationService {

  //Notify supervisor about new help request
  async notifySupervisor(helpRequest) {
    try {
      // Simulated SMS to supervisor
      const message = `🚨 New Help Request #${helpRequest._id}\n` +
                     `From: ${helpRequest.callerPhone}\n` +
                     `Question: ${helpRequest.question}\n` +
                     `View: http://localhost:3000/requests/${helpRequest._id}`;
      
      console.log('\n[SIMULATED SMS TO SUPERVISOR]');
      console.log(message);
      console.log('\n');
      
      return { success: true, method: 'console_log' };
    } catch (error) {
      console.error('Error notifying supervisor:', error);
      return { success: false, error: error.message };
    }
  }
  
  //Send callback to customer after request is resolved
  async sendCallbackToCustomer(helpRequest, answer) {
    try {
      const message = `Hi! This is the AI receptionist from our salon. ` +
                     `I checked with my supervisor about your question: "${helpRequest.question}"\n\n` +
                     `Here's the answer: ${answer}\n\n` +
                     `Feel free to call back if you have more questions!`;
      
      console.log('\n[SIMULATED SMS TO CUSTOMER]');
      console.log(`To: ${helpRequest.callerPhone}`);
      console.log(`Message: ${message}`);
      console.log('\n');
      
      return { success: true, method: 'console_log' };
    } catch (error) {
      console.error('Error sending customer callback:', error);
      return { success: false, error: error.message };
    }
  }
  
  //Send timeout notification to customer
  async notifyCustomerTimeout(helpRequest) {
    try {
      const message = `Hi! This is the AI receptionist. ` +
                     `I apologize but we weren't able to get back to you ` +
                     `about your question: "${helpRequest.question}"\n\n` +
                     `Please call us back at your convenience and we'll be happy to help!`;
      
      console.log('\n[SIMULATED SMS - TIMEOUT NOTIFICATION]');
      console.log(`To: ${helpRequest.callerPhone}`);
      console.log(`Message: ${message}`);
      console.log('\n');
      
      return { success: true, method: 'console_log' };
    } catch (error) {
      console.error('Error sending timeout notification:', error);
      return { success: false, error: error.message };
    }
  }

}

module.exports = new NotificationService();