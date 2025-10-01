import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_ENDPOINTS } from '../config/api';
import { ArrowLeft, Settings, Camera, Upload, User, Mail, Calendar, Trophy, Target, DollarSign, TrendingUp } from 'lucide-react';
import './ProfilePage.css';

const ProfilePage = ({ onBack }) => {
  const { user, token } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('Earnings');
  const [userStats, setUserStats] = useState({
    totalEarnings: 0,
    completedOffers: 0,
    usersReferred: 0,
    earningsLast30Days: 0
  });

  // Test API connectivity
  const testApiConnection = async () => {
    try {
      const testUrl = `${API_ENDPOINTS.API_BASE_URL}/api/auth/profile`;
      console.log('🔗 Testing API connection to:', testUrl);
      
      const response = await fetch(testUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('🔗 API test response:', response.status, response.statusText);
      
      if (response.status === 404) {
        console.error('❌ API endpoint not found - server may not be running or endpoint missing');
      }
    } catch (error) {
      console.error('❌ API connection test failed:', error);
    }
  };

  // Fetch user profile data
  useEffect(() => {
    if (user) {
      testApiConnection(); // Test connection first
      fetchProfileData();
      fetchUserStats();
    }
  }, [user]);

  const fetchProfileData = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.API_BASE_URL}/api/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProfileData(data.user);
        setEditForm(data.user);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const apiUrl = `${API_ENDPOINTS.API_BASE_URL}/api/auth/user-stats`;
      console.log('📊 Fetching stats from:', apiUrl);
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📊 Stats response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('📊 Stats data:', data);
        setUserStats(data.stats);
      } else {
        console.log('📊 Stats endpoint failed, using fallback');
        // Fallback to user points if stats endpoint fails
        setUserStats({
          totalEarnings: user?.points || 0,
          completedOffers: 0,
          usersReferred: 0,
          earningsLast30Days: 0
        });
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
      // Fallback stats
      setUserStats({
        totalEarnings: user?.points || 0,
        completedOffers: 0,
        usersReferred: 0,
        earningsLast30Days: 0
      });
    }
  };

  const handleInputChange = (e) => {
    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    
    // Create FormData for file upload
    const formData = new FormData();
    formData.append('profilePicture', file);

    try {
      const response = await fetch(`${API_ENDPOINTS.API_BASE_URL}/api/auth/upload-avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setEditForm({
          ...editForm,
          profilePicture: data.profilePicture
        });
      } else {
        // Fallback: convert to base64 for display
        const reader = new FileReader();
        reader.onloadend = () => {
          setEditForm({
            ...editForm,
            profilePicture: reader.result
          });
        };
        reader.readAsDataURL(file);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      // Fallback: convert to base64 for display
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditForm({
          ...editForm,
          profilePicture: reader.result
        });
      };
      reader.readAsDataURL(file);
    } finally {
      setUploading(false);
    }
  };

  const generateRandomAvatar = () => {
    const avatarStyles = [
      'adventurer', 'adventurer-neutral', 'avataaars', 'big-ears', 'big-ears-neutral',
      'big-smile', 'bottts', 'croodles', 'croodles-neutral', 'fun-emoji', 'icons',
      'identicon', 'initials', 'lorelei', 'lorelei-neutral', 'micah', 'miniavs',
      'open-peeps', 'personas', 'pixel-art', 'pixel-art-neutral'
    ];
    
    const randomStyle = avatarStyles[Math.floor(Math.random() * avatarStyles.length)];
    const randomSeed = Math.random().toString(36).substring(7);
    const newAvatar = `https://api.dicebear.com/7.x/${randomStyle}/svg?seed=${randomSeed}&size=200`;
    
    setEditForm({
      ...editForm,
      profilePicture: newAvatar
    });
  };

  const handleSaveProfile = async () => {
    try {
      const apiUrl = `${API_ENDPOINTS.API_BASE_URL}/api/auth/update-profile`;
      console.log('🔄 Saving profile to:', apiUrl);
      console.log('📤 Request data:', editForm);
      console.log('🔑 Token:', token ? 'Present' : 'Missing');
      
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', response.headers);
      
      // Check if response is HTML (error page) or JSON
      const contentType = response.headers.get('content-type');
      console.log('📋 Content-Type:', contentType);
      
      if (contentType && contentType.includes('text/html')) {
        // Server returned HTML instead of JSON
        const htmlText = await response.text();
        console.error('❌ Server returned HTML:', htmlText.substring(0, 200));
        alert('Server error: API endpoint not found or server not running properly');
        return;
      }

      const data = await response.json();
      console.log('📡 Profile update response:', data);

      if (response.ok) {
        setProfileData(data.user);
        setIsEditing(false);
        
        // Show success message
        alert('Profile updated successfully!');
        
        // Refresh user stats
        fetchUserStats();
      } else {
        console.error('❌ Profile update failed:', data);
        alert(`Failed to update profile: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      alert(`Error updating profile: ${error.message}`);
    }
  };

  const createSampleActivities = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.API_BASE_URL}/api/auth/create-sample-activities`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Sample data created! ${data.activitiesCreated} activities and ${data.referralsCreated} referrals added.`);
        
        // Refresh stats to show new data
        fetchUserStats();
        fetchProfileData(); // Refresh profile to get updated points
      } else {
        const error = await response.json();
        alert(`Failed to create sample data: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating sample activities:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const formatJoinDate = (dateString) => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return `${diffDays} days ago`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months > 1 ? 's' : ''} ago`;
    } else {
      const years = Math.floor(diffDays / 365);
      return `${years} year${years > 1 ? 's' : ''} ago`;
    }
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="loading-spinner">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {/* Header */}
      <div className="profile-header">
        <button onClick={onBack} className="back-button">
          <ArrowLeft size={20} />
        </button>
        <h1>My Profile</h1>
        <div className="header-buttons">
          <button onClick={testApiConnection} className="test-button">
            🔗 Test API
          </button>
          <button onClick={createSampleActivities} className="sample-button">
            📊 Add Sample Data
          </button>
          <button onClick={() => setIsEditing(true)} className="settings-button">
            <Settings size={20} />
            Settings
          </button>
        </div>
      </div>

      {/* Debug Info */}
      <div className="debug-info">
        <p><strong>API Base URL:</strong> {API_ENDPOINTS.API_BASE_URL}</p>
        <p><strong>Current Host:</strong> {window.location.hostname}</p>
        <p><strong>Token:</strong> {token ? '✅ Present' : '❌ Missing'}</p>
        <p><strong>User ID:</strong> {user?.id || user?._id || 'Unknown'}</p>
      </div>

      {/* Profile Card */}
      <div className="profile-card">
        <div className="profile-avatar-section">
          <div className="profile-avatar">
            <img 
              src={profileData?.profilePicture || user?.profilePicture || '/icon21.png'} 
              alt="Profile" 
              onError={(e) => {
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || 'User')}&background=random&color=fff&size=200`;
              }}
            />
          </div>
          <div className="profile-info">
            <h2>{profileData?.fullName || profileData?.username || user?.username || 'User'}</h2>
            <p className="join-date">Joined {formatJoinDate(profileData?.createdAt || user?.createdAt)}</p>
            <div className="level-info">
              <span className="level-badge">Level {user?.level || 1}</span>
              <span className="level-progress">1000 coins to level up</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon earnings">
              <DollarSign size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-value">${userStats.totalEarnings}</span>
              <span className="stat-label">Total Earnings</span>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon offers">
              <Trophy size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{userStats.completedOffers}</span>
              <span className="stat-label">Completed offers</span>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon referrals">
              <User size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{userStats.usersReferred}</span>
              <span className="stat-label">Users referred</span>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon recent">
              <TrendingUp size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-value">${userStats.earningsLast30Days}</span>
              <span className="stat-label">Earnings last 30 days</span>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Tabs */}
      <div className="activity-section">
        <div className="activity-tabs">
          {['Earnings', 'Started offers', 'Withdrawals', 'Offers', 'Surveys', 'Rewards', 'Referrals'].map((tab) => (
            <button
              key={tab}
              className={`activity-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="activity-controls">
          <label className="toggle-switch">
            <input type="checkbox" />
            <span className="slider">Show pending offers only</span>
          </label>
          <select className="partner-filter">
            <option>All offer partner</option>
          </select>
        </div>

        <div className="activity-table">
          <div className="table-header">
            <span>Offer Name</span>
            <span>Reward</span>
            <span>Reward Status</span>
            <span>Offer Partner</span>
            <span>Date</span>
          </div>
          <div className="table-body">
            <div className="no-data">
              No offers have been completed yet
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="edit-modal-overlay">
          <div className="edit-modal">
            <div className="edit-modal-header">
              <h3>Edit Profile</h3>
              <button onClick={() => setIsEditing(false)} className="close-button">×</button>
            </div>
            
            <div className="edit-modal-body">
              {/* Avatar Section */}
              <div className="edit-avatar-section">
                <div className="edit-avatar">
                  <img 
                    src={editForm?.profilePicture || user?.profilePicture || '/icon21.png'} 
                    alt="Profile" 
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || 'User')}&background=random&color=fff&size=200`;
                    }}
                  />
                  {uploading && <div className="upload-overlay">Uploading...</div>}
                </div>
                <div className="avatar-buttons">
                  <label className="upload-button">
                    <Camera size={16} />
                    Upload Photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                  <button onClick={generateRandomAvatar} className="random-button">
                    <User size={16} />
                    Random Avatar
                  </button>
                </div>
              </div>

              {/* Form Fields */}
              <div className="edit-form">
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    value={editForm?.fullName || ''}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                  />
                </div>
                
                <div className="form-group">
                  <label>Username</label>
                  <input
                    type="text"
                    name="username"
                    value={editForm?.username || ''}
                    onChange={handleInputChange}
                    placeholder="Enter your username"
                    disabled
                  />
                  <small>Username cannot be changed</small>
                </div>
                
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={editForm?.email || ''}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                  />
                </div>
              </div>
            </div>
            
            <div className="edit-modal-footer">
              <button onClick={() => setIsEditing(false)} className="cancel-button">
                Cancel
              </button>
              <button onClick={handleSaveProfile} className="save-button">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
