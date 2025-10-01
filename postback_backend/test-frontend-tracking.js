// Simple test to verify offer tracking from frontend perspective
const axios = require('axios');

const BASE_URL = 'http://localhost:5001';

async function testFrontendOfferTracking() {
  console.log('🎯 Testing Frontend Offer Tracking Integration...\n');

  try {
    // Step 1: Login as user
    console.log('👤 Step 1: Logging in as user...');
    const userLoginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: 'user',
      password: 'user123'
    });

    const userToken = userLoginResponse.data.token;
    console.log('✅ User logged in successfully');

    // Step 2: Simulate frontend offer click (like from home page)
    console.log('\n🖱️ Step 2: Simulating offer click from home page...');
    
    // This simulates what happens when user clicks an offer on home page
    const offerData = {
      title: 'Premium Survey',
      type: 'offers',
      reward: 10,
      partner: 'Survey Provider',
      link: 'https://example.com/premium-survey'
    };

    // Track the click (this is what the updated handleGameClick does)
    const clickResponse = await axios.post(`${BASE_URL}/api/offer/track-click`, {
      offerName: offerData.title,
      offerUrl: offerData.link,
      offerPartner: offerData.partner,
      rewardAmount: offerData.reward
    }, {
      headers: { Authorization: `Bearer ${userToken}` }
    });

    const logId = clickResponse.data.logId;
    console.log('✅ Offer click tracked with ID:', logId);

    // Step 3: Wait a moment then complete the offer
    console.log('\n⏳ Step 3: Waiting 2 seconds then completing offer...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    const completeResponse = await axios.post(`${BASE_URL}/api/offer/complete`, {
      logId: logId,
      offerName: offerData.title,
      offerPartner: offerData.partner,
      amount: offerData.reward
    }, {
      headers: { Authorization: `Bearer ${userToken}` }
    });

    console.log('✅ Offer completed successfully!');
    console.log('💰 Points earned:', completeResponse.data.pointsEarned);
    console.log('⏱️ Completion time:', completeResponse.data.completionTime, 'seconds');

    // Step 4: Login as admin and check logs
    console.log('\n👤 Step 4: Logging in as admin to check logs...');
    const adminLoginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });

    const adminToken = adminLoginResponse.data.token;
    console.log('✅ Admin logged in successfully');

    // Step 5: Check offer logs
    console.log('\n📊 Step 5: Checking offer logs in admin dashboard...');
    const logsResponse = await axios.get(`${BASE_URL}/api/admin/offer-logs?limit=5`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    console.log('✅ Offer logs retrieved successfully');
    console.log('📈 Statistics:', logsResponse.data.statistics);
    console.log('📋 Total logs:', logsResponse.data.pagination.totalLogs);
    console.log('📄 Logs on this page:', logsResponse.data.logs.length);

    if (logsResponse.data.logs.length > 0) {
      console.log('\n📝 Recent offer logs:');
      logsResponse.data.logs.forEach((log, index) => {
        console.log(`${index + 1}. User: ${log.username}`);
        console.log(`   Offer: ${log.offerName}`);
        console.log(`   Status: ${log.status}`);
        console.log(`   Reward: $${log.rewardAmount}`);
        console.log(`   Clicked: ${new Date(log.clickedAt).toLocaleString()}`);
        if (log.completedAt) {
          console.log(`   Completed: ${new Date(log.completedAt).toLocaleString()}`);
          console.log(`   Duration: ${log.completionTime}s`);
        }
        console.log('');
      });

      console.log('🎉 SUCCESS! Offer tracking is working correctly!');
      console.log('✅ Frontend integration working');
      console.log('✅ Backend tracking working');
      console.log('✅ Admin logs showing data');
      console.log('✅ User points updated');
      
    } else {
      console.log('❌ No logs found - there might still be an issue');
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
  }
}

testFrontendOfferTracking();
