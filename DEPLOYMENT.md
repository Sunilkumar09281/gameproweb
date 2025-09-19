# Deployment Guide

## Production Deployment Issue Fix

### Problem
The application was showing `net::ERR_CONNECTION_REFUSED` errors in production because it was trying to connect to `http://localhost:5000` instead of the production backend URL.

### Solution Applied
1. **Centralized API Configuration**: All API endpoints now use the centralized configuration from `src/config/api.js`
2. **Environment Detection**: The app automatically detects the environment and uses appropriate backend URLs
3. **Hardcoded URL Removal**: Replaced all hardcoded `localhost:5000` URLs with proper API endpoint constants

### Setting Up Production Backend URL

#### Option 1: Environment Variable (Recommended)
Set the `REACT_APP_BACKEND_URL` environment variable in your Render frontend service:

```bash
REACT_APP_BACKEND_URL=https://your-backend-service.onrender.com
```

#### Option 2: Update API Configuration
Update the backend URL in `src/config/api.js`:

```javascript
// Find your actual backend URL from Render dashboard
return 'https://gamepro-[your-hash].onrender.com';
```

### How to Find Your Backend URL
1. Go to your Render dashboard
2. Click on your backend service (gamepro)
3. Copy the URL from the service details
4. It should look like: `https://gamepro-[hash].onrender.com`

### Verification
After deployment, check the browser console. You should see:
```
API Configuration: {
  backendUrl: "https://your-backend-service.onrender.com",
  currentHost: "your-frontend.onrender.com",
  environment: "production"
}
```

### API Endpoints Fixed
- ✅ `/api/campaigns`
- ✅ `/api/schedules` 
- ✅ `/api/games`
- ✅ `/api/fetch-history`
- ✅ `/api/email-config`
- ✅ `/api/send-email`
- ✅ `/api/scheduled-emails`
- ✅ `/api/check-proxy`
- ✅ `/proxy-postback`
- ✅ `/api/received-postbacks`
- ✅ All other endpoints

### Testing
1. Deploy both frontend and backend to Render
2. Set the correct `REACT_APP_BACKEND_URL` in frontend environment variables
3. Test the postback functionality
4. Check browser console for any remaining localhost references
