// Direct postback test
const axios = require('axios');

const BASE_URL = 'http://localhost:5001';

async function directPostbackTest() {
  console.log('📥 Direct Postback Test...\n');

  try {
    const testPostback = {
      user_id: 'user',
      offer_id: 'direct_test_' + Date.now(),
      offer_name: 'Direct Test Offer',
      payout: 15.50,
      currency: 'USD',
      status: 'completed',
      conversion_id: 'conv_direct_' + Date.now(),
      click_id: 'click_direct_' + Date.now(),
      source: 'direct_test'
    };

    console.log('📤 Sending postback:', testPostback);
    
    const response = await axios.post(`${BASE_URL}/api/postback`, testPostback);
    
    console.log('✅ Response:', response.data);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
  }
}

directPostbackTest();
