import React from 'react';
import './UserDetailModal.css';

const UserDetailModal = ({ user, onClose }) => {
  if (!user) return null;

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  };

  const formatIP = (ip) => {
    return ip || 'N/A';
  };

  return (
    <div className="user-detail-modal-overlay" onClick={onClose}>
      <div className="user-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="user-detail-header">
          <div className="user-detail-avatar">
            <img 
              src={user.profilePicture || `https://ui-avatars.io/api/?name=${encodeURIComponent(user.userName)}&background=4CAF50&color=fff`}
              alt={user.userName}
              className="detail-avatar-image"
            />
          </div>
          <div className="user-detail-info">
            <h2 className="user-detail-name">{user.userName}</h2>
            <p className="user-detail-platform">{user.platform}</p>
          </div>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="user-detail-content">
          <div className="detail-section">
            <h3>📊 User Information</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">🌐 IP Address:</span>
                <span className="detail-value">{formatIP(user.ipAddress)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">👤 Username:</span>
                <span className="detail-value">{user.userName}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">💰 Amount:</span>
                <span className="detail-value">{user.points} Points</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">🤝 Partner Name:</span>
                <span className="detail-value">{user.partnerName || 'Unknown Partner'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">⏰ Time & Date:</span>
                <span className="detail-value">{formatDate(user.createdAt || user.joinedAt)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">🔗 Unique Click:</span>
                <span className="detail-value">{user.uniqueClick || user.userId || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">🔑 Session ID:</span>
                <span className="detail-value">{user.sessionId || user._id || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">🌍 Country:</span>
                <span className="detail-value">
                  {user.country && user.country !== 'Unknown' ? (
                    <>
                      {user.country === 'US' && '🇺🇸 United States'}
                      {user.country === 'UK' && '🇬🇧 United Kingdom'}
                      {user.country === 'CA' && '🇨🇦 Canada'}
                      {user.country === 'AU' && '🇦🇺 Australia'}
                      {user.country === 'DE' && '🇩🇪 Germany'}
                      {user.country === 'FR' && '🇫🇷 France'}
                      {user.country === 'IN' && '🇮🇳 India'}
                      {user.country === 'BR' && '🇧🇷 Brazil'}
                      {user.country === 'JP' && '🇯🇵 Japan'}
                      {user.country === 'KR' && '🇰🇷 South Korea'}
                      {!['US', 'UK', 'CA', 'AU', 'DE', 'FR', 'IN', 'BR', 'JP', 'KR'].includes(user.country) && `🌍 ${user.country}`}
                    </>
                  ) : (
                    '🌍 Unknown'
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="detail-section">
            <h3>📈 Statistics</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{user.points}</div>
                <div className="stat-label">Total Points</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{user.level || Math.floor(user.points / 100) + 1}</div>
                <div className="stat-label">Level</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{user.completedTasks || Math.floor(user.points / 50)}</div>
                <div className="stat-label">Tasks</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{user.rank || 'N/A'}</div>
                <div className="stat-label">Rank</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetailModal;
