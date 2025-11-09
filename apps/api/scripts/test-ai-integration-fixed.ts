import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

async function testAIIntegration() {
  console.log('🧪 Testing AI Integration Flow\n');

  const API_URL = 'http://localhost:5000';
  const userPlantId = '87c6b27b-60dd-4659-960c-0c44982cd706';

  try {
    // Step 1: Send sensor data
    console.log('📤 Step 1: Sending sensor data...');
    const sensorData = {
      userPlant: userPlantId,
      air_temperature: 26.5,
      air_humidity: 62.0,
      soil_moisture: 45,
      soil_temperature: 24.0,
      light_intensity: 850,
      water_level: true,
      water_reserve: 80,
    };

    const sendResponse = await axios.post(`${API_URL}/sensor`, sensorData);
    console.log('✅ Sensor data sent:', sendResponse.data.id);

    const sensorReadingId = sendResponse.data.id;

    // Step 2: Wait for AI processing
    console.log('\n⏳ Step 2: Waiting 5 seconds for AI processing...');
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Step 3: Check if plantHealthScore was updated
    console.log('\n🔍 Step 3: Checking database for AI update...');
    const updatedReading = await prisma.greenhouseSensorReading.findUnique({
      where: { id: sensorReadingId },
      select: {
        id: true,
        plantHealthScore: true,
        airTemperature: true,
        airHumidity: true,
        soilMoisture: true,
        timestamp: true,
      },
    });

    if (!updatedReading) {
      console.error('❌ Reading not found in database!');
      return;
    }

    console.log('\n📊 Updated Reading:');
    console.log(JSON.stringify(updatedReading, null, 2));

    if (updatedReading.plantHealthScore !== null) {
      console.log('\n✅ SUCCESS: AI integration working!');
      console.log(`   Plant Health Score: ${updatedReading.plantHealthScore}`);
    } else {
      console.log('\n⚠️  WARNING: plantHealthScore is still null');
      console.log('   Possible reasons:');
      console.log('   1. AI service not running (check port 5001)');
      console.log('   2. AI service timeout');
      console.log('   3. Check NestJS logs for errors');
    }

    // Step 4: Check for notifications
    console.log('\n🔔 Step 4: Checking for notifications...');
    const notifications = await prisma.notification.findMany({
      where: {
        userId: 'fd6df50a-2f51-4057-89db-04001e170394',
        createdAt: {
          gte: new Date(Date.now() - 60000), // Last minute
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });

    if (notifications.length > 0) {
      console.log(`✅ Found ${notifications.length} notification(s):`);
      notifications.forEach((notif, idx) => {
        console.log(`\n   [${idx + 1}] ${notif.title}`);
        console.log(`       ${notif.message}`);
        console.log(`       Type: ${notif.type}, Read: ${notif.isRead}`);
      });
    } else {
      console.log(
        'ℹ️  No notifications created (health status might be normal)',
      );
    }
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNREFUSED') {
        console.error('❌ ERROR: Cannot connect to NestJS API at', API_URL);
        console.error('   Make sure NestJS is running: npm run dev');
      } else if (error.response) {
        console.error(
          '❌ API Error:',
          error.response.status,
          error.response.data,
        );
      } else {
        console.error('❌ Request Error:', error.message);
      }
    } else if (error instanceof Error) {
      console.error('❌ Error:', error.message);
    } else {
      console.error('❌ Unknown error:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

testAIIntegration();
