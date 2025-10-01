// Quick test to create offer logs and check if they appear
const axios = require('axios');

const BASE_URL = 'http://localhost:5001';

async function testOfferLogsVisibility() {
  console.log('🔍 Testing Offer Logs Visibility...\n');

  try {
    // Step 1: Login as user
    console.log('👤 Step 1: Logging in as user...');
    const userLoginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: 'user',
      password: 'user123'
    });

    const userToken = userLoginResponse.data.token;
    console.log('✅ User logged in successfully');

    // Step 2: Create a test offer click
    console.log('\n🖱️ Step 2: Creating test offer click...');
    const clickResponse = await axios.post(`${BASE_URL}/api/offer/track-click`, {
      offerName: 'Debug Test Offer',
      offerUrl: 'https://example.com/debug-game',
      offerPartner: 'Debug Partner',
      rewardAmount: 15
    }, {
      headers: { Authorization: `Bearer ${userToken}` }
    });

    console.log('✅ Offer click tracked:', clickResponse.data);

    // Step 3: Login as admin
    console.log('\n👤 Step 3: Logging in as admin...');
    const adminLoginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });

    const adminToken = adminLoginResponse.data.token;
    console.log('✅ Admin logged in successfully');

    // Step 4: Check if logs appear
    console.log('\n📊 Step 4: Checking offer logs...');
    const logsResponse = await axios.get(`${BASE_URL}/api/admin/offer-logs?limit=10`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    console.log('✅ Logs response received');
    console.log('📈 Statistics:', logsResponse.data.statistics);
    console.log('📋 Total logs:', logsResponse.data.pagination.totalLogs);
    console.log('📄 Logs on this page:', logsResponse.data.logs.length);

    if (logsResponse.data.logs.length > 0) {
      console.log('\n📝 Recent logs:');
      logsResponse.data.logs.forEach((log, index) => {
        console.log(`${index + 1}. ${log.username} clicked "${log.offerName}" - Status: ${log.status} - Reward: $${log.rewardAmount}`);
      });
    } else {
      console.log('\n❌ No logs found! This is the issue.');
    }

    // Step 5: Create multiple test clicks to populate data
    console.log('\n🎯 Step 5: Creating multiple test clicks...');
    const testOffers = [
      { name: 'Water Color Sort', partner: 'Gaming Co', reward: 14.41 },
      { name: 'Grand Hotel Mania', partner: 'Hotel Games', reward: 5.89 },
      { name: 'Colorwood Sort', partner: 'Puzzle Inc', reward: 6.02 }
    ];

    for (const offer of testOffers) {
      await axios.post(`${BASE_URL}/api/offer/track-click`, {
        offerName: offer.name,
        offerUrl: `https://example.com/${offer.name.toLowerCase().replace(/\s+/g, '-')}`,
        offerPartner: offer.partner,
        rewardAmount: offer.reward
      }, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      
      console.log(`✅ Created click for: ${offer.name}`);
    }

    // Step 6: Check logs again
    console.log('\n📊 Step 6: Checking logs after creating test data...');
    const finalLogsResponse = await axios.get(`${BASE_URL}/api/admin/offer-logs?limit=10`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    console.log('📋 Total logs now:', finalLogsResponse.data.pagination.totalLogs);
    console.log('📄 Recent logs:', finalLogsResponse.data.logs.length);

    if (finalLogsResponse.data.logs.length > 0) {
      console.log('\n🎉 SUCCESS! Logs are now visible:');
      finalLogsResponse.data.logs.forEach((log, index) => {
        console.log(`${index + 1}. ${log.username} clicked "${log.offerName}" at ${new Date(log.clickedAt).toLocaleString()}`);
      });
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    if (error.response?.status === 404) {
      console.log('💡 The endpoint might not exist. Check if simple-server.js has the offer tracking endpoints.');
    }
  }
}

testOfferLogsVisibility();
