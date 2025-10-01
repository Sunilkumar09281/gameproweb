// Simple postback test without admin login
const axios = require('axios');

const BASE_URL = 'http://localhost:5001';

async function simplePostbackTest() {
  console.log('📥 Testing Simple Postback Processing...\n');

  try {
    // Step 1: Login as regular user first
    console.log('👤 Step 1: Logging in as regular user...');
    const userLogin = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: 'user',
      password: 'user123'
    });
    const userToken = userLogin.data.token;
    const initialUser = userLogin.data.user;
    console.log('✅ User login successful!');
    console.log('📋 Initial user points:', initialUser.points);

    // Step 2: Send postback for this user
    console.log('\n📥 Step 2: Sending postback...');
    const testPostback = {
      user_id: 'user',
      offer_id: 'test_offer_' + Date.now(),
      offer_name: 'Test Survey Completion',
      payout: 25.75,
      currency: 'USD',
      status: 'completed',
      conversion_id: 'conv_' + Date.now(),
      click_id: 'click_' + Date.now(),
      source: 'test_provider'
    };

    const postbackResponse = await axios.post(`${BASE_URL}/api/postback`, testPostback);
    console.log('✅ Postback sent successfully!');
    console.log('📝 Postback ID:', postbackResponse.data.postback_id);

    // Step 3: Wait and check user profile update
    console.log('\n⏳ Waiting 3 seconds for processing...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    const updatedProfile = await axios.get(`${BASE_URL}/api/auth/profile`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const updatedUser = updatedProfile.data.user;
    
    console.log('✅ Profile check results:');
    console.log(`   Before: ${initialUser.points} points`);
    console.log(`   After:  ${updatedUser.points} points`);
    console.log(`   Gained: ${updatedUser.points - initialUser.points} points`);
    console.log(`   Expected: ${testPostback.payout} points`);

    // Step 4: Check postback logs
    console.log('\n📊 Step 4: Checking postback logs...');
    const postbackLogs = await axios.get(`${BASE_URL}/api/received-postbacks`);
    console.log('✅ Postback statistics:', postbackLogs.data.statistics);

    // Step 5: Try to access offer logs (might fail without admin)
    console.log('\n📈 Step 5: Attempting to check offer logs...');
    try {
      const offerLogs = await axios.get(`${BASE_URL}/api/admin/offer-logs`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      console.log('✅ Offer logs accessible!');
      console.log('📊 Offer log statistics:', offerLogs.data.statistics);
      
      // Look for our postback in offer logs
      const postbackOfferLogs = offerLogs.data.logs.filter(log => 
        log.metadata?.completionMethod === 'postback' && 
        log.offerName === testPostback.offer_name
      );
      
      if (postbackOfferLogs.length > 0) {
        console.log('✅ Found postback in offer logs!');
        console.log('📝 Offer log details:', {
          offerName: postbackOfferLogs[0].offerName,
          status: postbackOfferLogs[0].status,
          rewardAmount: postbackOfferLogs[0].rewardAmount,
          completionMethod: postbackOfferLogs[0].metadata?.completionMethod
        });
      } else {
        console.log('❌ Postback not found in offer logs');
      }
    } catch (error) {
      console.log('⚠️ Cannot access offer logs (admin required):', error.response?.status);
    }

    // Step 6: Test another postback
    console.log('\n📥 Step 6: Testing second postback...');
    const testPostback2 = {
      user_id: 'user',
      offer_id: 'test_offer_2_' + Date.now(),
      offer_name: 'Second Test Offer',
      payout: 10.25,
      status: 'completed',
      source: 'another_provider'
    };

    await axios.post(`${BASE_URL}/api/postback`, testPostback2);
    console.log('✅ Second postback sent!');

    // Wait and check final state
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const finalProfile = await axios.get(`${BASE_URL}/api/auth/profile`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const finalUser = finalProfile.data.user;
    
    console.log('\n🎯 Final Results:');
    console.log(`   Initial points: ${initialUser.points}`);
    console.log(`   Final points: ${finalUser.points}`);
    console.log(`   Total gained: ${finalUser.points - initialUser.points}`);
    console.log(`   Expected total: ${testPostback.payout + testPostback2.payout}`);

    const finalPostbackLogs = await axios.get(`${BASE_URL}/api/received-postbacks`);
    console.log('📊 Final postback statistics:', finalPostbackLogs.data.statistics);

    console.log('\n🎉 POSTBACK PROCESSING TEST RESULTS:');
    const pointsMatch = (finalUser.points - initialUser.points) === (testPostback.payout + testPostback2.payout);
    console.log(`✅ Profile updates: ${pointsMatch ? 'WORKING' : 'ISSUE'}`);
    console.log(`✅ Postback storage: ${finalPostbackLogs.data.statistics.totalPostbacks >= 2 ? 'WORKING' : 'ISSUE'}`);
    console.log(`✅ Processing: ${finalPostbackLogs.data.statistics.processedPostbacks >= 2 ? 'WORKING' : 'ISSUE'}`);

  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
  }
}

simplePostbackTest();
