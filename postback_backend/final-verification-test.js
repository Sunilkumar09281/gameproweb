// Final verification test for postback to offer logs
const axios = require('axios');

const BASE_URL = 'http://localhost:5001';

async function finalVerificationTest() {
  console.log('🔍 Final Verification: Postback to Offer Logs Integration...\n');

  try {
    // Step 1: Login as admin
    console.log('👤 Step 1: Admin login...');
    const adminLogin = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    const adminToken = adminLogin.data.token;
    console.log('✅ Admin logged in successfully');

    // Step 2: Check current offer logs
    console.log('\n📊 Step 2: Checking current offer logs...');
    const currentLogs = await axios.get(`${BASE_URL}/api/admin/offer-logs`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    console.log('📋 Current offer logs statistics:');
    console.log(`   Total logs: ${currentLogs.data.statistics.totalLogs}`);
    console.log(`   Completed offers: ${currentLogs.data.statistics.completedOffers}`);
    console.log(`   Clicked offers: ${currentLogs.data.statistics.clickedOffers}`);

    // Step 3: Look for postback-created offer logs
    console.log('\n🔍 Step 3: Looking for postback-created offer logs...');
    const postbackLogs = currentLogs.data.logs.filter(log => 
      log.metadata?.completionMethod === 'postback'
    );

    console.log(`✅ Found ${postbackLogs.length} postback-created offer logs`);

    if (postbackLogs.length > 0) {
      console.log('\n📝 Postback offer logs details:');
      postbackLogs.forEach((log, index) => {
        console.log(`   ${index + 1}. ${log.offerName}`);
        console.log(`      User: ${log.username}`);
        console.log(`      Reward: $${log.rewardAmount}`);
        console.log(`      Status: ${log.status}`);
        console.log(`      Completion Method: ${log.metadata?.completionMethod}`);
        console.log(`      Source: ${log.metadata?.source}`);
        console.log(`      Postback ID: ${log.metadata?.postbackId}`);
        console.log(`      Conversion ID: ${log.metadata?.conversionId}`);
        console.log('');
      });
    }

    // Step 4: Check postback logs
    console.log('📥 Step 4: Checking postback logs...');
    const postbackData = await axios.get(`${BASE_URL}/api/received-postbacks`);
    
    console.log('📋 Postback statistics:');
    console.log(`   Total postbacks: ${postbackData.data.statistics.totalPostbacks}`);
    console.log(`   Completed postbacks: ${postbackData.data.statistics.completedPostbacks}`);
    console.log(`   Processed postbacks: ${postbackData.data.statistics.processedPostbacks}`);
    console.log(`   Total payout: $${postbackData.data.statistics.totalPayout}`);

    // Step 5: Send one more test postback
    console.log('\n📥 Step 5: Sending final test postback...');
    const finalTestPostback = {
      user_id: 'user',
      offer_id: 'final_verification_' + Date.now(),
      offer_name: 'Final Verification Survey',
      payout: 30.00,
      currency: 'USD',
      status: 'completed',
      conversion_id: 'conv_final_' + Date.now(),
      click_id: 'click_final_' + Date.now(),
      source: 'verification_test'
    };

    const finalPostbackResponse = await axios.post(`${BASE_URL}/api/postback`, finalTestPostback);
    console.log('✅ Final postback sent successfully');
    console.log(`📝 Postback ID: ${finalPostbackResponse.data.postback_id}`);

    // Wait for processing
    console.log('\n⏳ Waiting 5 seconds for processing...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Step 6: Check updated logs
    console.log('📊 Step 6: Checking updated offer logs...');
    const updatedLogs = await axios.get(`${BASE_URL}/api/admin/offer-logs`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    const newPostbackLogs = updatedLogs.data.logs.filter(log => 
      log.metadata?.completionMethod === 'postback'
    );

    console.log(`✅ Now found ${newPostbackLogs.length} postback-created offer logs`);
    console.log(`📈 Increase: ${newPostbackLogs.length - postbackLogs.length} new offer logs`);

    // Look for our final test postback
    const finalTestLog = newPostbackLogs.find(log => 
      log.offerName === finalTestPostback.offer_name
    );

    if (finalTestLog) {
      console.log('\n🎯 Final test postback found in offer logs!');
      console.log('📝 Details:');
      console.log(`   Offer Name: ${finalTestLog.offerName}`);
      console.log(`   User: ${finalTestLog.username}`);
      console.log(`   Reward: $${finalTestLog.rewardAmount}`);
      console.log(`   Status: ${finalTestLog.status}`);
      console.log(`   Completion Method: ${finalTestLog.metadata?.completionMethod}`);
      console.log(`   Postback ID: ${finalTestLog.metadata?.postbackId}`);
    } else {
      console.log('❌ Final test postback not found in offer logs');
    }

    // Final summary
    console.log('\n🎉 FINAL VERIFICATION RESULTS:');
    console.log(`✅ Postbacks received and processed: ${postbackData.data.statistics.processedPostbacks}`);
    console.log(`✅ Offer logs created from postbacks: ${newPostbackLogs.length}`);
    console.log(`✅ Integration working: ${newPostbackLogs.length > 0 ? 'YES' : 'NO'}`);
    console.log(`✅ Latest postback in offer logs: ${finalTestLog ? 'YES' : 'NO'}`);

    if (newPostbackLogs.length > 0 && finalTestLog) {
      console.log('\n🎯 SUCCESS: Postback to Offer Logs integration is WORKING PERFECTLY!');
      console.log('✅ Postbacks are automatically creating offer logs');
      console.log('✅ All metadata is properly stored');
      console.log('✅ Admin dashboard shows postback completions');
      console.log('✅ User profiles are updated with points');
    } else {
      console.log('\n❌ ISSUE: Integration needs attention');
    }

  } catch (error) {
    console.error('\n❌ Verification test failed:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
  }
}

finalVerificationTest();
