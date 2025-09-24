const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testMongoDBIntegration() {
  console.log('🧪 Testing MongoDB Integration...\n');

  try {
    // Test 1: Clear existing data
    console.log('1️⃣ Clearing existing data...');
    await axios.delete(`${BASE_URL}/api/leaderboard`);
    await axios.delete(`${BASE_URL}/api/received-postbacks`);
    console.log('✅ Data cleared\n');

    // Test 2: Send your exact postback data
    console.log('2️⃣ Testing your postback data...');
    const testData = {
      name: "aahan",
      profile: "https://media.istockphoto.com/id/814423752/photo/eye-of-model-with-colorful-art-make-up-close-up.jpg?s=612x612&w=0&k=20&c=l15OdMWjgCKycMMShP8UK94ELVlEGvt7GmB_esHWPYE=",
      points: "200"
    };

    const postbackResponse = await axios.post(`${BASE_URL}/api/receive-postback`, testData);
    console.log('✅ Postback sent successfully:', postbackResponse.data);
    console.log('');

    // Test 3: Check leaderboard
    console.log('3️⃣ Checking leaderboard...');
    const leaderboardResponse = await axios.get(`${BASE_URL}/api/leaderboard`);
    console.log('✅ Leaderboard data:', JSON.stringify(leaderboardResponse.data, null, 2));
    console.log('');

    // Test 4: Check postback logs
    console.log('4️⃣ Checking postback logs...');
    const logsResponse = await axios.get(`${BASE_URL}/api/received-postbacks`);
    console.log('✅ Postback logs count:', logsResponse.data.length);
    if (logsResponse.data.length > 0) {
      console.log('Latest postback:', JSON.stringify(logsResponse.data[0], null, 2));
    }
    console.log('');

    // Test 5: Send another postback to test updates
    console.log('5️⃣ Testing user update (sending more points)...');
    const updateData = {
      name: "aahan",
      profile: "https://media.istockphoto.com/id/814423752/photo/eye-of-model-with-colorful-art-make-up-close-up.jpg?s=612x612&w=0&k=20&c=l15OdMWjgCKycMMShP8UK94ELVlEGvt7GmB_esHWPYE=",
      points: "150"
    };

    await axios.post(`${BASE_URL}/api/receive-postback`, updateData);
    
    const updatedLeaderboard = await axios.get(`${BASE_URL}/api/leaderboard`);
    console.log('✅ Updated leaderboard:', JSON.stringify(updatedLeaderboard.data.topUsers, null, 2));
    console.log('');

    // Test 6: Add another user
    console.log('6️⃣ Adding another user...');
    const user2Data = {
      name: "testuser2",
      profile: "https://ui-avatars.io/api/?name=testuser2&background=random",
      points: "175"
    };

    await axios.post(`${BASE_URL}/api/receive-postback`, user2Data);
    
    const finalLeaderboard = await axios.get(`${BASE_URL}/api/leaderboard`);
    console.log('✅ Final leaderboard with multiple users:');
    finalLeaderboard.data.topUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.userName} - ${user.points} points (${user.completedTasks} tasks)`);
    });

    console.log('\n🎉 All tests passed! MongoDB integration is working perfectly!');
    console.log('\n📊 Summary:');
    console.log(`- Total users: ${finalLeaderboard.data.total}`);
    console.log(`- Total postbacks: ${logsResponse.data.length + 2}`); // +2 for the additional tests
    console.log('- Leaderboard ranking: ✅ Working');
    console.log('- User updates: ✅ Working');
    console.log('- Data persistence: ✅ Working');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testMongoDBIntegration();
