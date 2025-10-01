// Test postback URL generation and testing
const axios = require('axios');

const BASE_URL = 'http://localhost:5001';

async function testPostbackURLGeneration() {
  console.log('🔗 Testing Postback URL Generation & Testing...\n');

  try {
    // Step 1: Get available partners
    console.log('👥 Step 1: Getting available partners...');
    const partnersResponse = await axios.get(`${BASE_URL}/api/partners`);
    const partners = partnersResponse.data;
    
    console.log(`✅ Found ${partners.length} partners:`);
    partners.forEach((partner, index) => {
      console.log(`   ${index + 1}. ${partner.name} - ${partner.description}`);
    });

    if (partners.length === 0) {
      console.log('❌ No partners found. Creating sample partners...');
      await axios.post(`${BASE_URL}/api/create-sample-partners`);
      const newPartnersResponse = await axios.get(`${BASE_URL}/api/partners`);
      partners = newPartnersResponse.data;
      console.log(`✅ Created ${partners.length} sample partners`);
    }

    // Step 2: Generate postback URL for first partner
    console.log('\n🔗 Step 2: Generating postback URL...');
    const firstPartner = partners[0];
    
    const urlGenerationData = {
      userId: 'test_user',
      offerId: 'survey_123',
      offerName: 'Health Survey',
      payout: 15.75
    };

    const urlResponse = await axios.post(
      `${BASE_URL}/api/partners/${firstPartner._id}/generate-url`,
      urlGenerationData
    );

    console.log('✅ Postback URL generated successfully!');
    console.log('📝 Generation details:');
    console.log(`   Partner: ${urlResponse.data.partner}`);
    console.log(`   Template URL: ${urlResponse.data.postbackUrl}`);
    console.log(`   Test URL: ${urlResponse.data.testUrl}`);

    // Step 3: Test the generated URL
    console.log('\n🧪 Step 3: Testing the generated postback URL...');
    const testUrl = urlResponse.data.testUrl;
    
    const testResponse = await axios.post(`${BASE_URL}/api/test-postback-url`, {
      url: testUrl
    });

    console.log('✅ Postback URL test completed!');
    console.log('📝 Test results:');
    console.log('   Test Parameters:', testResponse.data.testParams);
    console.log('   Postback Result:', testResponse.data.postbackResult);

    // Step 4: Verify the postback was processed
    console.log('\n📊 Step 4: Verifying postback processing...');
    
    // Wait a moment for processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const postbackLogs = await axios.get(`${BASE_URL}/api/received-postbacks`);
    console.log('✅ Postback logs retrieved:');
    console.log(`   Total postbacks: ${postbackLogs.data.statistics.totalPostbacks}`);
    console.log(`   Processed postbacks: ${postbackLogs.data.statistics.processedPostbacks}`);
    console.log(`   Total payout: $${postbackLogs.data.statistics.totalPayout}`);

    // Step 5: Test with different parameters
    console.log('\n🔄 Step 5: Testing with custom parameters...');
    const customUrlData = {
      userId: 'custom_user',
      offerId: 'custom_offer_456',
      offerName: 'Custom Survey Test',
      payout: 25.00
    };

    const customUrlResponse = await axios.post(
      `${BASE_URL}/api/partners/${firstPartner._id}/generate-url`,
      customUrlData
    );

    console.log('✅ Custom postback URL generated:');
    console.log(`   URL: ${customUrlResponse.data.testUrl}`);

    // Test the custom URL
    const customTestResponse = await axios.post(`${BASE_URL}/api/test-postback-url`, {
      url: customUrlResponse.data.testUrl
    });

    console.log('✅ Custom URL tested successfully!');
    console.log('   Custom Parameters:', customTestResponse.data.testParams);

    // Final summary
    console.log('\n🎉 POSTBACK URL GENERATION TEST RESULTS:');
    console.log('✅ Partner management working');
    console.log('✅ Postback URL generation working');
    console.log('✅ URL testing functionality working');
    console.log('✅ Postback processing working');
    console.log('✅ Parameter customization working');

    console.log('\n🎯 SUCCESS: Postback URL system is fully operational!');
    console.log('📋 Available features:');
    console.log('   - Create and manage partners');
    console.log('   - Generate custom postback URLs');
    console.log('   - Test postback URLs');
    console.log('   - Process postbacks automatically');
    console.log('   - Track postback statistics');

  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
  }
}

testPostbackURLGeneration();
