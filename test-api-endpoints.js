// Test all API endpoints to verify data flow
const API_URL = 'https://gameproback.onrender.com';

async function testAllEndpoints() {
  console.log('🔍 Testing API Endpoints...\n');

  // Test 1: MongoDB Stats
  try {
    console.log('1️⃣ Testing MongoDB Stats...');
    const response = await fetch(`${API_URL}/api/mongodb-stats`);
    const data = await response.json();
    console.log('✅ MongoDB Stats:', data);
  } catch (error) {
    console.log('❌ MongoDB Stats Error:', error.message);
  }

  // Test 2: Partners
  try {
    console.log('\n2️⃣ Testing Partners...');
    const response = await fetch(`${API_URL}/api/partners`);
    const data = await response.json();
    console.log('✅ Partners:', data.length, 'partners found');
    console.log('Partners data:', data);
  } catch (error) {
    console.log('❌ Partners Error:', error.message);
  }

  // Test 3: Postback Logs
  try {
    console.log('\n3️⃣ Testing Postback Logs...');
    const response = await fetch(`${API_URL}/api/received-postbacks`);
    const data = await response.json();
    console.log('✅ Postback Logs:', data.length, 'postbacks found');
    if (data.length > 0) {
      console.log('Latest postback:', data[0]);
    }
  } catch (error) {
    console.log('❌ Postback Logs Error:', error.message);
  }

  // Test 4: Leaderboard
  try {
    console.log('\n4️⃣ Testing Leaderboard...');
    const response = await fetch(`${API_URL}/api/leaderboard`);
    const data = await response.json();
    console.log('✅ Leaderboard:', data);
    if (data.leaderboard && data.leaderboard.length > 0) {
      console.log('Users in leaderboard:', data.leaderboard.length);
      console.log('Top user:', data.leaderboard[0]);
    }
    if (data.topUsers && data.topUsers.length > 0) {
      console.log('Top users:', data.topUsers.length);
      console.log('First top user:', data.topUsers[0]);
    }
  } catch (error) {
    console.log('❌ Leaderboard Error:', error.message);
  }

  // Test 5: Send a test postback
  try {
    console.log('\n5️⃣ Sending Test Postback...');
    const testData = {
      name: "TestUser_" + Date.now(),
      profile: "https://ui-avatars.io/api/?name=TestUser&background=4CAF50",
      platform: "TestPlatform",
      points: "150"
    };

    const response = await fetch(`${API_URL}/api/receive-postback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    console.log('✅ Test Postback Result:', result);

    // Wait 2 seconds then check leaderboard again
    console.log('\n⏳ Waiting 2 seconds then checking leaderboard...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    const leaderboardResponse = await fetch(`${API_URL}/api/leaderboard`);
    const leaderboardData = await leaderboardResponse.json();
    console.log('✅ Updated Leaderboard:', leaderboardData);

  } catch (error) {
    console.log('❌ Test Postback Error:', error.message);
  }
}

// Run the test
testAllEndpoints();
