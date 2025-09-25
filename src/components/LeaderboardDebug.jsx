import React, { useState, useEffect } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const LeaderboardDebug = () => {
  const [debugData, setDebugData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchDebugData = async () => {
    setLoading(true);
    try {
      console.log('🔍 Fetching from:', `${API_BASE_URL}/api/leaderboard`);
      
      const response = await fetch(`${API_BASE_URL}/api/leaderboard`);
      console.log('📡 Response status:', response.status);
      
      const data = await response.json();
      console.log('📊 Raw leaderboard data:', data);
      
      setDebugData({
        status: response.status,
        data: data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Error:', error);
      setDebugData({
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDebugData();
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      left: '10px',
      background: 'rgba(0,0,0,0.9)',
      color: 'white',
      padding: '15px',
      borderRadius: '8px',
      maxWidth: '500px',
      maxHeight: '80vh',
      overflow: 'auto',
      zIndex: 9999,
      fontSize: '12px',
      fontFamily: 'monospace'
    }}>
      <h3>🐛 Leaderboard Debug</h3>
      <p><strong>API URL:</strong> {API_BASE_URL}</p>
      
      <button 
        onClick={fetchDebugData}
        disabled={loading}
        style={{
          background: '#4CAF50',
          color: 'white',
          border: 'none',
          padding: '5px 10px',
          borderRadius: '4px',
          marginBottom: '10px'
        }}
      >
        {loading ? 'Loading...' : 'Refresh Data'}
      </button>

      {debugData && (
        <div>
          <h4>Response Data:</h4>
          <pre style={{ 
            background: '#222', 
            padding: '10px', 
            borderRadius: '4px',
            overflow: 'auto',
            fontSize: '10px'
          }}>
            {JSON.stringify(debugData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default LeaderboardDebug;
