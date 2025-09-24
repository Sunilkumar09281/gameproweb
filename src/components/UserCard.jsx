import React from 'react';
import './UserCard.css';

const UserCard = ({ user, rank, isTopUser = false }) => {
  const formatPoints = (points) => {
    if (points >= 1000) {
      return (points / 1000).toFixed(1) + 'k';
    }
    return points.toFixed(0);
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return rank;
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
      'Unknown Platform': '#666666'
    };
    return colors[platform] || '#666666';
  };

  return (
    <div className={`user-card ${isTopUser ? 'top-user' : ''}`}>
      <div className="user-card-rank">
        <span className="rank-number">{getRankIcon(rank)}</span>
      </div>
      
      <div className="user-card-avatar">
        <img 
          src={user.profilePicture || `https://ui-avatars.io/api/?name=${encodeURIComponent(user.userName)}&background=random`}
          alt={user.userName}
          className="avatar-image"
          onError={(e) => {
            e.target.src = `https://ui-avatars.io/api/?name=${encodeURIComponent(user.userName)}&background=random`;
          }}
        />
        <div className="user-level">
          <span>{user.level || 1}</span>
        </div>
      </div>
      
      <div className="user-card-info">
        <h3 className="user-name">{user.userName}</h3>
        <div 
          className="user-platform"
          style={{ color: getPlatformColor(user.platform) }}
        >
          {user.platform}
        </div>
      </div>
      
      <div className="user-card-stats">
        <div className="user-points">
          <span className="points-value">{formatPoints(user.points)}</span>
          <span className="points-label">PTS</span>
        </div>
        <div className="user-tasks">
          <span className="tasks-value">{user.completedTasks || 0}</span>
          <span className="tasks-label">TASKS</span>
        </div>
      </div>
      
      <div className="user-card-country">
        {user.country && user.country !== 'Unknown' && (
          <span className="country-flag">
            {user.country === 'US' && '🇺🇸'}
            {user.country === 'UK' && '🇬🇧'}
            {user.country === 'CA' && '🇨🇦'}
            {user.country === 'AU' && '🇦🇺'}
            {user.country === 'DE' && '🇩🇪'}
            {user.country === 'FR' && '🇫🇷'}
            {user.country === 'IN' && '🇮🇳'}
            {user.country === 'BR' && '🇧🇷'}
            {user.country === 'JP' && '🇯🇵'}
            {user.country === 'KR' && '🇰🇷'}
            {!['US', 'UK', 'CA', 'AU', 'DE', 'FR', 'IN', 'BR', 'JP', 'KR'].includes(user.country) && '🌍'}
          </span>
        )}
      </div>
    </div>
  );
};

export default UserCard;
