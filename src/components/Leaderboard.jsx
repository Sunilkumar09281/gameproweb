import React, { useState, useEffect } from 'react';
import UserCard from './UserCard';
import './Leaderboard.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const Leaderboard = ({ showTitle = true, maxUsers = 10, isHomePage = false }) => {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/leaderboard?limit=${maxUsers}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard data');
      }
      
      const data = await response.json();
      setLeaderboardData(data.topUsers || data.leaderboard || []);
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
    </div>
  );
};

export default Leaderboard;
