import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/api';
import { useAuth } from '../context/AuthContext';
import './OfferLogs.css';

const OfferLogs = () => {
  const { token } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState({
    totalLogs: 0,
    clickedOffers: 0,
    completedOffers: 0,
    abandonedOffers: 0,
    totalRewards: 0
  });
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    status: '',
    username: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 50
  });

  useEffect(() => {
    fetchOfferLogs();
  }, [filters]);

  const fetchOfferLogs = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          queryParams.append(key, filters[key]);
        }
      });

      console.log('🔍 Fetching offer logs from:', `${API_ENDPOINTS.API_BASE_URL}/api/admin/offer-logs?${queryParams}`);

      const response = await fetch(`${API_ENDPOINTS.API_BASE_URL}/api/admin/offer-logs?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Offer logs data received:', data);
        
        setLogs(data.logs || []);
        setStatistics(data.statistics || {
          totalLogs: 0,
          clickedOffers: 0,
          completedOffers: 0,
          abandonedOffers: 0,
          totalRewards: 0
        });
        setPagination(data.pagination || {});
      } else {
        console.error('❌ Failed to fetch offer logs:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error details:', errorText);
      }
    } catch (error) {
      console.error('❌ Error fetching offer logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filtering
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A';
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      clicked: 'status-clicked',
      completed: 'status-completed',
      abandoned: 'status-abandoned'
    };
    
    return (
      <span className={`status-badge ${statusClasses[status]}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  const getStatisticsCards = () => {
    const statsArray = [
      {
        id: 'totalLogs',
        label: 'Total Logs',
        value: statistics.totalLogs || 0,
        reward: 0,
        icon: '📊'
      },
      {
        id: 'clickedOffers',
        label: 'Clicked Offers',
        value: statistics.clickedOffers || 0,
        reward: 0,
        icon: '👆'
      },
      {
        id: 'completedOffers',
        label: 'Completed Offers',
        value: statistics.completedOffers || 0,
        reward: statistics.totalRewards || 0,
        icon: '✅'
      },
      {
        id: 'abandonedOffers',
        label: 'Abandoned Offers',
        value: statistics.abandonedOffers || 0,
        reward: 0,
        icon: '❌'
      }
    ];

    return statsArray.map(stat => (
      <div key={stat.id} className="stats-card">
        <div className="stats-icon">{stat.icon}</div>
        <h3>{stat.label}</h3>
        <div className="stats-number">{stat.value}</div>
        {stat.reward > 0 && (
          <div className="stats-reward">${stat.reward.toFixed(2)} total reward</div>
        )}
      </div>
    ));
  };

  return (
    <div className="offer-logs-container">
      <div className="offer-logs-header">
        <h1>📊 Offer Logs</h1>
        <p>Track user offer clicks and completions</p>
      </div>

      {/* Statistics Cards */}
      <div className="statistics-section">
        <h2>📈 Statistics</h2>
        <div className="statistics-grid">
          {getStatisticsCards()}
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <h2>🔍 Filters</h2>
        <div className="filters-grid">
          <div className="filter-group">
            <label>Status:</label>
            <select 
              value={filters.status} 
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="clicked">Clicked</option>
              <option value="completed">Completed</option>
              <option value="abandoned">Abandoned</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Username:</label>
            <input
              type="text"
              value={filters.username}
              onChange={(e) => handleFilterChange('username', e.target.value)}
              placeholder="Search by username..."
            />
          </div>

          <div className="filter-group">
            <label>Start Date:</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>End Date:</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Per Page:</label>
            <select 
              value={filters.limit} 
              onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="logs-section">
        <h2>📋 Offer Logs</h2>
        
        {loading ? (
          <div className="loading">Loading offer logs...</div>
        ) : (
          <>
            <div className="logs-table-container">
              <table className="logs-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Offer Name</th>
                    <th>Partner</th>
                    <th>Reward</th>
                    <th>Status</th>
                    <th>Clicked At</th>
                    <th>Completed At</th>
                    <th>Duration</th>
                    <th>Device</th>
                    <th>IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log._id}>
                      <td>
                        <div className="user-info">
                          <strong>{log.username}</strong>
                          {log.userId?.email && <div className="user-email">{log.userId.email}</div>}
                        </div>
                      </td>
                      <td>
                        <div className="offer-info">
                          <strong>{log.offerName}</strong>
                          <div className="offer-url">{log.offerUrl}</div>
                        </div>
                      </td>
                      <td>{log.offerPartner}</td>
                      <td className="reward-amount">${log.rewardAmount}</td>
                      <td>{getStatusBadge(log.status)}</td>
                      <td>{formatDate(log.clickedAt)}</td>
                      <td>{log.completedAt ? formatDate(log.completedAt) : 'N/A'}</td>
                      <td>{formatDuration(log.completionTime)}</td>
                      <td>
                        <div className="device-info">
                          <div>{log.metadata?.device || 'Unknown'}</div>
                          <div className="browser-info">{log.metadata?.browser || 'Unknown'}</div>
                        </div>
                      </td>
                      <td className="ip-address">{log.userIP}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="pagination">
                <button 
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage <= 1}
                >
                  Previous
                </button>
                
                <span className="pagination-info">
                  Page {pagination.currentPage} of {pagination.totalPages} 
                  ({pagination.totalLogs} total logs)
                </span>
                
                <button 
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage >= pagination.totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default OfferLogs;
