import React, { useState } from 'react';

function PendingRequests({ requests, onResolve, onRefresh }) {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleResolve = async (e) => {
    e.preventDefault();
    
    if (!answer.trim() || !selectedRequest) return;
    
    setSubmitting(true);
    try {
      await onResolve(selectedRequest._id, answer);
      setSelectedRequest(null);
      setAnswer('');
      alert('✅ Request resolved and customer notified!');
      onRefresh();
    } catch (error) {
      alert('❌ Failed to resolve request: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getTimeRemaining = (timeoutAt) => {
    const remaining = new Date(timeoutAt) - new Date();
    if (remaining <= 0) return 'EXPIRED';
    
    const minutes = Math.floor(remaining / 60000);
    return `${minutes} min left`;
  };

  return (
    <div className="pending-requests">
      <div className="section-header">
        <h2>🚨 Pending Requests ({requests.length})</h2>
        <button onClick={onRefresh} className="btn-refresh">
          🔄 Refresh
        </button>
      </div>

      {requests.length === 0 ? (
        <div className="empty-state">
          <p>✅ No pending requests - all clear!</p>
        </div>
      ) : (
        <div className="requests-grid">
          {requests.map((request) => (
            <div 
              key={request._id} 
              className={`request-card ${selectedRequest?._id === request._id ? 'selected' : ''}`}
              onClick={() => setSelectedRequest(request)}
            >
              <div className="request-header">
                <span className="request-time">{formatTime(request.createdAt)}</span>
                <span className={`timeout-badge ${getTimeRemaining(request.timeoutAt) === 'EXPIRED' ? 'expired' : ''}`}>
                  ⏰ {getTimeRemaining(request.timeoutAt)}
                </span>
              </div>
              
              <div className="request-body">
                <div className="request-field">
                  <strong>📞 Caller:</strong> {request.callerPhone}
                </div>
                
                <div className="request-field">
                  <strong>❓ Question:</strong>
                  <p className="question-text">{request.question}</p>
                </div>
                
                {request.conversationContext && (
                  <details className="context-details">
                    <summary>📝 Conversation Context</summary>
                    <p className="context-text">{request.conversationContext}</p>
                  </details>
                )}
              </div>
              
              <div className="request-footer">
                <small>Session: {request.callSessionId}</small>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedRequest && (
        <div className="response-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>📝 Respond to Request</h3>
              <button 
                onClick={() => setSelectedRequest(null)}
                className="btn-close"
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="request-summary">
                <p><strong>Caller:</strong> {selectedRequest.callerPhone}</p>
                <p><strong>Question:</strong> {selectedRequest.question}</p>
              </div>

              <form onSubmit={handleResolve}>
                <div className="form-group">
                  <label htmlFor="answer">Your Answer:</label>
                  <textarea
                    id="answer"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Type your answer here..."
                    rows="6"
                    required
                    disabled={submitting}
                  />
                </div>

                <div className="form-actions">
                  <button 
                    type="button"
                    onClick={() => setSelectedRequest(null)}
                    className="btn-secondary"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? '⏳ Submitting...' : '✅ Submit & Notify Customer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setSelectedRequest(null)} />
        </div>
      )}
    </div>
  );
}

export default PendingRequests;