// Simple test for pump service functionality
// Run using: cd apps/api && npx tsx test-pump-simple.ts

import { PrismaClient } from '@prisma/client';

async function testDatabaseConnection() {
  console.log('🔌 Testing database connection...');

  const prisma = new PrismaClient();

  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Test Device model
    console.log('📱 Testing Device model...');
    const testDevice = await prisma.device.create({
      data: {
        name: 'Test ESP32',
        greenhouseId: 'test-greenhouse-1',
        ipAddress: '192.168.1.100',
        macAddress: '24:0A:C4:12:34:56',
        firmwareVersion: '1.0.0',
        isOnline: true,
      },
    });
    console.log('✅ Device created:', testDevice.id);

    // Test PumpOperation model
    console.log('💧 Testing PumpOperation model...');
    const testOperation = await prisma.pumpOperation.create({
      data: {
        greenhouseId: 'test-greenhouse-1',
        duration: 30,
        reason: 'Test operation',
        status: 'active',
      },
    });
    console.log('✅ Pump operation created:', testOperation.id);
    // Update operation status
    const updatedOperation = await prisma.pumpOperation.update({
      where: { id: testOperation.id },
      data: {
        status: 'completed',
        endedAt: new Date(),
      },
    });
    console.log('✅ Pump operation updated:', updatedOperation.status);

    // Get operations history
    const history = await prisma.pumpOperation.findMany({
      where: { greenhouseId: 'test-greenhouse-1' },
      orderBy: { createdAt: 'desc' },
    });
    console.log('✅ History retrieved:', history.length, 'operations');

    // Cleanup
    await prisma.pumpOperation.deleteMany({
      where: { greenhouseId: 'test-greenhouse-1' },
    });
    await prisma.device.deleteMany({
      where: { greenhouseId: 'test-greenhouse-1' },
    });
    console.log('🧹 Cleanup completed');

    console.log('🎉 All database tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testDatabaseConnection()
  .then(() => {
    console.log('Database test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Database test failed:', error);
    process.exit(1);
  });
