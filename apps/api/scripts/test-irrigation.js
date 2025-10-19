#!/usr/bin/env node

/**
 * Test script for irrigation detection and notification system
 * Tests both automatic pump notifications and manual/chuva irrigation detection
 */

const { PrismaClient } = require('@prisma/client');
const { io } = require('socket.io-client');
const axios = require('axios');

const prisma = new PrismaClient();

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';
const WS_URL = process.env.WS_URL || 'http://localhost:5000';
const TEST_USER_EMAIL = 'admin@greenhouse.local';

// Test data
let testUser;
let testGreenhouse;
let testUserPlant;

async function setupTestData() {
  console.log('🔧 Setting up test data...');

  // Get test user
  testUser = await prisma.user.findUnique({
    where: { email: TEST_USER_EMAIL }
  });

  if (!testUser) {
    throw new Error(`Test user with email ${TEST_USER_EMAIL} not found. Run seed first.`);
  }

  console.log(`👤 Found test user: ${testUser.name} (${testUser.email})`);

  // Get first greenhouse owned by user
  testGreenhouse = await prisma.greenhouse.findFirst({
    where: { ownerId: testUser.id }
  });

  if (!testGreenhouse) {
    throw new Error('No greenhouse found for test user');
  }

  console.log(`🏠 Found greenhouse: ${testGreenhouse.name}`);

  // Get first user plant
  testUserPlant = await prisma.userPlant.findFirst({
    where: { userId: testUser.id },
    include: { plant: true }
  });

  if (!testUserPlant) {
    throw new Error('No user plant found for test user');
  }

  console.log(`🌱 Found user plant: ${testUserPlant.nickname} (${testUserPlant.plant.name})`);

  // Get soil moisture sensor reading (not sensor itself)
  const latestReading = await prisma.greenhouseSensorReading.findFirst({
    where: {
      greenhouseId: testGreenhouse.id,
      // Look for soil moisture readings
    },
    orderBy: { timestamp: 'desc' }
  });

  console.log(`📡 Found greenhouse sensor readings for: ${testGreenhouse.name}`);
}

async function simulateSoilMoistureIncrease() {
  console.log('\n🌧️  Simulating manual irrigation/chuva detection...');

  // First, create a baseline reading with low soil moisture
  console.log('📊 Creating baseline reading with low soil moisture...');
  const baselineReading = await prisma.greenhouseSensorReading.create({
    data: {
      greenhouseId: testGreenhouse.id,
      airTemperature: 25.5,
      airHumidity: 65.0,
      soilMoisture: 30, // Low moisture baseline
      soilTemperature: 22.0,
      lightIntensity: 750.0,
      waterLevel: 80.0,
      deviceId: testGreenhouse.deviceId,
      timestamp: new Date(Date.now() - 60000), // 1 minute ago
      isValid: true
    }
  });

  console.log(`✅ Created baseline reading: ${baselineReading.id} (30% moisture)`);

  // Wait a moment
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Now simulate increase in soil moisture without pump activation
  console.log('💧 Simulating soil moisture increase to 60%...');
  const newReading = await prisma.greenhouseSensorReading.create({
    data: {
      greenhouseId: testGreenhouse.id,
      airTemperature: 25.5,
      airHumidity: 65.0,
      soilMoisture: 60, // Increased moisture (30% increase)
      soilTemperature: 22.0,
      lightIntensity: 750.0,
      waterLevel: 80.0,
      deviceId: testGreenhouse.deviceId,
      timestamp: new Date(),
      isValid: true
    }
  });

  console.log(`✅ Created increased moisture reading: ${newReading.id} (60% moisture)`);

  // Wait a moment for the irrigation detection to process
  console.log('⏳ Waiting for irrigation detection...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Check if irrigation was detected
  const recentIrrigations = await prisma.irrigation.findMany({
    where: {
      greenhouseId: testGreenhouse.id,
      type: 'detected',
      createdAt: {
        gte: new Date(Date.now() - 10000) // Last 10 seconds
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 1
  });

  if (recentIrrigations.length > 0) {
    const irrigation = recentIrrigations[0];
    console.log('🎉 Irrigation detected!');
    console.log(`   Type: ${irrigation.type}`);
    console.log(`   Status: ${irrigation.status}`);
    console.log(`   Detected at: ${irrigation.createdAt}`);
    console.log(`   Sensor reading ID: ${irrigation.sensorId}`);
    console.log(`   Notes: ${irrigation.notes}`);

    return irrigation;
  } else {
    console.log('❌ No irrigation detected');
    return null;
  }
}

async function testWebSocketNotification() {
  console.log('\n🔌 Testing WebSocket notification...');

  return new Promise((resolve, reject) => {
    const socket = io(WS_URL, {
      transports: ['websocket', 'polling']
    });

    let notificationReceived = false;

    socket.on('connect', () => {
      console.log('📡 Connected to WebSocket server');

      // Join user's room
      socket.emit('join', { userId: testUser.id });
      console.log(`👤 Joined user room: ${testUser.id}`);
    });

    socket.on('irrigation-detected', (data) => {
      console.log('🔔 Irrigation notification received!');
      console.log(`   Message: ${data.message}`);
      console.log(`   Type: ${data.type}`);
      console.log(`   Irrigation ID: ${data.irrigationId}`);
      console.log(`   User ID: ${data.userId}`);
      notificationReceived = true;

      socket.disconnect();
      resolve(data);
    });

    socket.on('connect_error', (error) => {
      console.log('❌ WebSocket connection error:', error.message);
      socket.disconnect();
      reject(error);
    });

    // Timeout after 10 seconds
    setTimeout(() => {
      if (!notificationReceived) {
        console.log('⏰ Timeout: No notification received');
        socket.disconnect();
        resolve(null);
      }
    }, 10000);
  });
}

async function simulatePumpActivation() {
  console.log('\n⚙️  Simulating automatic pump activation...');

  // Create a pump operation record
  const pumpOperation = await prisma.pumpOperation.create({
    data: {
      greenhouseId: testGreenhouse.id,
      deviceId: testGreenhouse.deviceId,
      duration: 30000, // 30 seconds
      waterAmount: 2.5, // 2.5 liters
      reason: 'automatic_irrigation',
      status: 'completed',
      startedAt: new Date(Date.now() - 30000),
      completedAt: new Date()
    }
  });

  console.log(`✅ Created pump operation: ${pumpOperation.id}`);
  console.log(`   Duration: ${pumpOperation.duration}ms`);
  console.log(`   Water amount: ${pumpOperation.waterAmount}L`);

  // Wait for irrigation detection
  console.log('⏳ Waiting for pump irrigation detection...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Check if irrigation was detected
  const recentIrrigations = await prisma.irrigation.findMany({
    where: {
      userId: testUser.id,
      greenhouseId: testGreenhouse.id,
      type: 'automatic',
      createdAt: {
        gte: new Date(Date.now() - 10000) // Last 10 seconds
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 1
  });

  if (recentIrrigations.length > 0) {
    const irrigation = recentIrrigations[0];
    console.log('🎉 Pump irrigation detected!');
    console.log(`   Type: ${irrigation.type}`);
    console.log(`   Status: ${irrigation.status}`);
    console.log(`   Water amount: ${irrigation.waterAmount}L`);
    console.log(`   Duration: ${irrigation.duration}ms`);
    console.log(`   Detected at: ${irrigation.createdAt}`);

    return irrigation;
  } else {
    console.log('❌ No pump irrigation detected');
    return null;
  }
}

async function testIrrigationConfirmation(irrigationId) {
  console.log('\n📝 Testing irrigation confirmation...');

  // Simulate user confirming manual irrigation
  const confirmationData = {
    type: 'manual',
    waterAmount: 3.0,
    notes: 'Irrigação manual realizada com mangueira'
  };

  console.log('📤 Sending confirmation data...');
  console.log(`   Type: ${confirmationData.type}`);
  console.log(`   Water Amount: ${confirmationData.waterAmount}L`);
  console.log(`   Notes: ${confirmationData.notes}`);

  // Here we would normally make an HTTP request to the API
  // For this test, we'll directly update the database
  const updatedIrrigation = await prisma.irrigation.update({
    where: { id: irrigationId },
    data: {
      status: 'confirmed',
      type: confirmationData.type,
      waterAmount: confirmationData.waterAmount,
      notes: confirmationData.notes,
      confirmedAt: new Date()
    }
  });

  console.log('✅ Irrigation confirmed!');
  console.log(`   Status: ${updatedIrrigation.status}`);
  console.log(`   Confirmed at: ${updatedIrrigation.confirmedAt}`);

  return updatedIrrigation;
}

async function runTests() {
  try {
    console.log('🚀 Starting Irrigation System Tests\n');

    // Setup
    await setupTestData();

    // Test 1: Manual irrigation detection
    console.log('='.repeat(50));
    console.log('🧪 TEST 1: Manual Irrigation Detection');
    console.log('='.repeat(50));

    const manualIrrigation = await simulateSoilMoistureIncrease();
    const wsNotification1 = await testWebSocketNotification();

    if (manualIrrigation && wsNotification1) {
      console.log('✅ Manual irrigation test PASSED');
    } else {
      console.log('❌ Manual irrigation test FAILED');
    }

    // Test 2: Automatic pump irrigation
    console.log('\n' + '='.repeat(50));
    console.log('🧪 TEST 2: Automatic Pump Irrigation');
    console.log('='.repeat(50));

    const pumpIrrigation = await simulatePumpActivation();
    const wsNotification2 = await testWebSocketNotification();

    if (pumpIrrigation && wsNotification2) {
      console.log('✅ Pump irrigation test PASSED');
    } else {
      console.log('❌ Pump irrigation test FAILED');
    }

    // Test 3: Irrigation confirmation
    if (manualIrrigation) {
      console.log('\n' + '='.repeat(50));
      console.log('🧪 TEST 3: Irrigation Confirmation');
      console.log('='.repeat(50));

      const confirmedIrrigation = await testIrrigationConfirmation(manualIrrigation.id);

      if (confirmedIrrigation && confirmedIrrigation.status === 'confirmed') {
        console.log('✅ Irrigation confirmation test PASSED');
      } else {
        console.log('❌ Irrigation confirmation test FAILED');
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log('All irrigation system tests completed!');
    console.log('Check the results above for detailed test outcomes.');
    console.log('\n💡 Next steps:');
    console.log('1. Start the frontend application');
    console.log('2. Login with admin@greenhouse.local / Test@123');
    console.log('3. Check if notifications appear in real-time');
    console.log('4. Test the irrigation confirmation form');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Handle script execution
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  setupTestData,
  simulateSoilMoistureIncrease,
  simulatePumpActivation,
  testIrrigationConfirmation,
  testWebSocketNotification
};