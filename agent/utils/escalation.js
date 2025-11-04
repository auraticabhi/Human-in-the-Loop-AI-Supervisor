//Escalation Handler

export class EscalationHandler {
  constructor(backendUrl) {
    this.backendUrl = backendUrl;
  }
  
  //Creates help requests when AI doesn't know the answer
  async createHelpRequest({ callerPhone, question, conversationContext, callSessionId }) {
    try {
      console.log(`CREATING HELP REQUEST: Caller: "${callerPhone}" Question: "${question}" Session: "${callSessionId}"`);
      
      const response = await fetch(`${this.backendUrl}/api/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          callerPhone,
          question,
          conversationContext,
          callSessionId,
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to create help request:', response.status, errorText);
        return {
          success: false,
          error: `Server returned ${response.status}`,
        };
      }
      
      const data = await response.json();
      
      if (data.success) {
        console.log(`Help request created successfully!, Request ID: "${data.data._id}" Supervisor has been notified\n`);

        return {
          success: true,
          requestId: data.data._id,
          data: data.data,
        };
      } else {
        console.error('Request creation failed:', data.error);
        return {
          success: false,
          error: data.error,
        };
      }
    } catch (error) {
      console.error('Error creating help request:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}