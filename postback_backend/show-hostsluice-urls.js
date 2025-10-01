// Show generated URLs for hostsluice partner
const axios = require('axios');

const BASE_URL = 'http://localhost:5001';
const PARTNER_ID = '68dbcb9746745689865cb273';

async function showGeneratedURLs() {
  console.log('🔗 Postback URLs for Hostsluice Partner\n');

  try {
    // Generate URL with sample data
    const urlData = {
      userId: 'user123',
      offerId: 'survey_456',
      offerName: 'Health Survey',
      payout: 25.75
    };

    const response = await axios.post(
      `${BASE_URL}/api/partners/${PARTNER_ID}/generate-url`,
      urlData
    );

    console.log('📋 GENERATED POSTBACK URLS:');
    console.log('');
    console.log('🔗 Template URL (with placeholders):');
    console.log(response.data.postbackUrl);
    console.log('');
    console.log('🧪 Test URL (ready to use):');
    console.log(response.data.testUrl);
    console.log('');
    
    console.log('📝 URL BREAKDOWN:');
    const testUrl = new URL(response.data.testUrl);
    console.log(`   Base: ${testUrl.origin}${testUrl.pathname}`);
    console.log('   Parameters:');
    testUrl.searchParams.forEach((value, key) => {
      console.log(`     ${key}: ${value}`);
    });

    console.log('');
    console.log('🎯 HOW TO USE:');
    console.log('1. Copy the Template URL');
    console.log('2. Replace {user_id}, {offer_id}, etc. with actual values');
    console.log('3. Send HTTP GET request to the URL when offer is completed');
    console.log('4. System will automatically process the postback');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

showGeneratedURLs();
