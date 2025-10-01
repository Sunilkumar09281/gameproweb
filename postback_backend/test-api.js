// Test script to verify API endpoints
const axios = require('axios');

const BASE_URL = 'http://localhost:5001';

async function testEndpoints() {
  console.log('🔍 Testing API endpoints...');

  try {
    // Test basic connectivity
    const response = await axios.get(`${BASE_URL}/api/test`);
    console.log('✅ Basic endpoint test:', response.data);
  } catch (error) {
    console.error('❌ Basic endpoint test failed:', error.message);
    return;
  }

  // Test server info
  try {
    const response = await axios.get(`${BASE_URL}/api/server-info`);
    console.log('✅ Server info:', response.data);
  } catch (error) {
    console.error('❌ Server info failed:', error.message);
  }

  // Test authentication endpoints (without auth)
  try {
    const response = await axios.get(`${BASE_URL}/api/auth/profile`);
    console.log('✅ Profile endpoint (should fail with 401):', response.status);
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('✅ Profile endpoint correctly requires auth');
    } else {
      console.error('❌ Profile endpoint unexpected error:', error.message);
    }
  }

  // Test profile update endpoint (without auth)
  try {
    const response = await axios.put(`${BASE_URL}/api/auth/update-profile`, {
      fullName: 'Test User'
    });
    console.log('✅ Update profile endpoint (should fail with 401):', response.status);
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('✅ Update profile endpoint correctly requires auth');
    } else {
      console.error('❌ Update profile endpoint unexpected error:', error.message);
    }
  }

  console.log('🔍 API tests completed');
}

testEndpoints();
