import React, { useState, useEffect } from 'react';
import PendingRequests from './components/PendingRequests';
import ResolvedHistory from './components/ResolvedHistory';
import LearnedAnswers from './components/LearnedAnswers';
import { requestsAPI, knowledgeAPI } from './services/api';
import './App.css';

function App() {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [resolvedRequests, setResolvedRequests] = useState([]);
  const [knowledge, setKnowledge] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [pendingRes, resolvedRes, knowledgeRes, statsRes] = await Promise.all([
        requestsAPI.getPending(),
        requestsAPI.getResolved(50),
        knowledgeAPI.getAll(),
        requestsAPI.getStats(),
      ]);

      setPendingRequests(pendingRes.data || []);
      setResolvedRequests(resolvedRes.data || []);
      setKnowledge(knowledgeRes.data || []);
      setStats(statsRes.data || null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Make sure the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchData();

    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchData, 10000);

    return () => clearInterval(interval);
  }, []);

  // Resolve a request
  const handleResolve = async (requestId, answer) => {
    await requestsAPI.resolve(requestId, answer);
    await fetchData(); // Refresh all data
  };

  if (loading && !stats) {
    return (
      <div className="loading-screen">
        <div className="loader"></div>
        <p>Loading Supervisor Dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-screen">
        <h2>❌ Error</h2>
        <p>{error}</p>
        <button onClick={fetchData} className="btn-primary">
          🔄 Retry
        </button>
      </div>
    );
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <h1>🎤 Frontdesk HITL System</h1>
          <p>Supervisor Dashboard</p>
        </div>
        
        {stats && (
          <div className="stats-bar">
            <div className="stat-item">
              <span className="stat-label">Pending</span>
              <span className="stat-value pending">{stats.pending}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Resolved</span>
              <span className="stat-value resolved">{stats.resolved}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Timeout</span>
              <span className="stat-value timeout">{stats.timeout}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Knowledge</span>
              <span className="stat-value knowledge">{stats.knowledgeBaseSize}</span>
            </div>
          </div>
        )}
      </header>

      {/* Navigation Tabs */}
      <nav className="tab-nav">
        <button
          className={`tab-button ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          🚨 Pending ({pendingRequests.length})
        </button>
        <button
          className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          📜 History ({resolvedRequests.length})
        </button>
        <button
          className={`tab-button ${activeTab === 'knowledge' ? 'active' : ''}`}
          onClick={() => setActiveTab('knowledge')}
        >
          📚 Knowledge ({knowledge.length})
        </button>
      </nav>

      {/* Main Content */}
      <main className="app-main">
        {activeTab === 'pending' && (
          <PendingRequests
            requests={pendingRequests}
            onResolve={handleResolve}
            onRefresh={fetchData}
          />
        )}

        {activeTab === 'history' && (
          <ResolvedHistory requests={resolvedRequests} />
        )}

        {activeTab === 'knowledge' && (
          <LearnedAnswers knowledge={knowledge} />
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>Last updated: {new Date().toLocaleTimeString()}</p>
        <p>Auto-refresh every 10 seconds</p>
      </footer>
    </div>
  );
}

export default App;