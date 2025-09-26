import React, { useState, useEffect } from 'react';
import './PostbackLogs.css';
import { API_ENDPOINTS } from '../config/api';

const PostbackLogs = () => {
  const [postbacks, setPostbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  const fetchPostbacks = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching postbacks from:', API_ENDPOINTS.RECEIVED_POSTBACKS);
      
      const response = await fetch(API_ENDPOINTS.RECEIVED_POSTBACKS, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', response.headers);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response error:', errorText);
        
        // Try legacy endpoint as fallback
        console.log('🔄 Trying legacy postbacks endpoint...');
        try {
          const legacyResponse = await fetch(`${API_ENDPOINTS.API_BASE_URL}/api/postbacks`);
          if (legacyResponse.ok) {
            const legacyData = await legacyResponse.json();
            console.log('📊 Legacy postbacks data:', legacyData);
            const postbacksArray = Array.isArray(legacyData) ? legacyData : [];
            setPostbacks(postbacksArray.reverse());
            setError(null);
            console.log('✅ PostbackLogs updated with legacy data:', postbacksArray.length, 'postbacks');
            return;
          }
        } catch (legacyErr) {
          console.log('❌ Legacy endpoint also failed:', legacyErr);
        }
        
        throw new Error(`Failed to fetch postback logs: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('📊 Raw postbacks data:', data);
      console.log('📊 Data type:', typeof data);
      console.log('📊 Is array:', Array.isArray(data));
      
      // Ensure data is an array
      const postbacksArray = Array.isArray(data) ? data : [];
      console.log('📊 Postbacks array length:', postbacksArray.length);
      
      // Debug first postback structure if available
      if (postbacksArray.length > 0) {
        console.log('📊 First postback structure:', postbacksArray[0]);
        console.log('📊 First postback keys:', Object.keys(postbacksArray[0]));
      }
      
      setPostbacks(postbacksArray.reverse()); // Show newest first
      setError(null);
      console.log('✅ PostbackLogs updated with', postbacksArray.length, 'postbacks');
    } catch (err) {
      console.error('❌ Error fetching postbacks:', err);
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPostbacks();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchPostbacks, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (method) => {
    switch (method) {
      case 'GET':
        return '#4CAF50';
      case 'POST':
        return '#2196F3';
      case 'PUT':
        return '#FF9800';
      case 'DELETE':
        return '#f44336';
      default:
        return '#666666';
    }
  };

  const getPlatformColor = (platform) => {
    const colors = {
      'TimeWall': '#4CAF50',
      'Torox': '#00BFFF',
      'AdGateMedia': '#8A2BE2',
      'MM Wall': '#FFD700',
      'MyChips': '#FF69B4',
      'AdscendMedia': '#1E90FF',
      'RevU+': '#00FF7F',
      'Lootably': '#4682B4',
      'Ayet Studios': '#9370DB',
      'Bitlabs': '#FF8C00',
      'Unknown Partner': '#666666'
    };
    return colors[platform] || '#666666';
  };

  const filteredPostbacks = postbacks.filter(postback => {
    const matchesFilter = filter === 'all' || 
      (filter === 'with-user-data' && postback.userData?.userId) ||
      (filter === 'without-user-data' && !postback.userData?.userId) ||
      (filter === 'points-earned' && postback.userData?.points > 0);
    
    const matchesSearch = !searchTerm || 
      postback.userData?.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      postback.userData?.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      postback.partnerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      postback.ip?.includes(searchTerm);
    
    return matchesFilter && matchesSearch;
  });

  const paginatedPostbacks = filteredPostbacks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredPostbacks.length / itemsPerPage);

  const clearAllPostbacks = async () => {
    if (window.confirm('Are you sure you want to clear all postback logs? This action cannot be undone.')) {
      try {
        const response = await fetch(API_ENDPOINTS.RECEIVED_POSTBACKS, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          setPostbacks([]);
          setCurrentPage(1);
        } else {
          throw new Error('Failed to clear postbacks');
        }
      } catch (err) {
        console.error('Error clearing postbacks:', err);
        alert('Failed to clear postbacks: ' + err.message);
      }
    }
  };

  const createTestPostback = async () => {
    try {
      const timestamp = Date.now();
      const testData = {
        user_id: 'test_user_' + timestamp,
        user_name: 'Test User ' + timestamp,
        user_email: 'test' + timestamp + '@example.com',
        points: Math.floor(Math.random() * 500) + 50, // Random points between 50-550
        platform: 'Test Platform',
        partner_id: 'test_partner_' + timestamp,
        transaction_id: 'txn_' + timestamp,
        offer_id: 'offer_test_' + timestamp
      };

      console.log('🧪 Creating test postback with data:', testData);
      console.log('🧪 Postback URL:', `${API_ENDPOINTS.API_BASE_URL}/api/receive-postback`);

      const response = await fetch(`${API_ENDPOINTS.API_BASE_URL}/api/receive-postback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(testData)
      });

      console.log('📡 Test Postback Response Status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Test postback created successfully:', result);
        
        // Check if the response indicates MongoDB or JSON storage
        const storageType = result.postbackId ? 'MongoDB' : 'JSON file';
        console.log('💾 Storage type detected:', storageType);
        
        alert(`✅ Test postback created successfully!\n\nPostback ID: ${result.postbackId}\nUser: ${testData.user_name}\nPoints: ${testData.points}\n\nNote: If postbacks don't appear in the table, the production server may be using JSON file storage instead of MongoDB.`);
        
        // Wait a moment then refresh the list
        setTimeout(() => {
          fetchPostbacks();
        }, 2000); // Increased wait time
      } else {
        const errorText = await response.text();
        console.error('❌ Test postback error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
    } catch (err) {
      console.error('❌ Error creating test postback:', err);
      alert(`Failed to create test postback: ${err.message}\n\nPlease check the console for more details.`);
    }
  };

  const checkServerVersion = async () => {
    try {
      console.log('🔍 Checking server version...');
      console.log('🔍 Server Info URL:', API_ENDPOINTS.SERVER_INFO);
      
      const response = await fetch(API_ENDPOINTS.SERVER_INFO);
      
      if (response.ok) {
        const info = await response.json();
        console.log('📊 Server Info:', info);
        
        const message = `Server Information:
Version: ${info.version}
Message: ${info.message}
Available Endpoints: ${info.endpoints.join(', ')}
Timestamp: ${info.timestamp}

✅ Server has MongoDB integration!`;
        
        alert(message);
        
        // If server has MongoDB, try to check MongoDB status
        if (info.version.includes('mongodb')) {
          setTimeout(() => checkMongoDBStatus(), 1000);
        }
      } else {
        throw new Error(`Server check failed: ${response.status}`);
      }
    } catch (err) {
      console.error('❌ Error checking server version:', err);
      alert(`❌ Server Check Failed: ${err.message}

This means your production server is still running the OLD version without MongoDB integration.

You need to:
1. Push your updated code to GitHub
2. Redeploy on Render
3. Wait for deployment to complete`);
    }
  };

  const checkMongoDBStatus = async () => {
    try {
      console.log('🔍 Checking MongoDB connection status...');
      
      const response = await fetch(API_ENDPOINTS.MONGODB_STATUS);
      
      if (response.ok) {
        const status = await response.json();
        console.log('📊 MongoDB Status:', status);
        
        const message = `MongoDB Status:
Connection: ${status.mongodb.connectionState}
Database: ${status.mongodb.database}
Collections:
- Postbacks: ${status.mongodb.collections.postbacks}
- Users: ${status.mongodb.collections.users}
- Partners: ${status.mongodb.collections.partners}

Timestamp: ${status.timestamp}`;
        
        alert(message);
      } else {
        throw new Error(`MongoDB check failed: ${response.status}`);
      }
    } catch (err) {
      console.error('❌ Error checking MongoDB status:', err);
      alert(`❌ MongoDB Check Failed: ${err.message}`);
    }
  };

  if (loading && postbacks.length === 0) {
    return (
      <div className="postback-logs-container">
        <div className="postback-logs-header">
          <h2>📊 Postback Activity Logs</h2>
        </div>
        <div className="postback-logs-loading">
          <div className="loading-spinner"></div>
          <p>Loading postback logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="postback-logs-container">
      <div className="postback-logs-header">
        <h2>📊 Postback Activity Logs</h2>
        <div className="postback-logs-actions">
          <button onClick={fetchPostbacks} className="refresh-button" disabled={loading}>
            🔄 Refresh
          </button>
          <button onClick={checkServerVersion} className="status-button">
            🔍 Check Server
          </button>
          <button onClick={createTestPostback} className="test-button">
            🧪 Create Test Postback
          </button>
          <button onClick={clearAllPostbacks} className="clear-button">
            🗑️ Clear All
          </button>
        </div>
      </div>

      <div className="postback-logs-filters">
        <div className="filter-group">
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Postbacks</option>
            <option value="with-user-data">With User Data</option>
            <option value="without-user-data">Without User Data</option>
            <option value="points-earned">Points Earned</option>
          </select>
        </div>
        
        <div className="search-group">
          <input
            type="text"
            placeholder="Search by user, email, partner, or IP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="postback-logs-stats">
        <div className="stat-card">
          <span className="stat-number">{postbacks.length}</span>
          <span className="stat-label">Total Postbacks</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{postbacks.filter(p => p.userData?.userId).length}</span>
          <span className="stat-label">With User Data</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{postbacks.filter(p => p.userData?.points > 0).length}</span>
          <span className="stat-label">Points Earned</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{postbacks.reduce((sum, p) => sum + (p.userData?.points || 0), 0).toFixed(2)}</span>
          <span className="stat-label">Total Points</span>
        </div>
      </div>

      {postbacks.length === 0 && (
        <div className="postback-logs-diagnostic" style={{
          background: 'rgba(255, 193, 7, 0.1)',
          border: '1px solid rgba(255, 193, 7, 0.3)',
          borderRadius: '8px',
          padding: '16px',
          margin: '16px 0',
          color: '#ffc107'
        }}>
          <h4>🔍 Diagnostic Information</h4>
          <p><strong>Issue Detected:</strong> Postbacks are being created successfully but not appearing in the database.</p>
          <p><strong>Possible Causes:</strong></p>
          <ul style={{ textAlign: 'left', margin: '8px 0' }}>
            <li>Production server may not have the latest MongoDB integration code</li>
            <li>Postbacks might be saved to JSON files instead of MongoDB</li>
            <li>MongoDB connection issue on the production server</li>
          </ul>
          <p><strong>API Base URL:</strong> <code>{API_ENDPOINTS.API_BASE_URL}</code></p>
        </div>
      )}

      {error && (
        <div className="postback-logs-error">
          <p>⚠️ {error}</p>
          <button onClick={fetchPostbacks} className="retry-button">
            Try Again
          </button>
        </div>
      )}

      <div className="postback-logs-table-container">
        <table className="postback-logs-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>User</th>
              <th>Platform</th>
              <th>Points</th>
              <th>Method</th>
              <th>IP Address</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {paginatedPostbacks.map((postback) => (
              <tr key={postback._id || postback.postbackId} className="postback-row">
                <td className="time-cell">
                  {formatDate(postback.receivedAt)}
                </td>
                <td className="user-cell">
                  {postback.userData?.userId ? (
                    <div className="user-info">
                      <div className="user-avatar">
                        <img 
                          src={postback.userData.profilePicture || `https://ui-avatars.io/api/?name=${encodeURIComponent(postback.userData.userName || 'User')}&background=random`}
                          alt={postback.userData.userName}
                          onError={(e) => {
                            e.target.src = `https://ui-avatars.io/api/?name=${encodeURIComponent(postback.userData.userName || 'User')}&background=random`;
                          }}
                        />
                      </div>
                      <div className="user-details">
                        <div className="user-name">{postback.userData.userName}</div>
                        <div className="user-email">{postback.userData.userEmail}</div>
                      </div>
                    </div>
                  ) : (
                    <span className="no-user-data">No user data</span>
                  )}
                </td>
                <td className="platform-cell">
                  <span 
                    className="platform-badge"
                    style={{ backgroundColor: getPlatformColor(postback.partnerName) }}
                  >
                    {postback.partnerName}
                  </span>
                </td>
                <td className="points-cell">
                  {postback.userData?.points ? (
                    <span className="points-earned">+{postback.userData.points}</span>
                  ) : (
                    <span className="no-points">-</span>
                  )}
                </td>
                <td className="method-cell">
                  <span 
                    className="method-badge"
                    style={{ backgroundColor: getStatusColor(postback.method) }}
                  >
                    {postback.method}
                  </span>
                </td>
                <td className="ip-cell">
                  <code>{postback.ip}</code>
                </td>
                <td className="details-cell">
                  <button 
                    className="details-button"
                    onClick={() => {
                      const details = {
                        'Postback ID': postback._id || postback.postbackId,
                        'Partner ID': postback.partnerId,
                        'User Agent': postback.headers?.['user-agent'],
                        'Query Parameters': JSON.stringify(postback.query, null, 2),
                        'Body Data': JSON.stringify(postback.body, null, 2)
                      };
                      alert(Object.entries(details).map(([k, v]) => `${k}: ${v}`).join('\n\n'));
                    }}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredPostbacks.length === 0 && !loading && (
        <div className="postback-logs-empty">
          <div className="empty-state">
            <h3>📭 No postback logs found</h3>
            {postbacks.length === 0 ? (
              <div>
                <p>No postbacks have been received yet.</p>
                <p><strong>To get started:</strong></p>
                <ul style={{ textAlign: 'left', margin: '10px 0' }}>
                  <li>Click "🧪 Create Test Postback" to generate sample data</li>
                  <li>Send real postbacks to: <code>{API_ENDPOINTS.API_BASE_URL}/api/receive-postback</code></li>
                  <li>Check "🔍 Check MongoDB" to verify database connection</li>
                </ul>
              </div>
            ) : (
              <p>No postbacks match your current filters.</p>
            )}
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="postback-logs-pagination">
          <button 
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="pagination-button"
          >
            ← Previous
          </button>
          
          <span className="pagination-info">
            Page {currentPage} of {totalPages} ({filteredPostbacks.length} total)
          </span>
          
          <button 
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="pagination-button"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

export default PostbackLogs;
