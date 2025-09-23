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

  // Enhanced input style
  const inputStyle = {
    width: '100%',
    padding: '15px 18px',
    background: 'rgba(255, 255, 255, 0.1)',
    border: '2px solid #0f3460',
    borderRadius: 12,
    fontSize: 16,
    color: '#ffffff',
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
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'image' && formData[key]) {
          formDataToSend.append(key, formData[key]);
        } else if (key !== 'image') {
          formDataToSend.append(key, formData[key]);
        }
      });

      const response = await fetch(API_ENDPOINTS.SURVEY_LINKS || `${API_ENDPOINTS.API_BASE_URL}/api/survey-links`, {
        method: 'POST',
        body: formDataToSend
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
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'image' && formData[key]) {
          formDataToSend.append(key, formData[key]);
        } else if (key !== 'image') {
          formDataToSend.append(key, formData[key]);
        }
      });

      const response = await fetch(`${API_ENDPOINTS.SURVEY_LINKS || `${API_ENDPOINTS.API_BASE_URL}/api/survey-links`}/${editingLink.id}`, {
        method: 'PUT',
        body: formDataToSend
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
      isRecommended: link.isRecommended || false,
      content: link.content || '',
      image: null,
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

  if (loading) return (
    <div style={{ 
      padding: 20, 
      textAlign: 'center',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      minHeight: '100vh',
      color: '#00d4ff',
      fontSize: '18px'
    }}>
      🔄 Loading survey links...
    </div>
  );

  return (
    <div style={{ 
      padding: 20, 
      maxWidth: 1200, 
      margin: '0 auto',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      minHeight: '100vh',
      color: '#ffffff'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 30,
        padding: '20px 0',
        borderBottom: '2px solid #0f3460'
      }}>
        <h2 style={{ 
          color: '#00d4ff', 
          margin: 0,
          fontSize: '2.2rem',
          fontWeight: '700',
          textShadow: '0 0 20px rgba(0, 212, 255, 0.5)',
          background: 'linear-gradient(45deg, #00d4ff, #ff6b6b)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          🔗 Survey Links
        </h2>
        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            setEditingLink(null);
            resetForm();
          }}
          style={{
            padding: '12px 24px',
            background: showAddForm 
              ? 'linear-gradient(45deg, #ff6b6b, #ee5a52)' 
              : 'linear-gradient(45deg, #00d4ff, #0099cc)',
            color: 'white',
            border: 'none',
            borderRadius: 25,
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px',
            boxShadow: '0 8px 20px rgba(0, 212, 255, 0.3)',
            transition: 'all 0.3s ease',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}
          onMouseOver={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 12px 25px rgba(0, 212, 255, 0.4)';
          }}
          onMouseOut={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 8px 20px rgba(0, 212, 255, 0.3)';
          }}
        >
          {showAddForm ? '✕ Cancel' : '+ Add Survey Link'}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          padding: 20,
          background: 'linear-gradient(45deg, #ff4757, #ff3742)',
          color: '#ffffff',
          borderRadius: 15,
          marginBottom: 25,
          border: '1px solid #ff6b6b',
          boxShadow: '0 8px 25px rgba(255, 71, 87, 0.3)',
          fontSize: '14px',
          fontWeight: '500',
          textAlign: 'center'
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Add/Edit Form */}
      {(showAddForm || editingLink) && (
        <div style={{
          background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
          padding: 30,
          borderRadius: 20,
          marginBottom: 30,
          border: '2px solid #0f3460',
          boxShadow: '0 15px 35px rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(10px)'
        }}>
          <h3 style={{ 
            marginTop: 0, 
            color: '#00d4ff',
            fontSize: '1.8rem',
            fontWeight: '600',
            textAlign: 'center',
            marginBottom: 30,
            textShadow: '0 0 15px rgba(0, 212, 255, 0.5)'
          }}>
            {editingLink ? '✏️ Edit Survey Link' : '➕ Add New Survey Link'}
          </h3>
          
          <form onSubmit={editingLink ? handleUpdate : handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 25, marginBottom: 25 }}>
              {/* Survey Name */}
              <div>
                <label style={labelStyle}>📝 Survey Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  style={inputStyle}
                  placeholder="e.g., Daily Survey Campaign"
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </div>

              {/* Payout */}
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
                  style={inputStyle}
                  placeholder="e.g., 2.50"
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </div>

              {/* Link Offer ID */}
              <div>
                <label style={labelStyle}>🆔 Link Offer ID</label>
                <input
                  type="text"
                  name="linkOfferId"
                  value={formData.linkOfferId}
                  onChange={handleInputChange}
                  style={inputStyle}
                  placeholder="e.g., OFFER123"
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </div>

              {/* Select Provider */}
              <div>
                <label style={labelStyle}>🏢 Select Provider</label>
                <select
                  name="providerId"
                  value={formData.providerId}
                  onChange={handleInputChange}
                  style={inputStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                >
                  <option value="">Select Provider</option>
                  {providers.map(provider => (
                    <option key={provider.id} value={provider.id} style={{background: '#2c3e50', color: '#fff'}}>
                      {provider.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Country */}
              <div>
                <label style={labelStyle}>🌍 Country</label>
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  style={inputStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                >
                  <option value="">Select Country</option>
                  {countries.map(country => (
                    <option key={country} value={country} style={{background: '#2c3e50', color: '#fff'}}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label style={labelStyle}>⚡ Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  style={inputStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                >
                  {statusOptions.map(status => (
                    <option key={status} value={status} style={{background: '#2c3e50', color: '#fff'}}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Survey Link */}
            <div style={{ marginBottom: 25 }}>
              <label style={labelStyle}>🔗 Survey Link *</label>
              <input
                type="url"
                name="link"
                value={formData.link}
                onChange={handleInputChange}
                required
                style={inputStyle}
                placeholder="https://example.com/survey?id=123"
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
            </div>

            {/* Link Keys */}
            <div style={{ marginBottom: 25 }}>
              <label style={labelStyle}>🔑 Link Keys</label>
              <input
                type="text"
                name="linkKeys"
                value={formData.linkKeys}
                onChange={handleInputChange}
                style={inputStyle}
                placeholder="e.g., {username}, {location}, {secure_hash}"
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
              <small style={{ color: '#7f8c8d', fontSize: 12, marginTop: 5, display: 'block' }}>
                💡 Available placeholders: {'{username}'}, {'{location}'}, {'{secure_hash}'}
              </small>
            </div>

            {/* Different Site Redirect Link */}
            <div style={{ marginBottom: 25 }}>
              <label style={labelStyle}>🔄 Different Site Redirect Link</label>
              <input
                type="url"
                name="redirectLink"
                value={formData.redirectLink}
                onChange={handleInputChange}
                style={inputStyle}
                placeholder="https://redirect.example.com/survey?user={username}"
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
            </div>

            {/* Content/Description */}
            <div style={{ marginBottom: 25 }}>
              <label style={labelStyle}>📄 Content/Description</label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                rows="4"
                style={{
                  ...inputStyle,
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
                placeholder="Survey description..."
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
            </div>

            {/* Image Upload */}
            <div style={{ marginBottom: 25 }}>
              <label style={labelStyle}>🖼️ Image Upload</label>
              <input
                type="file"
                name="image"
                onChange={handleInputChange}
                accept="image/*"
                style={{
                  ...inputStyle,
                  cursor: 'pointer',
                  paddingTop: 12,
                  paddingBottom: 12
                }}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
            </div>

            {/* Is Recommended */}
            <div style={{ marginBottom: 30 }}>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 12, 
                cursor: 'pointer',
                color: '#00d4ff',
                fontSize: '16px',
                fontWeight: '600'
              }}>
                <input
                  type="checkbox"
                  name="isRecommended"
                  checked={formData.isRecommended}
                  onChange={handleInputChange}
                  style={{
                    width: 20,
                    height: 20,
                    accentColor: '#00d4ff'
                  }}
                />
                <span>⭐ Is Recommended</span>
              </label>
            </div>

            {/* Form Buttons */}
            <div style={{ display: 'flex', gap: 15, justifyContent: 'center' }}>
              <button
                type="submit"
                style={{
                  padding: '15px 30px',
                  background: 'linear-gradient(45deg, #28a745, #20c997)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 25,
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '16px',
                  boxShadow: '0 8px 20px rgba(40, 167, 69, 0.3)',
                  transition: 'all 0.3s ease',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 12px 25px rgba(40, 167, 69, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 8px 20px rgba(40, 167, 69, 0.3)';
                }}
              >
                {editingLink ? '✅ Update Survey Link' : '➕ Create Survey Link'}
              </button>
              
              {editingLink && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingLink(null);
                    resetForm();
                  }}
                  style={{
                    padding: '15px 30px',
                    background: 'linear-gradient(45deg, #6c757d, #5a6268)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 25,
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '16px',
                    boxShadow: '0 8px 20px rgba(108, 117, 125, 0.3)',
                    transition: 'all 0.3s ease',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 12px 25px rgba(108, 117, 125, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 8px 20px rgba(108, 117, 125, 0.3)';
                  }}
                >
                  ❌ Cancel Edit
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Survey Links List */}
      <div style={{
        background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
        borderRadius: 20,
        overflow: 'hidden',
        boxShadow: '0 15px 35px rgba(0, 0, 0, 0.3)',
        border: '2px solid #0f3460'
      }}>
        <div style={{
          background: 'linear-gradient(45deg, #0f3460, #16537e)',
          padding: '20px 25px',
          borderBottom: '2px solid #0f3460',
          fontWeight: '700',
          color: '#00d4ff',
          fontSize: '18px',
          textAlign: 'center'
        }}>
          📋 Survey Links ({surveyLinks.length})
        </div>

        {surveyLinks.length === 0 ? (
          <div style={{ 
            padding: 50, 
            textAlign: 'center', 
            color: '#7f8c8d',
            fontSize: '18px'
          }}>
            🔍 No survey links found. Add your first survey link to get started!
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(15, 52, 96, 0.3)' }}>
                  <th style={{ padding: '15px 20px', textAlign: 'left', color: '#00d4ff', fontWeight: '600' }}>Name</th>
                  <th style={{ padding: '15px 20px', textAlign: 'left', color: '#00d4ff', fontWeight: '600' }}>Provider</th>
                  <th style={{ padding: '15px 20px', textAlign: 'left', color: '#00d4ff', fontWeight: '600' }}>Payout</th>
                  <th style={{ padding: '15px 20px', textAlign: 'left', color: '#00d4ff', fontWeight: '600' }}>Country</th>
                  <th style={{ padding: '15px 20px', textAlign: 'left', color: '#00d4ff', fontWeight: '600' }}>Status</th>
                  <th style={{ padding: '15px 20px', textAlign: 'left', color: '#00d4ff', fontWeight: '600' }}>Recommended</th>
                  <th style={{ padding: '15px 20px', textAlign: 'left', color: '#00d4ff', fontWeight: '600' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {surveyLinks.map((link, index) => (
                  <tr key={link.id} style={{ 
                    borderBottom: '1px solid rgba(15, 52, 96, 0.3)',
                    background: index % 2 === 0 ? 'rgba(255, 255, 255, 0.02)' : 'transparent'
                  }}>
                    <td style={{ padding: '15px 20px' }}>
                      <div style={{ fontWeight: '600', color: '#ffffff', marginBottom: 5 }}>{link.name}</div>
                      {link.content && (
                        <div style={{ fontSize: 12, color: '#7f8c8d' }}>
                          {link.content.substring(0, 50)}...
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '15px 20px', color: '#00d4ff', fontWeight: '500' }}>
                      {getProviderName(link.providerId)}
                    </td>
                    <td style={{ padding: '15px 20px', color: '#28a745', fontWeight: '600' }}>
                      ${link.payout}
                    </td>
                    <td style={{ padding: '15px 20px', color: '#ffffff' }}>
                      {link.country || '-'}
                    </td>
                    <td style={{ padding: '15px 20px' }}>
                      <span style={{
                        padding: '6px 12px',
                        borderRadius: 15,
                        fontSize: 12,
                        fontWeight: '600',
                        background: link.status === 'Active' 
                          ? 'linear-gradient(45deg, #28a745, #20c997)' 
                          : 'linear-gradient(45deg, #dc3545, #c82333)',
                        color: '#ffffff'
                      }}>
                        {link.status}
                      </span>
                    </td>
                    <td style={{ padding: '15px 20px', color: '#ffffff' }}>
                      {link.isRecommended ? '⭐ Yes' : 'No'}
                    </td>
                    <td style={{ padding: '15px 20px' }}>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button
                          onClick={() => handleEdit(link)}
                          style={{
                            padding: '8px 16px',
                            background: 'linear-gradient(45deg, #007bff, #0056b3)',
                            color: 'white',
                            border: 'none',
                            borderRadius: 15,
                            cursor: 'pointer',
                            fontSize: 12,
                            fontWeight: '600',
                            transition: 'all 0.3s ease'
                          }}
                          onMouseOver={(e) => {
                            e.target.style.transform = 'scale(1.05)';
                          }}
                          onMouseOut={(e) => {
                            e.target.style.transform = 'scale(1)';
                          }}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDelete(link.id)}
                          style={{
                            padding: '8px 16px',
                            background: 'linear-gradient(45deg, #dc3545, #c82333)',
                            color: 'white',
                            border: 'none',
                            borderRadius: 15,
                            cursor: 'pointer',
                            fontSize: 12,
                            fontWeight: '600',
                            transition: 'all 0.3s ease'
                          }}
                          onMouseOver={(e) => {
                            e.target.style.transform = 'scale(1.05)';
                          }}
                          onMouseOut={(e) => {
                            e.target.style.transform = 'scale(1)';
                          }}
                        >
                          🗑️ Delete
                        </button>
                      </div>
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
