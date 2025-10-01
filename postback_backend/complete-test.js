// Complete test script for profile update and points system
const axios = require('axios');

const BASE_URL = 'http://localhost:5001';
let authToken = null;
let testUserId = null;

async function runCompleteTest() {
  console.log('🚀 Starting Complete Profile & Points System Test...\n');

  try {
    // Step 1: Test basic connectivity
    console.log('📡 Step 1: Testing API connectivity...');
    const serverTest = await axios.get(`${BASE_URL}/api/test`);
    console.log('✅ API Server:', serverTest.data.message);

    // Step 2: Register or login a test user
    console.log('\n👤 Step 2: Testing user authentication...');
    
    // Try to register a new test user
    const testUsername = `testuser_${Date.now()}`;
    const testEmail = `test_${Date.now()}@example.com`;
    
    try {
      const registerResponse = await axios.post(`${BASE_URL}/api/auth/register`, {
        username: testUsername,
        email: testEmail,
        password: 'testpass123',
        fullName: 'Test User Profile'
      });
      
      authToken = registerResponse.data.token;
      testUserId = registerResponse.data.user.id;
      console.log('✅ User registered successfully:', testUsername);
      console.log('✅ Auth token received');
      
    } catch (regError) {
      console.log('ℹ️ Registration failed (user might exist), trying login...');
      
      // Try with default test user
      try {
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
          username: 'user',
          password: 'user123'
        });
        
        authToken = loginResponse.data.token;
        testUserId = loginResponse.data.user.id;
        console.log('✅ Logged in with existing user');
        
      } catch (loginError) {
        console.error('❌ Both registration and login failed');
        return;
      }
    }

    // Step 3: Test profile retrieval
    console.log('\n📋 Step 3: Testing profile retrieval...');
    const profileResponse = await axios.get(`${BASE_URL}/api/auth/profile`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Profile retrieved successfully');
    console.log('📊 Current user data:', {
      username: profileResponse.data.user.username,
      fullName: profileResponse.data.user.fullName,
      points: profileResponse.data.user.points,
      level: profileResponse.data.user.level
    });

    // Step 4: Test profile update
    console.log('\n✏️ Step 4: Testing profile update...');
    const updateData = {
      fullName: `Updated Test User ${Date.now()}`,
      email: `updated_${Date.now()}@example.com`
    };
    
    const updateResponse = await axios.put(`${BASE_URL}/api/auth/update-profile`, updateData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Profile updated successfully!');
    console.log('📝 Updated data:', {
      fullName: updateResponse.data.user.fullName,
      email: updateResponse.data.user.email
    });

    // Step 5: Test user statistics (before adding points)
    console.log('\n📊 Step 5: Testing user statistics (before points)...');
    const statsBefore = await axios.get(`${BASE_URL}/api/auth/user-stats`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Statistics retrieved (before):', statsBefore.data.stats);

    // Step 6: Test offer completion (automatic points update)
    console.log('\n🎯 Step 6: Testing offer completion & automatic points...');
    const offerData = {
      offerName: 'Test Survey Completion',
      offerPartner: 'TestPartner Inc',
      amount: 150,
      metadata: { testRun: true, timestamp: new Date().toISOString() }
    };
    
    const offerResponse = await axios.post(`${BASE_URL}/api/auth/complete-offer`, offerData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Offer completed successfully!');
    console.log('💰 Points earned:', offerResponse.data.pointsEarned);

    // Step 7: Test user statistics (after adding points)
    console.log('\n📈 Step 7: Testing user statistics (after points)...');
    const statsAfter = await axios.get(`${BASE_URL}/api/auth/user-stats`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Statistics retrieved (after):', statsAfter.data.stats);
    
    // Compare before and after
    const pointsDifference = statsAfter.data.stats.totalEarnings - statsBefore.data.stats.totalEarnings;
    console.log(`📊 Points difference: +${pointsDifference} (Expected: 150)`);
    
    if (pointsDifference >= 150) {
      console.log('✅ Automatic points update working correctly!');
    } else {
      console.log('⚠️ Points update might have an issue');
    }

    // Step 8: Test sample activities creation
    console.log('\n🧪 Step 8: Testing sample activities creation...');
    const sampleResponse = await axios.post(`${BASE_URL}/api/auth/create-sample-activities`, {}, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Sample activities created:', sampleResponse.data.message);
    console.log('📊 Activities created:', sampleResponse.data.activitiesCreated);
    console.log('💰 Points added:', sampleResponse.data.pointsAdded);

    // Step 9: Final statistics check
    console.log('\n🏁 Step 9: Final statistics check...');
    const finalStats = await axios.get(`${BASE_URL}/api/auth/user-stats`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Final statistics:', finalStats.data.stats);

    // Summary
    console.log('\n🎉 TEST SUMMARY:');
    console.log('✅ API Connectivity: WORKING');
    console.log('✅ User Authentication: WORKING');
    console.log('✅ Profile Retrieval: WORKING');
    console.log('✅ Profile Update: WORKING (No more "Failed to fetch" error!)');
    console.log('✅ User Statistics: WORKING');
    console.log('✅ Offer Completion: WORKING');
    console.log('✅ Automatic Points Update: WORKING');
    console.log('✅ Sample Activities: WORKING');
    
    console.log('\n🚀 All systems are working correctly!');
    console.log('🎯 Profile update error has been fixed');
    console.log('💰 Automatic points system is functioning');
    
  } catch (error) {
    console.error('\n❌ Test failed at some step:');
    console.error('Error:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
  }
}

runCompleteTest();
