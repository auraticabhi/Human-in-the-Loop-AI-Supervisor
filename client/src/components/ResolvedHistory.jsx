import React from 'react';

function ResolvedHistory({ requests }) {
  const formatTime = (timestamp) => new Date(timestamp).toLocaleString();

  return (
    <div className="resolved-history">
      <div className="section-header">
        <h2>📜 Resolved History ({requests.length})</h2>
      </div>

      {requests.length === 0 ? (
        <div className="empty-state">
          <p>No resolved requests yet. Help the AI learn!</p>
        </div>
      ) : (
        <div className="history-list">
          {requests.map((request) => (
            <div key={request._id} className="history-item">
              <div className="history-header">
                <span className="history-time">{formatTime(request.resolvedAt || request.createdAt)}</span>
                <span className={`status-badge status-${request.status}`}>
                  {request.status === 'resolved' ? '✅ Resolved' : '⏰ Timeout'}
                </span>
              </div>

              <div className="history-body">
                <div className="history-field">
                  <strong>📞 Caller:</strong>
                  <p>{request.callerPhone}</p>
                </div>

                <div className="history-field">
                  <strong>❓ Question:</strong>
                  <p>{request.question}</p>
                </div>

                {request.supervisorAnswer && (
                  <div className="history-field answer-field">
                    <strong>💬 Answer:</strong>
                    <p>{request.supervisorAnswer}</p>
                  </div>
                )}

                {request.status === 'timeout' && (
                  <div className="timeout-notice">
                    ⏰ Timed out after {import.meta.env.HELP_REQUEST_TIMEOUT_MINUTES || 10} minutes
                  </div>
                )}
              </div>

              <div className="history-footer">
                <span className="history-meta">
                  Session: {request.callSessionId}
                </span>
                {request.callbackSent && <span className="callback-badge">📱 Callback Sent</span>}
                {request.addedToKnowledgeBase && <span className="kb-badge">📚 Learned</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ResolvedHistory;