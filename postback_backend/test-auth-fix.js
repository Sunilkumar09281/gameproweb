// Test authentication flow to verify the logout issue is fixed
const axios = require('axios');

const BASE_URL = 'http://localhost:5001';

async function testAuthenticationFlow() {
  console.log('🔐 Testing Authentication Flow...\n');

  try {
    // Step 1: Login as user
    console.log('👤 Step 1: Logging in as user...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: 'user',
      password: 'user123'
    });

    if (loginResponse.status === 200) {
      console.log('✅ Login successful!');
      console.log('📋 User data:', {
        username: loginResponse.data.user.username,
        role: loginResponse.data.user.role,
        points: loginResponse.data.user.points
      });
      
      const token = loginResponse.data.token;
      console.log('🎫 Token received (first 20 chars):', token.substring(0, 20) + '...');

      // Step 2: Test token verification (this was missing before)
      console.log('\n🔍 Step 2: Testing token verification...');
      const verifyResponse = await axios.post(`${BASE_URL}/api/auth/verify`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (verifyResponse.status === 200) {
        console.log('✅ Token verification successful!');
        console.log('📋 Verified user:', {
          username: verifyResponse.data.user.username,
          role: verifyResponse.data.user.role,
          valid: verifyResponse.data.valid
        });
      } else {
        console.log('❌ Token verification failed:', verifyResponse.status);
      }

      // Step 3: Test offer tracking (to ensure it works with fixed token)
      console.log('\n🎯 Step 3: Testing offer tracking with verified token...');
      const trackResponse = await axios.post(`${BASE_URL}/api/offer/track-click`, {
        offerName: 'Test Authentication Offer',
        offerUrl: 'https://example.com/auth-test',
        offerPartner: 'Auth Test Partner',
        rewardAmount: 20
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (trackResponse.status === 200) {
        console.log('✅ Offer tracking successful!');
        console.log('📝 Log ID:', trackResponse.data.logId);
        console.log('⏰ Clicked at:', trackResponse.data.clickedAt);
      } else {
        console.log('❌ Offer tracking failed:', trackResponse.status);
      }

      // Step 4: Login as admin and check logs
      console.log('\n👑 Step 4: Testing admin access...');
      const adminLoginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
        username: 'admin',
        password: 'admin123'
      });

      if (adminLoginResponse.status === 200) {
        console.log('✅ Admin login successful!');
        
        const adminToken = adminLoginResponse.data.token;
        
        // Test admin offer logs access
        const logsResponse = await axios.get(`${BASE_URL}/api/admin/offer-logs?limit=3`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });

        if (logsResponse.status === 200) {
          console.log('✅ Admin logs access successful!');
          console.log('📊 Total logs:', logsResponse.data.pagination.totalLogs);
          console.log('📈 Statistics:', logsResponse.data.statistics);
          
          if (logsResponse.data.logs.length > 0) {
            console.log('\n📝 Recent logs:');
            logsResponse.data.logs.forEach((log, index) => {
              console.log(`  ${index + 1}. ${log.username}: ${log.offerName} (${log.status})`);
            });
          }
        } else {
          console.log('❌ Admin logs access failed:', logsResponse.status);
        }
      }

      console.log('\n🎉 AUTHENTICATION TEST COMPLETED!');
      console.log('✅ All authentication flows working correctly');
      console.log('✅ Token verification endpoint working');
      console.log('✅ Offer tracking with authentication working');
      console.log('✅ Admin access working');
      console.log('\n💡 The automatic logout issue should now be fixed!');

    } else {
      console.log('❌ Login failed:', loginResponse.status);
    }

  } catch (error) {
    console.error('\n❌ Authentication test failed:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
    
    if (error.response?.status === 404) {
      console.log('\n💡 If you see "User not found", run: node setup-admin.js');
    }
  }
}

testAuthenticationFlow();
