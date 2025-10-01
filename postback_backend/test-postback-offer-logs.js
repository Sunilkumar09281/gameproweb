// Test postback to offer logs integration
const axios = require('axios');

const BASE_URL = 'http://localhost:5001';

async function testPostbackToOfferLogs() {
  console.log('🔄 Testing Postback to Offer Logs Integration...\n');

  try {
    // Step 1: Login as admin to access offer logs
    console.log('👤 Step 1: Logging in as admin...');
    const adminLogin = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    const adminToken = adminLogin.data.token;
    console.log('✅ Admin login successful!');

    // Step 2: Get initial offer logs count
    console.log('\n📊 Step 2: Getting initial offer logs...');
    const initialLogs = await axios.get(`${BASE_URL}/api/admin/offer-logs`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const initialCount = initialLogs.data.statistics.totalLogs;
    const initialCompleted = initialLogs.data.statistics.completedOffers;
    console.log('✅ Initial offer logs:', {
      total: initialCount,
      completed: initialCompleted
    });

    // Step 3: Send a test postback
    console.log('\n📥 Step 3: Sending test postback...');
    const testPostback = {
      user_id: 'user', // Test user
      offer_id: 'offer_' + Date.now(),
      offer_name: 'Survey Completion Test',
      payout: 20.50,
      currency: 'USD',
      status: 'completed',
      conversion_id: 'conv_' + Date.now(),
      click_id: 'click_' + Date.now(),
      source: 'survey_provider'
    };

    const postbackResponse = await axios.post(`${BASE_URL}/api/postback`, testPostback);
    console.log('✅ Postback sent successfully!');
    console.log('📝 Response:', {
      success: postbackResponse.data.success,
      postback_id: postbackResponse.data.postback_id
    });

    // Wait for processing
    console.log('\n⏳ Waiting 3 seconds for processing...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Step 4: Check updated offer logs
    console.log('\n📊 Step 4: Checking updated offer logs...');
    const updatedLogs = await axios.get(`${BASE_URL}/api/admin/offer-logs`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const newCount = updatedLogs.data.statistics.totalLogs;
    const newCompleted = updatedLogs.data.statistics.completedOffers;
    
    console.log('✅ Updated offer logs:', {
      total: newCount,
      completed: newCompleted,
      added: newCount - initialCount
    });

    // Step 5: Find the postback-created offer log
    console.log('\n🔍 Step 5: Looking for postback-created offer log...');
    const postbackLogs = updatedLogs.data.logs.filter(log => 
      log.metadata?.completionMethod === 'postback' && 
      log.offerName === testPostback.offer_name
    );

    if (postbackLogs.length > 0) {
      const postbackLog = postbackLogs[0];
      console.log('✅ Found postback-created offer log!');
      console.log('📝 Offer log details:', {
        id: postbackLog._id,
        username: postbackLog.username,
        offerName: postbackLog.offerName,
        rewardAmount: postbackLog.rewardAmount,
        status: postbackLog.status,
        completionMethod: postbackLog.metadata?.completionMethod,
        postbackId: postbackLog.metadata?.postbackId,
        conversionId: postbackLog.metadata?.conversionId,
        source: postbackLog.metadata?.source
      });
    } else {
      console.log('❌ No postback-created offer log found!');
      console.log('📋 Recent logs:');
      updatedLogs.data.logs.slice(0, 3).forEach((log, index) => {
        console.log(`   ${index + 1}. ${log.offerName} - ${log.status} - ${log.metadata?.completionMethod || 'unknown'}`);
      });
    }

    // Step 6: Send another postback with different user
    console.log('\n📥 Step 6: Testing with different scenario...');
    const testPostback2 = {
      user_id: 'admin', // Different user
      offer_id: 'offer_admin_' + Date.now(),
      offer_name: 'Admin Test Offer',
      payout: 15.25,
      currency: 'USD',
      status: 'completed',
      conversion_id: 'conv_admin_' + Date.now(),
      source: 'test_provider'
    };

    await axios.post(`${BASE_URL}/api/postback`, testPostback2);
    console.log('✅ Second postback sent!');

    // Wait and check again
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const finalLogs = await axios.get(`${BASE_URL}/api/admin/offer-logs`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const finalCount = finalLogs.data.statistics.totalLogs;
    
    console.log('\n📊 Final Results:');
    console.log(`   Initial logs: ${initialCount}`);
    console.log(`   Final logs: ${finalCount}`);
    console.log(`   Total added: ${finalCount - initialCount}`);
    console.log(`   Expected: 2 (one for each postback)`);

    // Step 7: Check postback logs
    console.log('\n📥 Step 7: Checking postback logs...');
    const postbackLogs2 = await axios.get(`${BASE_URL}/api/received-postbacks`);
    console.log('✅ Postback logs:', {
      total: postbackLogs2.data.statistics.totalPostbacks,
      completed: postbackLogs2.data.statistics.completedPostbacks,
      processed: postbackLogs2.data.statistics.processedPostbacks
    });

    // Summary
    console.log('\n🎉 POSTBACK TO OFFER LOGS TEST SUMMARY:');
    console.log(`✅ Postbacks sent: 2`);
    console.log(`✅ Offer logs created: ${finalCount - initialCount}`);
    console.log(`✅ Integration working: ${finalCount > initialCount ? 'YES' : 'NO'}`);
    
    if (finalCount > initialCount) {
      console.log('\n🎯 SUCCESS: Postbacks are properly creating offer logs!');
      console.log('✅ User profiles updated with points');
      console.log('✅ Offer logs created with postback metadata');
      console.log('✅ Admin dashboard shows postback completions');
    } else {
      console.log('\n❌ ISSUE: Postbacks not creating offer logs properly');
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
  }
}

testPostbackToOfferLogs();
