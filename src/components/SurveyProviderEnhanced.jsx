import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/api';

const SurveyProvider = () => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProvider, setEditingProvider] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    pointPercentage: '',
    content: '',
    level: '',
    iframeCode: '',
    isRecommended: false,
    buttonText: '',
    colorCode: '#007bff',
    image: null,
    status: 'Active'
  });

  const levels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
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

  // Fetch all providers
  const fetchProviders = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(API_ENDPOINTS.SURVEY_PROVIDERS || `${API_ENDPOINTS.API_BASE_URL}/api/survey-providers`);
      if (!response.ok) throw new Error('Failed to fetch providers');
      const data = await response.json();
      setProviders(data);
    } catch (err) {
      setError('Failed to load providers: ' + err.message);
    }
    setLoading(false);
  };

  useEffect(() => {
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

  // Create new provider
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.pointPercentage) {
      setError('Name and Point Percentage are required');
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

      const response = await fetch(API_ENDPOINTS.SURVEY_PROVIDERS || `${API_ENDPOINTS.API_BASE_URL}/api/survey-providers`, {
        method: 'POST',
        body: formDataToSend
      });

      if (!response.ok) throw new Error('Failed to create provider');
      
      await fetchProviders();
      resetForm();
      setShowAddForm(false);
    } catch (err) {
      setError('Failed to create provider: ' + err.message);
    }
  };

  // Update provider
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.pointPercentage) {
      setError('Name and Point Percentage are required');
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

      const response = await fetch(`${API_ENDPOINTS.SURVEY_PROVIDERS || `${API_ENDPOINTS.API_BASE_URL}/api/survey-providers`}/${editingProvider.id}`, {
        method: 'PUT',
        body: formDataToSend
      });

      if (!response.ok) throw new Error('Failed to update provider');
      
      await fetchProviders();
      resetForm();
      setEditingProvider(null);
    } catch (err) {
      setError('Failed to update provider: ' + err.message);
    }
  };

  // Delete provider
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this provider?')) return;

    try {
      const response = await fetch(`${API_ENDPOINTS.SURVEY_PROVIDERS || `${API_ENDPOINTS.API_BASE_URL}/api/survey-providers`}/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete provider');
      await fetchProviders();
    } catch (err) {
      setError('Failed to delete provider: ' + err.message);
    }
  };

  // Edit provider
  const handleEdit = (provider) => {
    setFormData({
      name: provider.name,
      pointPercentage: provider.pointPercentage,
      content: provider.content || '',
      level: provider.level || '',
      iframeCode: provider.iframeCode || '',
      isRecommended: provider.isRecommended || false,
      buttonText: provider.buttonText || '',
      colorCode: provider.colorCode || '#007bff',
      image: null,
      status: provider.status || 'Active'
    });
    setEditingProvider(provider);
    setShowAddForm(false);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      pointPercentage: '',
      content: '',
      level: '',
      iframeCode: '',
      isRecommended: false,
      buttonText: '',
      colorCode: '#007bff',
      image: null,
      status: 'Active'
    });
    setError('');
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
      🔄 Loading providers...
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
          🎯 Survey Providers
        </h2>
        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            setEditingProvider(null);
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
          {showAddForm ? '✕ Cancel' : '+ Add Provider'}
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
      {(showAddForm || editingProvider) && (
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
            {editingProvider ? '✏️ Edit Provider' : '➕ Add New Provider'}
          </h3>
          
          <form onSubmit={editingProvider ? handleUpdate : handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 25, marginBottom: 25 }}>
              {/* Provider Name */}
              <div>
                <label style={labelStyle}>📝 Provider Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  style={inputStyle}
                  placeholder="e.g., PepperAds"
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </div>

              {/* Point Percentage */}
              <div>
                <label style={labelStyle}>📊 Point Percentage *</label>
                <input
                  type="number"
                  name="pointPercentage"
                  value={formData.pointPercentage}
                  onChange={handleInputChange}
                  required
                  min="0"
                  max="100"
                  step="0.01"
                  style={inputStyle}
                  placeholder="e.g., 85.5"
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </div>

              {/* Level */}
              <div>
                <label style={labelStyle}>🎯 Level</label>
                <select
                  name="level"
                  value={formData.level}
                  onChange={handleInputChange}
                  style={inputStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                >
                  <option value="">Select Level</option>
                  {levels.map(level => (
                    <option key={level} value={level} style={{background: '#2c3e50', color: '#fff'}}>{level}</option>
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
                    <option key={status} value={status} style={{background: '#2c3e50', color: '#fff'}}>{status}</option>
                  ))}
                </select>
              </div>

              {/* Button Text */}
              <div>
                <label style={labelStyle}>🔘 Button Text</label>
                <input
                  type="text"
                  name="buttonText"
                  value={formData.buttonText}
                  onChange={handleInputChange}
                  style={inputStyle}
                  placeholder="e.g., Start Survey"
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </div>

              {/* Color Code */}
              <div>
                <label style={labelStyle}>🎨 Color Code</label>
                <input
                  type="color"
                  name="colorCode"
                  value={formData.colorCode}
                  onChange={handleInputChange}
                  style={{
                    ...inputStyle,
                    height: 50,
                    cursor: 'pointer'
                  }}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </div>
            </div>

            {/* Content */}
            <div style={{ marginBottom: 25 }}>
              <label style={labelStyle}>📄 Content</label>
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
                placeholder="Provider description..."
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
            </div>

            {/* Iframe Code */}
            <div style={{ marginBottom: 25 }}>
              <label style={labelStyle}>🖼️ Iframe Code</label>
              <textarea
                name="iframeCode"
                value={formData.iframeCode}
                onChange={handleInputChange}
                rows="4"
                style={{
                  ...inputStyle,
                  fontFamily: 'monospace',
                  fontSize: 14,
                  resize: 'vertical'
                }}
                placeholder="<iframe src='...' width='100%' height='400'></iframe>"
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
                {editingProvider ? '✅ Update Provider' : '➕ Create Provider'}
              </button>
              
              {editingProvider && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingProvider(null);
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

      {/* Providers List */}
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
          📋 Survey Providers ({providers.length})
        </div>

        {providers.length === 0 ? (
          <div style={{ 
            padding: 50, 
            textAlign: 'center', 
            color: '#7f8c8d',
            fontSize: '18px'
          }}>
            🔍 No providers found. Add your first provider to get started!
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(15, 52, 96, 0.3)' }}>
                  <th style={{ padding: '15px 20px', textAlign: 'left', color: '#00d4ff', fontWeight: '600' }}>Provider</th>
                  <th style={{ padding: '15px 20px', textAlign: 'left', color: '#00d4ff', fontWeight: '600' }}>Points %</th>
                  <th style={{ padding: '15px 20px', textAlign: 'left', color: '#00d4ff', fontWeight: '600' }}>Level</th>
                  <th style={{ padding: '15px 20px', textAlign: 'left', color: '#00d4ff', fontWeight: '600' }}>Status</th>
                  <th style={{ padding: '15px 20px', textAlign: 'left', color: '#00d4ff', fontWeight: '600' }}>Recommended</th>
                  <th style={{ padding: '15px 20px', textAlign: 'left', color: '#00d4ff', fontWeight: '600' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {providers.map((provider, index) => (
                  <tr key={provider.id} style={{ 
                    borderBottom: '1px solid rgba(15, 52, 96, 0.3)',
                    background: index % 2 === 0 ? 'rgba(255, 255, 255, 0.02)' : 'transparent'
                  }}>
                    <td style={{ padding: '15px 20px' }}>
                      <div style={{ fontWeight: '600', color: '#ffffff', marginBottom: 5 }}>{provider.name}</div>
                      {provider.content && (
                        <div style={{ fontSize: 12, color: '#7f8c8d' }}>
                          {provider.content.substring(0, 50)}...
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '15px 20px', color: '#00d4ff', fontWeight: '600' }}>
                      {provider.pointPercentage}%
                    </td>
                    <td style={{ padding: '15px 20px', color: '#ffffff' }}>
                      {provider.level || '-'}
                    </td>
                    <td style={{ padding: '15px 20px' }}>
                      <span style={{
                        padding: '6px 12px',
                        borderRadius: 15,
                        fontSize: 12,
                        fontWeight: '600',
                        background: provider.status === 'Active' 
                          ? 'linear-gradient(45deg, #28a745, #20c997)' 
                          : 'linear-gradient(45deg, #dc3545, #c82333)',
                        color: '#ffffff'
                      }}>
                        {provider.status}
                      </span>
                    </td>
                    <td style={{ padding: '15px 20px', color: '#ffffff' }}>
                      {provider.isRecommended ? '⭐ Yes' : 'No'}
                    </td>
                    <td style={{ padding: '15px 20px' }}>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button
                          onClick={() => handleEdit(provider)}
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
                          onClick={() => handleDelete(provider.id)}
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

export default SurveyProvider;
