import React from 'react';

function LearnedAnswers({ knowledge }) {
  const learned = knowledge.filter((entry) => entry.source === 'learned');

  return (
    <div className="learned-answers">
      <div className="section-header">
        <h2>📚 Learned Answers ({learned.length})</h2>
      </div>

      {learned.length === 0 ? (
        <div className="empty-state">
          <p>The AI is eager to learn! Resolve some requests to see entries here.</p>
        </div>
      ) : (
        <div className="kb-grid">
          {learned.map((entry) => (
            <div key={entry._id} className={`kb-card learned`}>
              <div className="kb-header">
                <span className={`source-badge learned-badge`}>Learned</span>
                <span className="usage-badge">Used {entry.timesUsed} times</span>
              </div>

              <div className="kb-body">
                <div className="kb-question">
                  <strong>❓ Q:</strong> {entry.question}
                </div>
                <div className="kb-answer">
                  <strong>💬 A:</strong> {entry.answer}
                </div>
              </div>

              <div className="kb-footer">
                <small>Added: {new Date(entry.createdAt).toLocaleDateString()}</small>
                <span className="category-tag">{entry.category}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default LearnedAnswers;