import React, { useState, useEffect } from 'react';
import './PostbackLogs.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

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
      const response = await fetch(`${API_BASE_URL}/api/received-postbacks`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch postback logs');
      }
      
      const data = await response.json();
      setPostbacks(data.reverse()); // Show newest first
      setError(null);
    } catch (err) {
      console.error('Error fetching postbacks:', err);
      setError(err.message);
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
        const response = await fetch(`${API_BASE_URL}/api/received-postbacks`, {
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
              <tr key={postback.id} className="postback-row">
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
                        'Postback ID': postback.id,
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
            <p>No postbacks match your current filters.</p>
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
