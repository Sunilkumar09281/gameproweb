// API Configuration for both development and production

const getBackendUrl = () => {
  // If explicitly set in environment variables, use that
  if (process.env.REACT_APP_BACKEND_URL) {
    return process.env.REACT_APP_BACKEND_URL;
  }

  // Auto-detect based on current environment
  const currentHost = window.location.hostname;
  const currentProtocol = window.location.protocol;
  
  // Development environments
  if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
    return 'http://localhost:5000';
  }
  
  // Production environments - try to guess backend URL
  if (currentHost.includes('onrender.com')) {
    // If frontend is on Render, backend is likely on Render too
    // Replace 'gameproweb' with 'gamepro' or adjust based on your naming
    const backendHost = currentHost.replace('gameproweb', 'gamepro');
    return `${currentProtocol}//${backendHost}`;
  }
  
  if (currentHost.includes('netlify.app')) {
    // Netlify frontend, backend might be on Render or Heroku
    return 'https://gamepro.onrender.com'; // Update with your actual backend URL
  }
  
  if (currentHost.includes('vercel.app')) {
    // Vercel frontend, backend might be elsewhere
    return 'https://gamepro.onrender.com'; // Update with your actual backend URL
  }
  
  // Default fallback
  return 'http://localhost:5000';
};

export const API_BASE_URL = getBackendUrl();

// API endpoints
export const API_ENDPOINTS = {
  // Postback endpoints
  PROXY_POSTBACK: `${API_BASE_URL}/proxy-postback`,
  RECEIVED_POSTBACKS: `${API_BASE_URL}/api/received-postbacks`,
  RECEIVE_POSTBACK: `${API_BASE_URL}/api/receive-postback`,
  
  // Game endpoints
  GAMES: `${API_BASE_URL}/api/games`,
  GO: `${API_BASE_URL}/go`, // Game redirect endpoint
  
  // Other endpoints
  HEALTH: `${API_BASE_URL}/health`,
  TRACK_CLICK: `${API_BASE_URL}/api/track-click`,
  CLICKS: `${API_BASE_URL}/api/clicks`,
  API_KEYS: `${API_BASE_URL}/api/apikeys`,
  PLAY_RESPONSES: `${API_BASE_URL}/api/play-responses`,
  FETCH_HISTORY: `${API_BASE_URL}/api/fetch-history`,
  CHECK_PROXY: `${API_BASE_URL}/api/check-proxy`,
  CHECK_DOMAIN: `${API_BASE_URL}/api/check-domain`,
  
  // Public API endpoints
  PUBLIC_GAMES: `${API_BASE_URL}/api/public/games`,
  PUBLIC_POSTBACKS: `${API_BASE_URL}/api/public/postbacks`,
  PUBLIC_USERS: `${API_BASE_URL}/api/public/users`,
};

// Helper function to make API calls with proper error handling
export const apiCall = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      return await response.text();
    }
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};

console.log('API Configuration:', {
  backendUrl: API_BASE_URL,
  currentHost: window.location.hostname,
  environment: process.env.NODE_ENV
});
