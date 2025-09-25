import React from 'react';
import './UserCard.css';

const UserCard = ({ user, rank, isTopUser = false, onClick }) => {
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
    <div 
      className={`user-card ${isTopUser ? 'top-user' : ''}`}
      onClick={() => onClick && onClick(user)}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="user-card-rank">
        <span className="rank-number">{getRankIcon(rank)}</span>
      </div>
      
      <div className="user-card-avatar">
        <img 
          src={user.profilePicture || `https://ui-avatars.io/api/?name=${encodeURIComponent(user.userName)}&background=4CAF50&color=fff`}
          alt={user.userName}
          className="avatar-image"
          onError={(e) => {
            // Fallback to a simple colored div with initials if image fails
            const initials = user.userName ? user.userName.substring(0, 2).toUpperCase() : 'U';
            e.target.style.display = 'none';
            const fallback = document.createElement('div');
            fallback.style.cssText = `
              width: 50px; height: 50px; border-radius: 50%; 
              background: linear-gradient(135deg, #4CAF50, #45a049);
              display: flex; align-items: center; justify-content: center;
              color: white; font-weight: bold; font-size: 18px;
              border: 2px solid #00d4ff; box-shadow: 0 0 15px rgba(0, 212, 255, 0.3);
            `;
            fallback.textContent = initials;
            e.target.parentNode.appendChild(fallback);
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
          <span className="points-label">POINTS</span>
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
