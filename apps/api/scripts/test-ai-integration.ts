/**
 * Script to test AI integration with sensor data
 * Simulates ESP32 sending sensor data to NestJS API
 * which then calls Flask AI service for analysis
 */

import axios from 'axios';

const API_URL = 'http://localhost:5000';
const GREENHOUSE_ID = '78ec5ac3-8f1e-4fdd-8ff9-346e6d31a882';

// Find userPlant ID from database first
async function getUserPlantId(): Promise<string> {
  try {
    // This would need to be queried from database
    // For now, using a placeholder
    return 'find-this-from-database';
  } catch (error) {
    console.error('Error getting userPlant ID:', error);
    throw error;
  }
}

async function sendSensorData() {
  console.log('\n🧪 TESTING AI INTEGRATION');
  console.log('='.repeat(60));

  try {
    // 1. Send sensor data to NestJS
    const sensorData = {
      userPlant: 'your-user-plant-id-here', // This needs to be updated
      air_temperature: 26.5,
      air_humidity: 62.0,
      soil_moisture: 45,
      soil_temperature: 24.0,
    };

    console.log('\n📤 Step 1: Sending sensor data to NestJS API...');
    console.log('Data:', JSON.stringify(sensorData, null, 2));

    const response = await axios.post(`${API_URL}/sensor`, sensorData, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000,
    });

    console.log('✅ Sensor data saved:', response.data);

    // 2. Wait a bit for AI processing
    console.log('\n⏳ Waiting 5 seconds for AI processing...');
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // 3. Check if AI analysis was saved
    console.log('\n🔍 Step 2: Checking if AI analysis was saved...');

    const checkResponse = await axios.get(`${API_URL}/sensor`, {
      timeout: 5000,
    });

    const latestReading = checkResponse.data.data[0];

    if (latestReading.plantHealthScore !== null) {
      console.log('✅ AI Analysis Found:');
      console.log(`   Health Score: ${latestReading.plantHealthScore}`);
      console.log(`   Timestamp: ${latestReading.timestamp}`);
    } else {
      console.log('⚠️  No AI analysis found yet (plantHealthScore is null)');
      console.log('   Check NestJS logs for AI service errors');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Test completed!');
    console.log('\nNext steps:');
    console.log('1. Check NestJS logs: look for "🤖 Calling AI service..."');
    console.log('2. Check Flask logs: should show /analyze-sensors request');
    console.log('3. If no AI call, check AI_SERVICE_URL in .env');
    console.log('4. If AI fails, check Flask is running on port 5001\n');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);

    if (error.code === 'ECONNREFUSED') {
      console.error('   → NestJS API not running on port 5000');
      console.error('   → Start with: npm run dev');
    } else if (error.response) {
      console.error('   → API Error:', error.response.data);
    }
  }
}

// Run test
sendSensorData().catch(console.error);
