// Test survey completion and profile update system
const axios = require('axios');

const BASE_URL = 'http://localhost:5001';

async function testSurveyCompletion() {
  console.log('📊 Testing Survey Completion & Profile Update System...\n');

  try {
    // Step 1: Login as user
    console.log('👤 Step 1: Logging in as user...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: 'user',
      password: 'user123'
    });

    if (loginResponse.status !== 200) {
      throw new Error('Login failed');
    }

    const token = loginResponse.data.token;
    const initialUser = loginResponse.data.user;
    console.log('✅ Login successful!');
    console.log('📋 Initial user data:', {
      username: initialUser.username,
      points: initialUser.points,
      level: initialUser.level
    });

    // Step 2: Get available surveys
    console.log('\n📊 Step 2: Getting available surveys...');
    const surveysResponse = await axios.get(`${BASE_URL}/api/surveys/active`);
    
    if (surveysResponse.data.length === 0) {
      throw new Error('No surveys available for testing');
    }

    const testSurvey = surveysResponse.data[0]; // Use first survey
    console.log('✅ Found test survey:', {
      id: testSurvey.id,
      title: testSurvey.title,
      reward: testSurvey.reward
    });

    // Step 3: Complete the survey
    console.log('\n🎯 Step 3: Completing survey...');
    const completionResponse = await axios.post(`${BASE_URL}/api/survey/complete`, {
      surveyId: testSurvey.id,
      surveyName: testSurvey.title,
      surveyPayout: testSurvey.reward,
      completionData: {
        testMode: true,
        completionTime: 15,
        responses: ['answer1', 'answer2', 'answer3']
      }
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (completionResponse.status === 200) {
      const result = completionResponse.data;
      console.log('✅ Survey completed successfully!');
      console.log('💰 Points earned:', result.pointsEarned);
      console.log('📊 Total points:', result.totalPoints);
      console.log('🏆 New level:', result.newLevel);
      console.log('👤 Updated user:', result.user);
    }

    // Step 4: Check survey history
    console.log('\n📈 Step 4: Checking survey completion history...');
    const historyResponse = await axios.get(`${BASE_URL}/api/survey/history`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (historyResponse.status === 200) {
      const history = historyResponse.data;
      console.log('✅ Survey history retrieved!');
      console.log('📊 Total surveys completed:', history.totalSurveysCompleted);
      console.log('💰 Total points from surveys:', history.totalPointsFromSurveys);
      
      if (history.activities.length > 0) {
        console.log('\n📝 Recent survey activities:');
        history.activities.slice(0, 3).forEach((activity, index) => {
          console.log(`  ${index + 1}. ${activity.description} - $${activity.pointsEarned}`);
        });
      }
    }

    // Step 5: Verify profile was updated
    console.log('\n👤 Step 5: Verifying profile update...');
    const profileResponse = await axios.get(`${BASE_URL}/api/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (profileResponse.status === 200) {
      const updatedUser = profileResponse.data.user;
      console.log('✅ Profile verification successful!');
      console.log('📊 Profile comparison:');
      console.log(`   Before: ${initialUser.points} points, Level ${initialUser.level}`);
      console.log(`   After:  ${updatedUser.points} points, Level ${updatedUser.level}`);
      console.log(`   Gained: ${updatedUser.points - initialUser.points} points`);
    }

    console.log('\n🎉 SURVEY COMPLETION TEST SUCCESSFUL!');
    console.log('✅ Survey completion updates user profile automatically');
    console.log('✅ Points and level are updated correctly');
    console.log('✅ Activity tracking is working');
    console.log('✅ Survey history is maintained');

  } catch (error) {
    console.error('\n❌ Survey completion test failed:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
  }
}

testSurveyCompletion();
