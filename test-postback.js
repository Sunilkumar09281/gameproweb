// Simple test to send a postback to your deployed backend
const API_URL = 'https://gameproback.onrender.com';

async function testPostback() {
  try {
    console.log('🚀 Sending test postback to:', `${API_URL}/api/receive-postback`);
    
    const testData = {
      name: "aahan",
      profile: "https://media.istockphoto.com/id/814423752/photo/eye-of-model-with-colorful-art-make-up-close-up.jpg?s=612x612&w=0&k=20&c=l15OdMWjgCKycMMShP8UK94ELVlEGvt7GmB_esHWPYE=",
      platform: "TimeWall",
      points: "200"
    };

    const response = await fetch(`${API_URL}/api/receive-postback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    console.log('✅ Postback response:', result);

    // Test leaderboard endpoint
    console.log('📊 Testing leaderboard endpoint...');
    const leaderboardResponse = await fetch(`${API_URL}/api/leaderboard`);
    const leaderboardData = await leaderboardResponse.json();
    console.log('📋 Leaderboard data:', leaderboardData);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the test
testPostback();
