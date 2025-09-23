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
    background: 'rgba(255, 255, 255, 0.95)',
    border: '2px solid #0f3460',
    borderRadius: 12,
    fontSize: 16,
    color: '#2c3e50',
    backdropFilter: 'blur(10px)',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
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
      image: null, // Don't pre-fill file input
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
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: 10, 
                  fontWeight: '600',
                  color: '#00d4ff',
                  fontSize: '14px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  📝 Provider Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="survey-input"
                  style={inputStyle}
                  placeholder="e.g., PepperAds"
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </div>

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
                  className="survey-input"
                  style={inputStyle}
                  placeholder="e.g., 85.5"
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </div>

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
                    <option key={level} value={level} style={{background: '#ffffff', color: '#2c3e50'}}>{level}</option>
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
                  style={inputStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                >
                  {statusOptions.map(status => (
                    <option key={status} value={status} style={{background: '#ffffff', color: '#2c3e50'}}>{status}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: '500' }}>
                  Button Text
                </label>
                <input
                  type="text"
                  name="buttonText"
                  value={formData.buttonText}
                  onChange={handleInputChange}
                  className="survey-input"
                  style={inputStyle}
                  placeholder="e.g., Start Survey"
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: '500' }}>
                  Color Code
                </label>
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

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 5, fontWeight: '500' }}>
                Content
              </label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                rows="4"
                className="survey-input"
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

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 5, fontWeight: '500' }}>
                Iframe Code
              </label>
              <textarea
                name="iframeCode"
                value={formData.iframeCode}
                onChange={handleInputChange}
                rows="4"
                className="survey-input"
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
                  ...inputStyle,
                  cursor: 'pointer',
                  paddingTop: 12,
                  paddingBottom: 12
                }}
                onFocus={handleFocus}
                onBlur={handleBlur}
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
                {editingProvider ? 'Update Provider' : 'Create Provider'}
              </button>
              
              {editingProvider && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingProvider(null);
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

      {/* Providers List */}
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
          Survey Providers ({providers.length})
        </div>

        {providers.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#6c757d' }}>
            No providers found. Add your first provider to get started.
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
                  }}>🏢 Name</th>
                  <th style={{ 
                    padding: '15px 18px', 
                    textAlign: 'left', 
                    color: '#00d4ff',
                    fontWeight: '600',
                    fontSize: '14px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    textShadow: '0 0 10px rgba(0, 212, 255, 0.3)'
                  }}>📊 Points %</th>
                  <th style={{ 
                    padding: '15px 18px', 
                    textAlign: 'left', 
                    color: '#00d4ff',
                    fontWeight: '600',
                    fontSize: '14px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    textShadow: '0 0 10px rgba(0, 212, 255, 0.3)'
                  }}>🎯 Level</th>
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
                {providers.map((provider, index) => (
                  <tr key={provider.id} style={{ 
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
                      }}>{provider.name}</div>
                      {provider.content && (
                        <div style={{ 
                          fontSize: '12px', 
                          color: '#333333', 
                          marginTop: '4px',
                          fontStyle: 'italic'
                        }}>
                          {provider.content.substring(0, 50)}...
                        </div>
                      )}
                    </td>
                    <td style={{ 
                      padding: '15px 18px', 
                      color: '#000000',
                      fontSize: '16px',
                      fontWeight: '700'
                    }}>{provider.pointPercentage}%</td>
                    <td style={{ 
                      padding: '15px 18px', 
                      color: '#000000',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}>{provider.level || '-'}</td>
                    <td style={{ padding: '15px 18px' }}>
                      <span style={{
                        padding: '6px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: provider.status === 'Active' 
                          ? 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)' 
                          : 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
                        color: '#ffffff',
                        textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
                        boxShadow: provider.status === 'Active' 
                          ? '0 2px 8px rgba(76, 175, 80, 0.3)' 
                          : '0 2px 8px rgba(244, 67, 54, 0.3)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        {provider.status === 'Active' ? '✅' : '❌'} {provider.status}
                      </span>
                    </td>
                    <td style={{ padding: '15px 18px' }}>
                      <span style={{
                        padding: '6px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: provider.isRecommended 
                          ? 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)' 
                          : 'linear-gradient(135deg, #9e9e9e 0%, #757575 100%)',
                        color: '#ffffff',
                        textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
                        boxShadow: provider.isRecommended 
                          ? '0 2px 8px rgba(255, 152, 0, 0.3)' 
                          : '0 2px 8px rgba(158, 158, 158, 0.3)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        {provider.isRecommended ? '⭐ Yes' : '➖ No'}
                      </span>
                    </td>
                    <td style={{ padding: '15px 18px' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => handleEdit(provider)}
                          style={{
                            padding: '8px 16px',
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
                          onClick={() => handleDelete(provider.id)}
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
