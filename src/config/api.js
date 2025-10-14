// API Configuration for both development and production

const getBackendUrl = () => {
  const currentHost = window.location.hostname;
  console.log('🔧 Auto-detecting API URL. Current host:', currentHost);
  
  // Development environments
  if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
    console.log('🔧 Development environment detected');
    return 'http://localhost:5001';
  }
  
  // Production environments - ALWAYS use the correct backend URL
  console.log('🔧 Production environment detected, using https://gameproback-bxsw.onrender.com');
  return 'https://https://gameproback-bxsw.onrender.com';
};

export const API_BASE_URL = getBackendUrl();

// API endpoints
export const API_ENDPOINTS = {
  // Base URL for manual construction
  API_BASE_URL: API_BASE_URL,
  
  // Postback endpoints
  PROXY_POSTBACK: `${API_BASE_URL}/proxy-postback`,
  RECEIVED_POSTBACKS: `${API_BASE_URL}/api/received-postbacks`,
  RECEIVE_POSTBACK: `${API_BASE_URL}/api/receive-postback`,
  
  // Game endpoints
  GAMES: `${API_BASE_URL}/api/games`,
  GO: `${API_BASE_URL}/go`, // Game redirect endpoint
  
  // Other endpoints
  HEALTH: `${API_BASE_URL}/health`,
  SERVER_INFO: `${API_BASE_URL}/api/server-info`,
  MONGODB_STATUS: `${API_BASE_URL}/api/mongodb-status`,
  TRACK_CLICK: `${API_BASE_URL}/api/track-click`,
  CLICKS: `${API_BASE_URL}/api/clicks`,
  API_KEYS: `${API_BASE_URL}/api/apikeys`,
  PLAY_RESPONSES: `${API_BASE_URL}/api/play-responses`,
  FETCH_HISTORY: `${API_BASE_URL}/api/fetch-history`,
  CHECK_PROXY: `${API_BASE_URL}/api/check-proxy`,
  CHECK_DOMAIN: `${API_BASE_URL}/api/check-domain`,
  
  // Email endpoints
  EMAIL_CONFIG: `${API_BASE_URL}/api/email-config`,
  SEND_EMAIL: `${API_BASE_URL}/api/send-email`,
  SCHEDULED_EMAILS: `${API_BASE_URL}/api/scheduled-emails`,
  
  // Schedule endpoints
  SCHEDULES: `${API_BASE_URL}/api/schedules`,
  OFFER_SCHEDULES: `${API_BASE_URL}/api/offer-schedules`,
  
  // Campaign endpoints
  CAMPAIGNS: `${API_BASE_URL}/api/campaigns`,
  
  // Partner endpoints
  PARTNERS: `${API_BASE_URL}/api/partners`,
  SURVEY_PROVIDERS: `${API_BASE_URL}/api/survey-providers`,
  SURVEY_LINKS: `${API_BASE_URL}/api/survey-links`,
  PARTNER_POSTBACKS: (partnerId) => `${API_BASE_URL}/api/partners/${partnerId}/postbacks`,
  
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
  currentProtocol: window.location.protocol,
  environment: process.env.NODE_ENV,
  envBackendUrl: process.env.REACT_APP_BACKEND_URL,
  detectedEnvironment: window.location.hostname === 'localhost' ? 'development' : 'production'
});
