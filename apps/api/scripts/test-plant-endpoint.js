const axios = require('axios');

const API_BASE = 'http://localhost:5000';

async function testPlantEndpoint() {
  console.log('🧪 Testing Plant Endpoint\n');

  try {
    // Step 1: Login
    console.log('1️⃣ Logging in...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@greenhouse.local',
      password: 'Test@123',
    });

    const token = loginResponse.data.accessToken || loginResponse.data.access_token;
    console.log('✅ Login successful! Token:', token ? token.substring(0, 20) + '...' : 'NO TOKEN');

    // Step 2: Get user plants
    console.log('2️⃣ Fetching user plants...');
    const plantsResponse = await axios.get(`${API_BASE}/plant/userplant`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log('✅ Plants fetched successfully!');
    console.log('📊 Number of plants:', plantsResponse.data.length);
    console.log('\n🌱 Plants data:');
    console.log(JSON.stringify(plantsResponse.data, null, 2));

    if (plantsResponse.data.length === 0) {
      console.log('\n⚠️  WARNING: No plants found for this user!');
      console.log('The seed might not have run correctly or the userId might be different.');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.error('Authentication failed. Check credentials or token.');
    }
  }
}

testPlantEndpoint();
