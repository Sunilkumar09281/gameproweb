// Test the new games and surveys endpoints
const axios = require('axios');

const BASE_URL = 'http://localhost:5001';

async function testOffersAndSurveys() {
  console.log('🎮 Testing Offers and Surveys Endpoints...\n');

  try {
    // Test games/offers endpoint
    console.log('🎯 Step 1: Testing /api/games endpoint...');
    const gamesResponse = await axios.get(`${BASE_URL}/api/games`);
    
    if (gamesResponse.status === 200) {
      console.log('✅ Games endpoint working!');
      console.log('📋 Games found:', gamesResponse.data.length);
      console.log('🎮 Sample games:');
      gamesResponse.data.slice(0, 3).forEach((game, index) => {
        console.log(`  ${index + 1}. ${game.title} - $${game.reward} (${game.partner})`);
      });
    }

    // Test surveys endpoint
    console.log('\n📊 Step 2: Testing /api/surveys/active endpoint...');
    const surveysResponse = await axios.get(`${BASE_URL}/api/surveys/active`);
    
    if (surveysResponse.status === 200) {
      console.log('✅ Surveys endpoint working!');
      console.log('📋 Surveys found:', surveysResponse.data.length);
      console.log('📊 Sample surveys:');
      surveysResponse.data.forEach((survey, index) => {
        console.log(`  ${index + 1}. ${survey.title} - $${survey.reward} (${survey.estimatedTime}min)`);
      });
    }

    console.log('\n🎉 SUCCESS! Both endpoints are working correctly!');
    console.log('✅ Offer cards should now load properly');
    console.log('✅ Surveys should now load without errors');
    console.log('\n💡 Try refreshing your frontend - the offers and surveys should appear!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
  }
}

testOffersAndSurveys();
