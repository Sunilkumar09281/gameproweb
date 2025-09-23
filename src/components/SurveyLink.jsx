import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/api';

const SurveyLink = () => {
  const [surveyLinks, setSurveyLinks] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    payout: '',
    link: '',
    linkOfferId: '',
    linkKeys: '',
    providerId: '',
    redirectLink: '',
    country: '',
    section: '',
    isRecommended: false,
    content: '',
    image: null,
    status: 'Active'
  });

  const countries = [
    'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 
    'France', 'Spain', 'Italy', 'Netherlands', 'India', 'Japan', 'Brazil',
    'Mexico', 'Argentina', 'South Africa', 'Global'
  ];
  const statusOptions = ['Active', 'Inactive'];
  const sections = [
    'Featured Surveys', 'High Paying', 'Quick Surveys', 'Daily Surveys', 
    'Gaming Surveys', 'Shopping Surveys', 'Entertainment', 'Technology',
    'Health & Wellness', 'Education', 'Travel', 'Finance'
  ];

  // Enhanced input style
  const inputStyle = {
    width: '100%',
    padding: '15px 18px',
    background: 'rgba(255, 255, 255, 0.95)',
    border: '2px solid #0f3460',
    borderRadius: 12,
    fontSize: 16,
    color: '#2c3e50',
    backdropFilter: 'blur(10px)',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
  };

  const labelStyle = {
    display: 'block',
    marginBottom: 10,
    fontWeight: '600',
    color: '#00d4ff',
    fontSize: '14px',
    textTransform: 'uppercase',
    letterSpacing: '1px'
  };

  const handleFocus = (e) => {
    e.target.style.border = '2px solid #00d4ff';
    e.target.style.boxShadow = '0 0 20px rgba(0, 212, 255, 0.3)';
  };

  const handleBlur = (e) => {
    e.target.style.border = '2px solid #0f3460';
    e.target.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)';
  };

  // Add CSS for placeholder styling
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .survey-input::placeholder {
        color: #6c757d !important;
        opacity: 0.8;
      }
      .survey-input:focus::placeholder {
        color: #adb5bd !important;
        opacity: 0.6;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Fetch all survey links
  const fetchSurveyLinks = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(API_ENDPOINTS.SURVEY_LINKS || `${API_ENDPOINTS.API_BASE_URL}/api/survey-links`);
      if (!response.ok) throw new Error('Failed to fetch survey links');
      const data = await response.json();
      setSurveyLinks(data);
    } catch (err) {
      setError('Failed to load survey links: ' + err.message);
    }
    setLoading(false);
  };

  // Fetch providers for dropdown
  const fetchProviders = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.SURVEY_PROVIDERS || `${API_ENDPOINTS.API_BASE_URL}/api/survey-providers`);
      if (!response.ok) throw new Error('Failed to fetch providers');
      const data = await response.json();
      setProviders(data.filter(p => p.status === 'Active'));
    } catch (err) {
      console.error('Failed to load providers:', err);
    }
  };

  useEffect(() => {
    fetchSurveyLinks();
    fetchProviders();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'file' ? files[0] : value
    }));
  };

  // Create new survey link
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.payout || !formData.link) {
      setError('Name, Payout, and Link are required');
      return;
    }

    try {
      // Remove image field since survey links don't support file uploads
      const { image, ...dataToSend } = formData;

      const response = await fetch(API_ENDPOINTS.SURVEY_LINKS || `${API_ENDPOINTS.API_BASE_URL}/api/survey-links`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend)
      });

      if (!response.ok) throw new Error('Failed to create survey link');
      
      await fetchSurveyLinks();
      resetForm();
      setShowAddForm(false);
    } catch (err) {
      setError('Failed to create survey link: ' + err.message);
    }
  };

  // Update survey link
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.payout || !formData.link) {
      setError('Name, Payout, and Link are required');
      return;
    }

    try {
      // Remove image field since survey links don't support file uploads
      const { image, ...dataToSend } = formData;

      const response = await fetch(`${API_ENDPOINTS.SURVEY_LINKS || `${API_ENDPOINTS.API_BASE_URL}/api/survey-links`}/${editingLink.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend)
      });

      if (!response.ok) throw new Error('Failed to update survey link');
      
      await fetchSurveyLinks();
      resetForm();
      setEditingLink(null);
    } catch (err) {
      setError('Failed to update survey link: ' + err.message);
    }
  };

  // Delete survey link
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this survey link?')) return;

    try {
      const response = await fetch(`${API_ENDPOINTS.SURVEY_LINKS || `${API_ENDPOINTS.API_BASE_URL}/api/survey-links`}/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete survey link');
      await fetchSurveyLinks();
    } catch (err) {
      setError('Failed to delete survey link: ' + err.message);
    }
  };

  // Edit survey link
  const handleEdit = (link) => {
    setFormData({
      name: link.name,
      payout: link.payout,
      link: link.link,
      linkOfferId: link.linkOfferId || '',
      linkKeys: link.linkKeys || '',
      providerId: link.providerId || '',
      redirectLink: link.redirectLink || '',
      country: link.country || '',
      section: link.section || '',
      isRecommended: link.isRecommended || false,
      content: link.content || '',
      image: null, // Don't pre-fill file input
      status: link.status || 'Active'
    });
    setEditingLink(link);
    setShowAddForm(false);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      payout: '',
      link: '',
      linkOfferId: '',
      linkKeys: '',
      providerId: '',
      redirectLink: '',
      country: '',
      isRecommended: false,
      content: '',
      image: null,
      status: 'Active'
    });
    setError('');
  };

  // Get provider name by ID
  const getProviderName = (providerId) => {
    const provider = providers.find(p => p.id === providerId);
    return provider ? provider.name : 'Unknown Provider';
  };

  if (loading) return <div style={{ padding: 20 }}>Loading survey links...</div>;

  return (
    <div style={{ 
      padding: 20, 
      maxWidth: 1200, 
      margin: '0 auto',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      minHeight: '100vh',
      color: '#ffffff'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ color: '#2c3e50', margin: 0 }}>Survey Links</h2>
        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            setEditingLink(null);
            resetForm();
          }}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          {showAddForm ? 'Cancel' : 'Add Survey Link'}
        </button>
      </div>

      {error && (
        <div style={{
          padding: 15,
          backgroundColor: '#fee',
          color: '#c33',
          borderRadius: 6,
          marginBottom: 20,
          border: '1px solid #fcc'
        }}>
          {error}
        </div>
      )}

      {/* Add/Edit Form */}
      {(showAddForm || editingLink) && (
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: 20,
          borderRadius: 8,
          marginBottom: 20,
          border: '1px solid #dee2e6'
        }}>
          <h3 style={{ marginTop: 0, color: '#2c3e50' }}>
            {editingLink ? 'Edit Survey Link' : 'Add New Survey Link'}
          </h3>
          
          <form onSubmit={editingLink ? handleUpdate : handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div>
                <label style={labelStyle}>📝 Survey Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="survey-input"
                  style={inputStyle}
                  placeholder="e.g., Daily Survey Campaign"
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </div>

              <div>
                <label style={labelStyle}>💰 Payout *</label>
                <input
                  type="number"
                  name="payout"
                  value={formData.payout}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  className="survey-input"
                  style={inputStyle}
                  placeholder="e.g., 2.50"
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>🔗 Survey Link *</label>
                <input
                  type="url"
                  name="link"
                  value={formData.link}
                  onChange={handleInputChange}
                  required
                  className="survey-input"
                  style={inputStyle}
                  placeholder="https://example.com/survey?id=123"
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: '500' }}>
                  Link Offer ID
                </label>
                <input
                  type="text"
                  name="linkOfferId"
                  value={formData.linkOfferId}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: 4,
                    fontSize: 14
                  }}
                  placeholder="e.g., OFFER123"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: '500' }}>
                  Select Provider
                </label>
                <select
                  name="providerId"
                  value={formData.providerId}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: 4,
                    fontSize: 14
                  }}
                >
                  <option value="">Select Provider</option>
                  {providers.map(provider => (
                    <option key={provider.id} value={provider.id}>{provider.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: '500' }}>
                  Country
                </label>
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: 4,
                    fontSize: 14
                  }}
                >
                  <option value="">Select Country</option>
                  {countries.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>📂 Section *</label>
                <select
                  name="section"
                  value={formData.section}
                  onChange={handleInputChange}
                  required
                  style={inputStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                >
                  <option value="">Select Section</option>
                  {sections.map(section => (
                    <option key={section} value={section} style={{background: '#ffffff', color: '#2c3e50'}}>{section}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: '500' }}>
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: 4,
                    fontSize: 14
                  }}
                >
                  {statusOptions.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 5, fontWeight: '500' }}>
                Link Keys
              </label>
              <input
                type="text"
                name="linkKeys"
                value={formData.linkKeys}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: 4,
                  fontSize: 14
                }}
                placeholder="e.g., {username}, {location}, {secure_hash}"
              />
              <small style={{ color: '#6c757d', fontSize: 12 }}>
                Available placeholders: {'{username}'}, {'{location}'}, {'{secure_hash}'}
              </small>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 5, fontWeight: '500' }}>
                Different Site Redirect Link
              </label>
              <input
                type="url"
                name="redirectLink"
                value={formData.redirectLink}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: 4,
                  fontSize: 14
                }}
                placeholder="https://redirect.example.com/survey?user={username}"
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 5, fontWeight: '500' }}>
                Content/Description
              </label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                rows="3"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: 4,
                  fontSize: 14,
                  resize: 'vertical'
                }}
                placeholder="Survey description..."
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 5, fontWeight: '500' }}>
                Image Upload
              </label>
              <input
                type="file"
                name="image"
                onChange={handleInputChange}
                accept="image/*"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: 4,
                  fontSize: 14
                }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  name="isRecommended"
                  checked={formData.isRecommended}
                  onChange={handleInputChange}
                />
                <span style={{ fontWeight: '500' }}>Is Recommended</span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="submit"
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                {editingLink ? 'Update Survey Link' : 'Create Survey Link'}
              </button>
              
              {editingLink && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingLink(null);
                    resetForm();
                  }}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Survey Links List */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: 8,
        overflow: 'hidden',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '15px 20px',
          borderBottom: '1px solid #dee2e6',
          fontWeight: '600',
          color: '#495057'
        }}>
          Survey Links ({surveyLinks.length})
        </div>

        {surveyLinks.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#6c757d' }}>
            No survey links found. Add your first survey link to get started.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ 
                  background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                  borderBottom: '2px solid #00d4ff'
                }}>
                  <th style={{ 
                    padding: '15px 18px', 
                    textAlign: 'left', 
                    color: '#00d4ff',
                    fontWeight: '600',
                    fontSize: '14px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    textShadow: '0 0 10px rgba(0, 212, 255, 0.3)'
                  }}>📋 Name</th>
                  <th style={{ 
                    padding: '15px 18px', 
                    textAlign: 'left', 
                    color: '#00d4ff',
                    fontWeight: '600',
                    fontSize: '14px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    textShadow: '0 0 10px rgba(0, 212, 255, 0.3)'
                  }}>🏢 Provider</th>
                  <th style={{ 
                    padding: '15px 18px', 
                    textAlign: 'left', 
                    color: '#00d4ff',
                    fontWeight: '600',
                    fontSize: '14px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    textShadow: '0 0 10px rgba(0, 212, 255, 0.3)'
                  }}>💰 Payout</th>
                  <th style={{ 
                    padding: '15px 18px', 
                    textAlign: 'left', 
                    color: '#00d4ff',
                    fontWeight: '600',
                    fontSize: '14px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    textShadow: '0 0 10px rgba(0, 212, 255, 0.3)'
                  }}>🌍 Country</th>
                  <th style={{ 
                    padding: '15px 18px', 
                    textAlign: 'left', 
                    color: '#00d4ff',
                    fontWeight: '600',
                    fontSize: '14px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    textShadow: '0 0 10px rgba(0, 212, 255, 0.3)'
                  }}>📂 Section</th>
                  <th style={{ 
                    padding: '15px 18px', 
                    textAlign: 'left', 
                    color: '#00d4ff',
                    fontWeight: '600',
                    fontSize: '14px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    textShadow: '0 0 10px rgba(0, 212, 255, 0.3)'
                  }}>🔄 Status</th>
                  <th style={{ 
                    padding: '15px 18px', 
                    textAlign: 'left', 
                    color: '#00d4ff',
                    fontWeight: '600',
                    fontSize: '14px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    textShadow: '0 0 10px rgba(0, 212, 255, 0.3)'
                  }}>⭐ Recommended</th>
                  <th style={{ 
                    padding: '15px 18px', 
                    textAlign: 'left', 
                    color: '#00d4ff',
                    fontWeight: '600',
                    fontSize: '14px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    textShadow: '0 0 10px rgba(0, 212, 255, 0.3)'
                  }}>⚙️ Actions</th>
                </tr>
              </thead>
              <tbody>
                {surveyLinks.map((link, index) => (
                  <tr key={link.id} style={{ 
                    background: index % 2 === 0 
                      ? 'rgba(255, 255, 255, 0.9)' 
                      : 'rgba(255, 255, 255, 0.7)',
                    borderBottom: '1px solid rgba(0, 212, 255, 0.2)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(0, 212, 255, 0.2)';
                    e.currentTarget.style.transform = 'translateX(5px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = index % 2 === 0 
                      ? 'rgba(255, 255, 255, 0.9)' 
                      : 'rgba(255, 255, 255, 0.7)';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}>
                    <td style={{ padding: '15px 18px' }}>
                      <div style={{ 
                        fontWeight: '600', 
                        color: '#000000',
                        fontSize: '15px',
                        marginBottom: '4px'
                      }}>{link.name}</div>
                      {link.content && (
                        <div style={{ 
                          fontSize: '12px', 
                          color: '#333333', 
                          marginTop: '4px',
                          fontStyle: 'italic'
                        }}>
                          {link.content.substring(0, 50)}...
                        </div>
                      )}
                    </td>
                    <td style={{ 
                      padding: '15px 18px', 
                      color: '#000000',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}>{getProviderName(link.providerId)}</td>
                    <td style={{ 
                      padding: '15px 18px', 
                      color: '#000000',
                      fontSize: '16px',
                      fontWeight: '700'
                    }}>${link.payout}</td>
                    <td style={{ 
                      padding: '15px 18px', 
                      color: '#000000',
                      fontSize: '14px'
                    }}>{link.country || '-'}</td>
                    <td style={{ padding: '15px 18px' }}>
                      <span style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)',
                        color: '#ffffff',
                        textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
                        boxShadow: '0 2px 8px rgba(0, 212, 255, 0.3)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        📂 {link.section || 'No Section'}
                      </span>
                    </td>
                    <td style={{ padding: '15px 18px' }}>
                      <span style={{
                        padding: '6px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: link.status === 'Active' 
                          ? 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)' 
                          : 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
                        color: '#ffffff',
                        textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
                        boxShadow: link.status === 'Active' 
                          ? '0 2px 8px rgba(76, 175, 80, 0.3)' 
                          : '0 2px 8px rgba(244, 67, 54, 0.3)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        {link.status === 'Active' ? '✅' : '❌'} {link.status}
                      </span>
                    </td>
                    <td style={{ padding: '15px 18px' }}>
                      <span style={{
                        padding: '6px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: link.isRecommended 
                          ? 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)' 
                          : 'linear-gradient(135deg, #9e9e9e 0%, #757575 100%)',
                        color: '#ffffff',
                        textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
                        boxShadow: link.isRecommended 
                          ? '0 2px 8px rgba(255, 152, 0, 0.3)' 
                          : '0 2px 8px rgba(158, 158, 158, 0.3)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        {link.isRecommended ? '⭐ Yes' : '➖ No'}
                      </span>
                    </td>
                    <td style={{ padding: '15px 18px' }}>
                      <button
                        onClick={() => handleEdit(link)}
                        style={{
                          padding: '8px 16px',
                          marginRight: '8px',
                          background: 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          boxShadow: '0 4px 15px rgba(0, 212, 255, 0.3)',
                          transition: 'all 0.3s ease',
                          textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'translateY(-2px) scale(1.05)';
                          e.target.style.boxShadow = '0 6px 20px rgba(0, 212, 255, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'translateY(0) scale(1)';
                          e.target.style.boxShadow = '0 4px 15px rgba(0, 212, 255, 0.3)';
                        }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDelete(link.id)}
                        style={{
                          padding: '8px 16px',
                          background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          boxShadow: '0 4px 15px rgba(244, 67, 54, 0.3)',
                          transition: 'all 0.3s ease',
                          textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'translateY(-2px) scale(1.05)';
                          e.target.style.boxShadow = '0 6px 20px rgba(244, 67, 54, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'translateY(0) scale(1)';
                          e.target.style.boxShadow = '0 4px 15px rgba(244, 67, 54, 0.3)';
                        }}
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SurveyLink;
