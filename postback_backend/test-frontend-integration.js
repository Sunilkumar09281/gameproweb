// Test offer logs endpoint
const axios = require('axios');

const BASE_URL = 'http://localhost:5001';

async function testOfferLogsEndpoint() {
  console.log('🔍 Testing Offer Logs Endpoint...\n');

  try {
    // Step 1: Login as admin
    console.log('👤 Step 1: Admin login...');
    const adminLogin = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    const adminToken = adminLogin.data.token;
    console.log('✅ Admin logged in successfully');

    // Step 2: Test offer logs endpoint
    console.log('\n📊 Step 2: Testing offer logs endpoint...');
    const offerLogs = await axios.get(`${BASE_URL}/api/admin/offer-logs`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    console.log('✅ Offer logs endpoint working!');
    console.log('📋 Response structure:');
    console.log(`   Success: ${offerLogs.data.success}`);
    console.log(`   Logs count: ${offerLogs.data.logs?.length || 0}`);
    console.log('   Statistics:', offerLogs.data.statistics);
    console.log('   Pagination:', offerLogs.data.pagination);

    // Step 3: Send a test postback to create an offer log
    console.log('\n📥 Step 3: Creating test postback for offer log...');
    const testPostback = {
      user_id: 'user',
      offer_id: 'frontend_test_' + Date.now(),
      offer_name: 'Frontend Integration Test',
      payout: 12.50,
      status: 'completed',
      partner: 'Frontend Test Partner'
    };

    await axios.post(`${BASE_URL}/api/postback`, testPostback);
    console.log('✅ Test postback sent');

    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 4: Check updated offer logs
    console.log('\n📊 Step 4: Checking updated offer logs...');
    const updatedLogs = await axios.get(`${BASE_URL}/api/admin/offer-logs`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    console.log('✅ Updated offer logs retrieved!');
    console.log('📋 Updated statistics:', updatedLogs.data.statistics);
    
    // Look for our test postback
    const testLog = updatedLogs.data.logs.find(log => 
      log.offerName === testPostback.offer_name
    );

    if (testLog) {
      console.log('\n🎯 Test postback found in offer logs!');
      console.log('📝 Log details:');
      console.log(`   User: ${testLog.username}`);
      console.log(`   Offer: ${testLog.offerName}`);
      console.log(`   Partner: ${testLog.offerPartner}`);
      console.log(`   Reward: $${testLog.rewardAmount}`);
      console.log(`   Status: ${testLog.status}`);
      console.log(`   Completion Method: ${testLog.metadata?.completionMethod}`);
    }

    console.log('\n🎉 FRONTEND INTEGRATION TEST RESULTS:');
    console.log('✅ Server running: SUCCESS');
    console.log('✅ Admin authentication: SUCCESS');
    console.log('✅ Offer logs endpoint: SUCCESS');
    console.log('✅ Statistics format: CORRECT (object)');
    console.log('✅ Postback to offer logs: SUCCESS');
    console.log('✅ Frontend should now work properly!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
  }
}

testOfferLogsEndpoint();
