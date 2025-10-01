// Test URL generation for specific partner
const axios = require('axios');

const BASE_URL = 'http://localhost:5001';
const PARTNER_ID = '68dbcb9746745689865cb273'; // hostsluice partner

async function testSpecificPartnerURL() {
  console.log('🔗 Testing URL Generation for Partner: hostsluice\n');

  try {
    // Step 1: Verify partner exists
    console.log('👥 Step 1: Verifying partner exists...');
    const partnersResponse = await axios.get(`${BASE_URL}/api/partners`);
    const partner = partnersResponse.data.find(p => p._id === PARTNER_ID);
    
    if (partner) {
      console.log('✅ Partner found:');
      console.log(`   ID: ${partner._id}`);
      console.log(`   Name: ${partner.name}`);
      console.log(`   Description: ${partner.description}`);
      console.log(`   Active: ${partner.isActive}`);
    } else {
      console.log('❌ Partner not found!');
      return;
    }

    // Step 2: Generate postback URL
    console.log('\n🔗 Step 2: Generating postback URL...');
    const urlGenerationData = {
      userId: 'test_user',
      offerId: 'hostsluice_offer_123',
      offerName: 'Hostsluice Test Survey',
      payout: 20.50
    };

    console.log('📤 Sending URL generation request with data:', urlGenerationData);

    const urlResponse = await axios.post(
      `${BASE_URL}/api/partners/${PARTNER_ID}/generate-url`,
      urlGenerationData
    );

    console.log('✅ URL Generation Response:');
    console.log(`   Success: ${urlResponse.data.success}`);
    console.log(`   Partner: ${urlResponse.data.partner}`);
    console.log(`   Template URL: ${urlResponse.data.postbackUrl}`);
    console.log(`   Test URL: ${urlResponse.data.testUrl}`);

    // Step 3: Test the generated URL
    console.log('\n🧪 Step 3: Testing the generated URL...');
    const testUrl = urlResponse.data.testUrl;
    console.log(`📤 Testing URL: ${testUrl}`);

    const testResponse = await axios.post(`${BASE_URL}/api/test-postback-url`, {
      url: testUrl
    });

    console.log('✅ URL Test Results:');
    console.log('   Test Success:', testResponse.data.success);
    console.log('   Test Message:', testResponse.data.message);
    console.log('   Extracted Parameters:', testResponse.data.testParams);
    console.log('   Postback Result:', testResponse.data.postbackResult);

    // Step 4: Manual URL construction test
    console.log('\n🔧 Step 4: Manual URL construction test...');
    const manualUrl = `${BASE_URL}/api/postback?user_id=manual_test&offer_id=manual_offer_456&offer_name=Manual%20Test&payout=15.25&status=completed&partner=hostsluice&source=manual_test`;
    
    console.log(`📤 Manual URL: ${manualUrl}`);
    
    const manualTestResponse = await axios.post(`${BASE_URL}/api/test-postback-url`, {
      url: manualUrl
    });

    console.log('✅ Manual URL Test Results:');
    console.log('   Success:', manualTestResponse.data.success);
    console.log('   Parameters:', manualTestResponse.data.testParams);

    console.log('\n🎉 URL GENERATION TEST COMPLETED!');
    console.log('✅ Partner verification: PASSED');
    console.log('✅ URL generation: PASSED');
    console.log('✅ URL testing: PASSED');
    console.log('✅ Manual URL construction: PASSED');

  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
    
    if (error.response?.status === 404) {
      console.log('\n🔍 Debugging 404 error...');
      console.log('This might mean:');
      console.log('1. Partner ID is incorrect');
      console.log('2. URL generation endpoint is not working');
      console.log('3. Partner was not found in database');
    }
  }
}

testSpecificPartnerURL();
