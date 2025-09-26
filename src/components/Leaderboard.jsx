import React, { useState, useEffect } from 'react';
import UserCard from './UserCard';
import UserDetailModal from './UserDetailModal';
import './Leaderboard.css';
import { API_ENDPOINTS } from '../config/api';

const Leaderboard = ({ showTitle = true, maxUsers = 10, isHomePage = false }) => {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching user data from:', `${API_ENDPOINTS.API_BASE_URL}/api/user-data?limit=${maxUsers}`);
      const response = await fetch(`${API_ENDPOINTS.API_BASE_URL}/api/user-data?limit=${maxUsers}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch leaderboard data: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📊 User data received:', data);
      const users = data.users || [];
      
      // If no users from API, add some mock data for testing
      if (users.length === 0) {
        console.log('⚠️ No users from API, adding mock data for testing');
        const mockUsers = [
          {
            userId: 'test1',
            userName: 'TestUser1',
            profilePicture: 'https://ui-avatars.io/api/?name=TestUser1&background=4CAF50&color=fff',
            platform: 'TestPlatform',
            points: 200,
            level: 3,
            completedTasks: 4,
            country: 'US',
            rank: 1,
            ipAddress: '192.168.1.100',
            partnerName: 'Test Partner',
            uniqueClick: 'click_123456',
            sessionId: 'session_789012',
            createdAt: new Date().toISOString()
          },
          {
            userId: 'test2',
            userName: 'TestUser2',
            profilePicture: 'https://ui-avatars.io/api/?name=TestUser2&background=FF5722&color=fff',
            platform: 'AnotherPlatform',
            points: 150,
            level: 2,
            completedTasks: 3,
            country: 'UK',
            rank: 2,
            ipAddress: '192.168.1.101',
            partnerName: 'Another Partner',
            uniqueClick: 'click_654321',
            sessionId: 'session_210987',
            createdAt: new Date().toISOString()
          }
        ];
        setLeaderboardData(mockUsers);
        console.log('✅ Leaderboard updated with', mockUsers.length, 'mock users');
      } else {
        setLeaderboardData(users);
        console.log('✅ Leaderboard updated with', users.length, 'real users');
      }
      setLastUpdate(new Date().toISOString());
      setError(null);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError(err.message);
      // Set mock data for development
      setLeaderboardData([
        {
          userId: 'mock1',
          userName: 'Naimafak',
          platform: 'TimeWall',
          points: 473,
          level: 71,
          completedTasks: 25,
          profilePicture: 'https://ui-avatars.io/api/?name=Naimafak&background=4CAF50',
          country: 'US',
          rank: 1
        },
        {
          userId: 'mock2',
          userName: 'Kembuh',
          platform: 'Torox',
          points: 340,
          level: 45,
          completedTasks: 18,
          profilePicture: 'https://ui-avatars.io/api/?name=Kembuh&background=00BFFF',
          country: 'UK',
          rank: 2
        },
        {
          userId: 'mock3',
          userName: 'rodolf',
          platform: 'AdGateMedia',
          points: 262,
          level: 38,
          completedTasks: 15,
          profilePicture: 'https://ui-avatars.io/api/?name=rodolf&background=8A2BE2',
          country: 'CA',
          rank: 3
        },
        {
          userId: 'mock4',
          userName: 'oyrtert',
          platform: 'MM Wall',
          points: 225,
          level: 32,
          completedTasks: 12,
          profilePicture: 'https://ui-avatars.io/api/?name=oyrtert&background=FFD700',
          country: 'AU',
          rank: 4
        },
        {
          userId: 'mock5',
          userName: 'exigible',
          platform: 'MyChips',
          points: 202,
          level: 28,
          completedTasks: 10,
          profilePicture: 'https://ui-avatars.io/api/?name=exigible&background=FF69B4',
          country: 'DE',
          rank: 5
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    
    // Auto-refresh every 30 seconds if on home page
    if (isHomePage) {
      const interval = setInterval(fetchLeaderboard, 30000);
      return () => clearInterval(interval);
    }
  }, [maxUsers, isHomePage]);

  const handleRefresh = () => {
    fetchLeaderboard();
  };

  const handleUserClick = (user) => {
    setSelectedUser(user);
  };

  const handleCloseModal = () => {
    setSelectedUser(null);
  };

  if (loading && leaderboardData.length === 0) {
    return (
      <div className="leaderboard-container">
        {showTitle && (
          <div className="leaderboard-header">
            <h2 className="leaderboard-title">🏆 Gaming Offers Leaderboard</h2>
          </div>
        )}
        <div className="leaderboard-loading">
          <div className="loading-spinner"></div>
          <p>Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`leaderboard-container ${isHomePage ? 'home-page-leaderboard' : ''}`}>
      {showTitle && (
        <div className="leaderboard-header">
          <h2 className="leaderboard-title">
            🏆 Gaming Offers Leaderboard
          </h2>
          <div className="leaderboard-actions">
            <button 
              onClick={handleRefresh} 
              className="refresh-button"
              disabled={loading}
            >
              🔄 Refresh
            </button>
            {lastUpdate && (
              <span className="last-update">
                Updated: {new Date(lastUpdate).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      )}
      
      {error && !leaderboardData.length && (
        <div className="leaderboard-error">
          <p>⚠️ {error}</p>
          <button onClick={handleRefresh} className="retry-button">
            Try Again
          </button>
        </div>
      )}
      
      <div className="leaderboard-list">
        {leaderboardData.slice(0, maxUsers).map((user, index) => (
          <UserCard
            key={user.userId}
            user={user}
            rank={user.rank || index + 1}
            isTopUser={index < 3}
            onClick={isHomePage ? null : handleUserClick}
          />
        ))}
      </div>
      
      {leaderboardData.length === 0 && !loading && (
        <div className="leaderboard-empty">
          <div className="empty-state">
            <h3>🎮 No players yet!</h3>
            <p>Be the first to complete offers and claim your spot on the leaderboard!</p>
          </div>
        </div>
      )}
      
      {isHomePage && leaderboardData.length > 0 && (
        <div className="leaderboard-footer">
          <button className="view-all-button">
            View Full Leaderboard →
          </button>
        </div>
      )}

      {/* User Detail Modal */}
      {selectedUser && (
        <UserDetailModal 
          user={selectedUser} 
          onClose={handleCloseModal} 
        />
      )}
    </div>
  );
};

export default Leaderboard;
