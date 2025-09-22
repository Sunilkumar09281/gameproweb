import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/api';

const PartnerManagement = () => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  // Fetch all partners
  const fetchPartners = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(API_ENDPOINTS.PARTNERS);
      if (!response.ok) throw new Error('Failed to fetch partners');
      const data = await response.json();
      setPartners(data);
    } catch (err) {
      setError('Failed to load partners: ' + err.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  // Create new partner
  const handleCreatePartner = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Partner name is required');
      return;
    }

    try {
      const response = await fetch(API_ENDPOINTS.PARTNERS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create partner');
      }

      const result = await response.json();
      setPartners([...partners, result.partner]);
      setFormData({ name: '', description: '' });
      setShowAddForm(false);
      setError('');
    } catch (err) {
      setError('Failed to create partner: ' + err.message);
    }
  };

  // Update partner
  const handleUpdatePartner = async (e) => {
    e.preventDefault();
    if (!editingPartner) return;

    try {
      const response = await fetch(`${API_ENDPOINTS.PARTNERS}/${editingPartner.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update partner');
      }

      const result = await response.json();
      setPartners(partners.map(p => p.id === editingPartner.id ? result.partner : p));
      setEditingPartner(null);
      setFormData({ name: '', description: '' });
      setError('');
    } catch (err) {
      setError('Failed to update partner: ' + err.message);
    }
  };

  // Delete partner
  const handleDeletePartner = async (partnerId) => {
    if (!window.confirm('Are you sure you want to delete this partner? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${API_ENDPOINTS.PARTNERS}/${partnerId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete partner');
      }

      setPartners(partners.filter(p => p.id !== partnerId));
      setError('');
    } catch (err) {
      setError('Failed to delete partner: ' + err.message);
    }
  };

  // Copy postback URL to clipboard
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Postback URL copied to clipboard!');
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        alert('Postback URL copied to clipboard!');
      } catch (fallbackErr) {
        alert('Failed to copy to clipboard. Please copy manually: ' + text);
      }
      document.body.removeChild(textArea);
    }
  };

  // Start editing
  const startEdit = (partner) => {
    setEditingPartner(partner);
    setFormData({
      name: partner.name,
      description: partner.description || ''
    });
    setShowAddForm(false);
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingPartner(null);
    setFormData({ name: '', description: '' });
    setError('');
  };

  if (loading) return <div style={{ padding: 20 }}>Loading partners...</div>;

  return (
    <div style={{ padding: 20, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ color: '#fff', margin: 0 }}>Partner Management</h2>
        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            setEditingPartner(null);
            setFormData({ name: '', description: '' });
          }}
          style={{
            background: '#1976d2',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            padding: '10px 20px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          {showAddForm ? 'Cancel' : '+ Add Partner'}
        </button>
      </div>

      {error && (
        <div style={{
          background: '#f44336',
          color: '#fff',
          padding: 12,
          borderRadius: 4,
          marginBottom: 20
        }}>
          {error}
        </div>
      )}

      {/* Add/Edit Form */}
      {(showAddForm || editingPartner) && (
        <div style={{
          background: '#1e1e2f',
          padding: 20,
          borderRadius: 8,
          marginBottom: 20,
          border: '1px solid #333'
        }}>
          <h3 style={{ color: '#fff', marginTop: 0 }}>
            {editingPartner ? 'Edit Partner' : 'Add New Partner'}
          </h3>
          <form onSubmit={editingPartner ? handleUpdatePartner : handleCreatePartner}>
            <div style={{ marginBottom: 15 }}>
              <label style={{ color: '#ccc', display: 'block', marginBottom: 5 }}>
                Partner Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter partner name"
                required
                style={{
                  width: '100%',
                  padding: 10,
                  borderRadius: 4,
                  border: '1px solid #555',
                  background: '#2a2a3e',
                  color: '#fff',
                  fontSize: 14
                }}
              />
            </div>
            <div style={{ marginBottom: 15 }}>
              <label style={{ color: '#ccc', display: 'block', marginBottom: 5 }}>
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter partner description (optional)"
                rows={3}
                style={{
                  width: '100%',
                  padding: 10,
                  borderRadius: 4,
                  border: '1px solid #555',
                  background: '#2a2a3e',
                  color: '#fff',
                  fontSize: 14,
                  resize: 'vertical'
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="submit"
                style={{
                  background: '#4caf50',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  padding: '10px 20px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                {editingPartner ? 'Update Partner' : 'Create Partner'}
              </button>
              <button
                type="button"
                onClick={editingPartner ? cancelEdit : () => setShowAddForm(false)}
                style={{
                  background: '#666',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  padding: '10px 20px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Partners List */}
      {partners.length === 0 ? (
        <div style={{
          background: '#1e1e2f',
          padding: 40,
          borderRadius: 8,
          textAlign: 'center',
          color: '#ccc'
        }}>
          <h3>No Partners Yet</h3>
          <p>Create your first partner to start generating unique postback URLs.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))' }}>
          {partners.map((partner) => (
            <div
              key={partner.id}
              style={{
                background: '#1e1e2f',
                padding: 20,
                borderRadius: 8,
                border: '1px solid #333'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 }}>
                <div>
                  <h3 style={{ color: '#fff', margin: '0 0 5px 0' }}>{partner.name}</h3>
                  <span style={{
                    background: partner.status === 'active' ? '#4caf50' : '#f44336',
                    color: '#fff',
                    padding: '2px 8px',
                    borderRadius: 12,
                    fontSize: 12,
                    fontWeight: 'bold'
                  }}>
                    {partner.status || 'active'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 5 }}>
                  <button
                    onClick={() => startEdit(partner)}
                    style={{
                      background: '#1976d2',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 4,
                      padding: '5px 10px',
                      fontSize: 12,
                      cursor: 'pointer'
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeletePartner(partner.id)}
                    style={{
                      background: '#f44336',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 4,
                      padding: '5px 10px',
                      fontSize: 12,
                      cursor: 'pointer'
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>

              {partner.description && (
                <p style={{ color: '#ccc', margin: '0 0 15px 0', fontSize: 14 }}>
                  {partner.description}
                </p>
              )}

              <div style={{ marginBottom: 15 }}>
                <div style={{ color: '#999', fontSize: 12, marginBottom: 5 }}>
                  <strong>Partner ID:</strong> {partner.id}
                </div>
                <div style={{ color: '#999', fontSize: 12, marginBottom: 5 }}>
                  <strong>Created:</strong> {new Date(partner.createdAt).toLocaleDateString()}
                </div>
                <div style={{ color: '#999', fontSize: 12, marginBottom: 5 }}>
                  <strong>Total Postbacks:</strong> {partner.totalPostbacks || 0}
                </div>
                {partner.lastPostbackAt && (
                  <div style={{ color: '#999', fontSize: 12 }}>
                    <strong>Last Postback:</strong> {new Date(partner.lastPostbackAt).toLocaleString()}
                  </div>
                )}
              </div>

              <div style={{ marginBottom: 15 }}>
                <label style={{ color: '#ccc', fontSize: 12, fontWeight: 'bold', display: 'block', marginBottom: 5 }}>
                  Postback URL:
                </label>
                <div style={{ display: 'flex', gap: 5 }}>
                  <input
                    type="text"
                    value={partner.postbackUrl}
                    readOnly
                    style={{
                      flex: 1,
                      padding: 8,
                      borderRadius: 4,
                      border: '1px solid #555',
                      background: '#2a2a3e',
                      color: '#fff',
                      fontSize: 12
                    }}
                  />
                  <button
                    onClick={() => copyToClipboard(partner.postbackUrl)}
                    style={{
                      background: '#4caf50',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 4,
                      padding: '8px 12px',
                      fontSize: 12,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Copy URL
                  </button>
                </div>
              </div>

              <div style={{ fontSize: 11, color: '#666', fontStyle: 'italic' }}>
                Share this URL with your partner. All postbacks will be tracked with their unique ID.
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PartnerManagement;
