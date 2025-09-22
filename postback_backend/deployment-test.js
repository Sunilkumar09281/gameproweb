// Deployment Test Script
// Run this script to verify your backend deployment is working correctly

const BASE_URL = 'https://gameproback.onrender.com';

async function testEndpoint(endpoint, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    console.log(`Testing ${method} ${BASE_URL}${endpoint}...`);
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const text = await response.text();
    
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    
    console.log(`✅ Status: ${response.status}`);
    console.log(`✅ Response:`, data);
    console.log('---');
    
    return { status: response.status, data, success: response.ok };
  } catch (error) {
    console.log(`❌ Error testing ${endpoint}:`, error.message);
    console.log('---');
    return { error: error.message, success: false };
  }
}

async function runDeploymentTests() {
  console.log('🚀 Starting Backend Deployment Tests...\n');
  
  // Test 1: Root endpoint
  await testEndpoint('/');
  
  // Test 2: Health endpoint
  await testEndpoint('/health');
  
  // Test 3: Proxy postback GET (should return error about missing target)
  await testEndpoint('/proxy-postback');
  
  // Test 4: Proxy postback POST (should return error about missing URL)
  await testEndpoint('/proxy-postback', 'POST', {});
  
  // Test 5: Receive postback endpoint
  await testEndpoint('/api/receive-postback', 'POST', { test: 'data' });
  
  // Test 6: Get received postbacks
  await testEndpoint('/api/received-postbacks');
  
  // Test 7: Get games
  await testEndpoint('/api/games');
  
  // Test 8: Get partners
  await testEndpoint('/api/partners');
  
  console.log('🎯 Deployment tests completed!');
  console.log('\nExpected Results:');
  console.log('- Root (/) should return: {"status":"healthy","message":"Postback backend is running"...}');
  console.log('- Health should return: {"status":"OK",...}');
  console.log('- Proxy endpoints should return error messages (not 404)');
  console.log('- API endpoints should return data or empty arrays (not 404)');
}

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
  // Node.js environment
  const fetch = require('node-fetch');
  runDeploymentTests();
} else {
  // Browser environment
  window.runDeploymentTests = runDeploymentTests;
  console.log('Run runDeploymentTests() in the browser console to test your deployment');
}
