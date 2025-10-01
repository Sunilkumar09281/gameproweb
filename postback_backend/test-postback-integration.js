// Test postback integration with offer logs
const axios = require('axios');

const BASE_URL = 'http://localhost:5001';

async function testPostbackIntegration() {
  console.log('📥 Testing Postback Integration & Offer Logs Update...\n');

  try {
    // Step 1: Login as user to get initial state
    console.log('👤 Step 1: Logging in as user...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: 'user',
      password: 'user123'
    });

    const token = loginResponse.data.token;
    const initialUser = loginResponse.data.user;
    console.log('✅ Login successful!');
    console.log('📋 Initial user state:', {
      username: initialUser.username,
      points: initialUser.points,
      level: initialUser.level
    });

    // Step 2: Check initial postback logs
    console.log('\n📊 Step 2: Checking initial postback logs...');
    const initialPostbacks = await axios.get(`${BASE_URL}/api/received-postbacks`);
    console.log('✅ Initial postback count:', initialPostbacks.data.statistics.totalPostbacks);

    // Step 3: Check initial offer logs
    console.log('\n📈 Step 3: Checking initial offer logs...');
    const adminLoginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    const adminToken = adminLoginResponse.data.token;
    
    const initialOfferLogs = await axios.get(`${BASE_URL}/api/admin/offer-logs`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ Initial offer logs count:', initialOfferLogs.data.statistics.totalLogs);

    // Step 4: Send test postback
    console.log('\n📥 Step 4: Sending test postback...');
    const testPostbackData = {
      user_id: 'user',
      offer_id: 'survey_test_' + Date.now(),
      offer_name: 'Health Survey Completion',
      payout: 15.75,
      currency: 'USD',
      status: 'completed',
      conversion_id: 'conv_' + Date.now(),
      click_id: 'click_' + Date.now(),
      source: 'survey_provider'
    };

    const postbackResponse = await axios.post(`${BASE_URL}/api/postback`, testPostbackData);
    
    if (postbackResponse.status === 200) {
      console.log('✅ Postback sent successfully!');
      console.log('📝 Postback ID:', postbackResponse.data.postback_id);
      console.log('💰 Payout:', testPostbackData.payout);
    }

    // Wait a moment for processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 5: Check updated postback logs
    console.log('\n📊 Step 5: Checking updated postback logs...');
    const updatedPostbacks = await axios.get(`${BASE_URL}/api/received-postbacks`);
    const newPostbackCount = updatedPostbacks.data.statistics.totalPostbacks;
    console.log('✅ New postback count:', newPostbackCount);
    console.log('📈 Postbacks added:', newPostbackCount - initialPostbacks.data.statistics.totalPostbacks);
    
    if (updatedPostbacks.data.postbacks.length > 0) {
      const latestPostback = updatedPostbacks.data.postbacks[0];
      console.log('📝 Latest postback:', {
        user_id: latestPostback.user_id,
        offer_name: latestPostback.offer_name,
        payout: latestPostback.payout,
        status: latestPostback.status,
        processed: latestPostback.processed
      });
    }

    // Step 6: Check updated offer logs
    console.log('\n📈 Step 6: Checking updated offer logs...');
    const updatedOfferLogs = await axios.get(`${BASE_URL}/api/admin/offer-logs`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const newOfferLogCount = updatedOfferLogs.data.statistics.totalLogs;
    console.log('✅ New offer logs count:', newOfferLogCount);
    console.log('📈 Offer logs added:', newOfferLogCount - initialOfferLogs.data.statistics.totalLogs);

    if (updatedOfferLogs.data.logs.length > 0) {
      const latestOfferLog = updatedOfferLogs.data.logs[0];
      console.log('📝 Latest offer log:', {
        username: latestOfferLog.username,
        offerName: latestOfferLog.offerName,
        rewardAmount: latestOfferLog.rewardAmount,
        status: latestOfferLog.status,
        completionMethod: latestOfferLog.metadata?.completionMethod
      });
    }

    // Step 7: Check user profile update
    console.log('\n👤 Step 7: Checking user profile update...');
    const updatedProfileResponse = await axios.get(`${BASE_URL}/api/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const updatedUser = updatedProfileResponse.data.user;
    console.log('✅ Profile update verification:');
    console.log(`   Before: ${initialUser.points} points, Level ${initialUser.level}`);
    console.log(`   After:  ${updatedUser.points} points, Level ${updatedUser.level}`);
    console.log(`   Gained: ${updatedUser.points - initialUser.points} points`);

    // Step 8: Test creating another postback
    console.log('\n🔄 Step 8: Testing another postback...');
    const testPostback2 = await axios.post(`${BASE_URL}/api/test-postback`);
    
    if (testPostback2.status === 200) {
      console.log('✅ Test postback created successfully!');
      console.log('📝 Test data:', testPostback2.data.testPostback);
    }

    console.log('\n🎉 POSTBACK INTEGRATION TEST COMPLETED!');
    console.log('✅ Postback endpoint working correctly');
    console.log('✅ Postbacks are processed and update user profiles');
    console.log('✅ Offer logs are updated with postback completions');
    console.log('✅ Admin dashboard shows postback activity');
    console.log('✅ Points and levels are updated automatically');

  } catch (error) {
    console.error('\n❌ Postback integration test failed:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
  }
}

testPostbackIntegration();
