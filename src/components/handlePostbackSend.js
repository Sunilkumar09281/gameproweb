// Updated handlePostbackSend function for Dashboard.jsx
// Replace the existing handlePostbackSend function with this one

import { API_ENDPOINTS } from '../config/api.js';

const handlePostbackSend = async (e) => {
  e.preventDefault();
  setPostbackLoading(true);
  setPostbackResponse(null);
  
  try {
    let response, result;
    
    if (postbackMethod === 'GET') {
      // Use the legacy proxy endpoint for GET requests (backward compatibility)
      const proxyUrl = `${API_ENDPOINTS.PROXY_POSTBACK}?target=${encodeURIComponent(previewUrl)}`;
      console.log('Sending GET request to proxy:', proxyUrl);
      
      response = await fetch(proxyUrl, { 
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      const text = await response.text();
      try {
        result = JSON.parse(text);
      } catch {
        result = text;
      }
      
      setPostbackResponse({
        status: response.status,
        data: result,
        headers: Object.fromEntries(response.headers.entries())
      });
      
    } else {
      // Use the legacy proxy endpoint for POST requests
      console.log('Sending POST request to:', postbackUrl);
      console.log('Payload:', postPayload);
      
      response = await fetch(API_ENDPOINTS.PROXY_POSTBACK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: postbackUrl,
          data: postPayload
        })
      });
      
      result = await response.json();
      
      setPostbackResponse({
        status: result.status_code || response.status,
        status_text: result.status_text || response.statusText,
        data: result.response_text || result,
        headers: result.headers || Object.fromEntries(response.headers.entries())
      });
    }
    
  } catch (err) {
    console.error('Error sending postback:', err);
    setPostbackResponse({ 
      error: 'Failed to send postback',
      details: err.message 
    });
  } finally {
    setPostbackLoading(false);
  }
};
