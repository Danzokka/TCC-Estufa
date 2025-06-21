// Test file to verify pump control API endpoints
// Run using: cd apps/api && npx tsx test-pump-api.ts

import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from './src/prisma.service';
import { PumpModule } from './src/pump/pump.module';
import { PumpService } from './src/pump/pump.service';
import { ActivatePumpDto } from './src/pump/dto/pump.dto';

async function testPumpService() {
  console.log('🧪 Testing Pump Service...');

  // Create test module
  const moduleRef = await Test.createTestingModule({
    imports: [PumpModule],
  }).compile();

  const app: INestApplication = moduleRef.createNestApplication();
  await app.init();
  const pumpService = app.get<PumpService>(PumpService);
  const prismaService = app.get<PrismaService>(PrismaService);

  console.log('Debug - PumpService:', !!pumpService);
  console.log('Debug - PrismaService:', !!prismaService);
  console.log('Debug - PumpService.prisma:', !!(pumpService as any).prisma);

  try {
    // Test 1: Register a test ESP32 device
    console.log('📱 Testing device registration...');
    const deviceData = {
      name: 'ESP32 Test Device',
      greenhouseId: 'test-greenhouse-1',
      ipAddress: '192.168.1.100',
      macAddress: '24:0A:C4:12:34:56',
      firmwareVersion: '1.0.0',
    };

    await pumpService.registerDevice(deviceData);
    console.log('✅ Device registered successfully');

    // Test 2: Activate pump
    console.log('💧 Testing pump activation...');
    const activationDto: ActivatePumpDto = {
      greenhouseId: 'test-greenhouse-1',
      duration: 30,
      reason: 'Test activation',
    };

    const operation = await pumpService.activatePump(activationDto);
    console.log('✅ Pump activated:', operation.id);

    // Test 3: Get pump status
    console.log('📊 Testing pump status...');
    const status = await pumpService.getPumpStatus('test-greenhouse-1');
    console.log('✅ Pump status:', status);

    // Test 4: Get pump history
    console.log('📜 Testing pump history...');
    const history = await pumpService.getPumpHistory('test-greenhouse-1');
    console.log('✅ Pump history:', history.length, 'operations');

    // Test 5: Stop pump
    console.log('⏹️ Testing pump stop...');
    const stopResult = await pumpService.stopPump('test-greenhouse-1');
    console.log('✅ Pump stopped:', stopResult);

    console.log('🎉 All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    // Cleanup
    try {
      await prismaService.pumpOperation.deleteMany({
        where: { greenhouseId: 'test-greenhouse-1' },
      });
      await prismaService.device.deleteMany({
        where: { greenhouseId: 'test-greenhouse-1' },
      });
      console.log('🧹 Cleanup completed');
    } catch (cleanupError) {
      console.error('⚠️ Cleanup failed:', cleanupError.message);
    }

    await app.close();
  }
}

// Run the test
testPumpService()
  .then(() => {
    console.log('Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });
