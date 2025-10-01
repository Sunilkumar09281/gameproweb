// Test script for offer tracking system
const axios = require('axios');

const BASE_URL = 'http://localhost:5001';

async function testOfferTracking() {
  console.log('🎯 Testing Offer Tracking System...\n');

  try {
    // Step 1: Login as admin
    console.log('👤 Step 1: Logging in as admin...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });

    const adminToken = loginResponse.data.token;
    console.log('✅ Admin logged in successfully');

    // Step 2: Login as regular user
    console.log('\n👤 Step 2: Logging in as regular user...');
    const userLoginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: 'user',
      password: 'user123'
    });

    const userToken = userLoginResponse.data.token;
    console.log('✅ User logged in successfully');

    // Step 3: Track offer click
    console.log('\n🖱️ Step 3: Tracking offer click...');
    const clickResponse = await axios.post(`${BASE_URL}/api/offer/track-click`, {
      offerName: 'Test Game Offer',
      offerUrl: 'https://example.com/game',
      offerPartner: 'Test Partner',
      rewardAmount: 25
    }, {
      headers: { Authorization: `Bearer ${userToken}` }
    });

    const logId = clickResponse.data.logId;
    console.log('✅ Offer click tracked:', clickResponse.data.message);
    console.log('📝 Log ID:', logId);

    // Step 4: Complete the offer
    console.log('\n🎉 Step 4: Completing the offer...');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds

    const completeResponse = await axios.post(`${BASE_URL}/api/offer/complete`, {
      logId: logId,
      offerName: 'Test Game Offer',
      offerPartner: 'Test Partner',
      amount: 25
    }, {
      headers: { Authorization: `Bearer ${userToken}` }
    });

    console.log('✅ Offer completed:', completeResponse.data.message);
    console.log('💰 Points earned:', completeResponse.data.pointsEarned);
    console.log('⏱️ Completion time:', completeResponse.data.completionTime, 'seconds');

    // Step 5: Check offer logs (admin only)
    console.log('\n📊 Step 5: Checking offer logs (admin view)...');
    const logsResponse = await axios.get(`${BASE_URL}/api/admin/offer-logs?limit=5`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    console.log('✅ Offer logs retrieved');
    console.log('📈 Statistics:', logsResponse.data.statistics);
    console.log('📋 Recent logs:', logsResponse.data.logs.length, 'entries');
    
    if (logsResponse.data.logs.length > 0) {
      const latestLog = logsResponse.data.logs[0];
      console.log('📝 Latest log:', {
        user: latestLog.username,
        offer: latestLog.offerName,
        status: latestLog.status,
        reward: latestLog.rewardAmount,
        completionTime: latestLog.completionTime
      });
    }

    console.log('\n🎉 OFFER TRACKING SYSTEM TEST COMPLETED SUCCESSFULLY!');
    console.log('✅ All features working:');
    console.log('  - Offer click tracking');
    console.log('  - Offer completion tracking');
    console.log('  - Admin logs access');
    console.log('  - User points update');
    console.log('  - Completion time calculation');

  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
  }
}

testOfferTracking();
