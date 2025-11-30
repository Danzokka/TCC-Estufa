import { PrismaClient } from '@prisma/client';
import { randomBytes, pbkdf2Sync } from 'crypto';

const prisma = new PrismaClient();

// Hash password using pbkdf2 (same method used in UserService)
function hashPassword(password: string): string {
  const salt = randomBytes(8).toString('hex');
  const hash = pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}&${hash}`;
}

async function main() {
  console.log('🌱 Starting database seeding...\n');

  // Clean existing data
  console.log('🧹 Cleaning existing data...');
  await prisma.greenhouseSensorReading.deleteMany({});
  await prisma.pumpOperation.deleteMany({});
  await prisma.irrigation.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.report.deleteMany({});
  await prisma.userPlant.deleteMany({});
  await prisma.greenhouse.deleteMany({});
  await prisma.plant.deleteMany({});
  await prisma.refreshToken.deleteMany({});
  await prisma.user.deleteMany({});

  // Create admin user
  console.log('👤 Creating admin user...');
  const hashedPassword = hashPassword('Test@123');

  const adminUser = await prisma.user.create({
    data: {
      username: 'admin',
      name: 'Administrador',
      email: 'admin@greenhouse.local',
      password: hashedPassword,
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    },
  });

  console.log(`✅ Created user: ${adminUser.username}`);

  // Create plant types (catalog)
  console.log('\n🌿 Creating plant catalog...');

  const pimenta = await prisma.plant.create({
    data: {
      name: 'Pimenta',
      description:
        'Pimenta para cultivo em estufa com irrigação controlada. Gosta de calor e solo moderadamente úmido.',
      air_temperature_initial: 20.0,
      air_temperature_final: 32.0,
      air_humidity_initial: 50.0,
      air_humidity_final: 70.0,
      soil_temperature_initial: 18.0,
      soil_temperature_final: 28.0,
      soil_moisture_initial: 40,
      soil_moisture_final: 70,
    },
  });

  const tomate = await prisma.plant.create({
    data: {
      name: 'Tomate',
      description:
        'Tomate cereja ideal para cultivo em estufa. Requer irrigação regular e temperatura amena.',
      air_temperature_initial: 18.0,
      air_temperature_final: 28.0,
      air_humidity_initial: 50.0,
      air_humidity_final: 70.0,
      soil_temperature_initial: 16.0,
      soil_temperature_final: 24.0,
      soil_moisture_initial: 60,
      soil_moisture_final: 80,
    },
  });

  const alface = await prisma.plant.create({
    data: {
      name: 'Alface',
      description:
        'Alface crespa para cultivo hidropônico ou solo. Prefere temperaturas amenas.',
      air_temperature_initial: 15.0,
      air_temperature_final: 22.0,
      air_humidity_initial: 60.0,
      air_humidity_final: 80.0,
      soil_temperature_initial: 14.0,
      soil_temperature_final: 20.0,
      soil_moisture_initial: 65,
      soil_moisture_final: 85,
    },
  });

  const manjericao = await prisma.plant.create({
    data: {
      name: 'Manjericão',
      description: 'Erva aromática que gosta de calor e solo bem drenado.',
      air_temperature_initial: 20.0,
      air_temperature_final: 30.0,
      air_humidity_initial: 40.0,
      air_humidity_final: 60.0,
      soil_temperature_initial: 18.0,
      soil_temperature_final: 25.0,
      soil_moisture_initial: 50,
      soil_moisture_final: 70,
    },
  });

  const morango = await prisma.plant.create({
    data: {
      name: 'Morango',
      description:
        'Morango para cultivo vertical. Produz frutos doces com cuidados adequados.',
      air_temperature_initial: 16.0,
      air_temperature_final: 24.0,
      air_humidity_initial: 55.0,
      air_humidity_final: 75.0,
      soil_temperature_initial: 15.0,
      soil_temperature_final: 22.0,
      soil_moisture_initial: 60,
      soil_moisture_final: 75,
    },
  });

  console.log(`✅ Created ${5} plant types in catalog`);

  // Create greenhouse for admin user
  console.log('\n🏠 Creating greenhouse...');
  const greenhouse = await prisma.greenhouse.create({
    data: {
      name: 'Estufa Principal',
      description:
        'Estufa com sistema de irrigação automatizado e monitoramento IoT',
      location: 'Localização Principal',
      ownerId: adminUser.id,
      currentTemperature: 25.0,
      currentHumidity: 60.0,
      currentSoilMoisture: 55,
      targetTemperature: 26.0,
      targetHumidity: 60.0,
      targetSoilMoisture: 55,
      minWaterLevel: 20.0,
      wifiSSID: 'Greenhouse_WiFi',
      isOnline: true,
      lastDataUpdate: new Date(),
      isConfigured: true,
    },
  });

  console.log(`✅ Created greenhouse: ${greenhouse.name}`);

  // Create user's active plant (Pimenta)
  console.log('\n🌱 Creating user plant...');
  const userPimenta = await prisma.userPlant.create({
    data: {
      userId: adminUser.id,
      plantId: pimenta.id,
      greenhouseId: greenhouse.id,
      nickname: 'Pimenta Dedo-de-Moça',
    },
  });

  // Set as active plant in greenhouse
  await prisma.greenhouse.update({
    where: { id: greenhouse.id },
    data: { activeUserPlantId: userPimenta.id },
  });

  console.log(`✅ Created and activated plant: ${userPimenta.nickname}`);

  // Create 7 days of sensor readings (hourly)
  console.log('\n📊 Creating 7 days of sensor readings...');
  const now = Date.now();
  const greenhouseSensorReadings: any[] = [];

  // 7 days = 168 hours
  for (let i = 0; i < 168; i++) {
    const timestamp = new Date(now - i * 60 * 60 * 1000);
    const hourOfDay = timestamp.getHours();

    // Simulate day/night temperature variation
    const tempVariation = Math.sin(((hourOfDay - 6) * Math.PI) / 12) * 3;

    greenhouseSensorReadings.push({
      greenhouseId: greenhouse.id,
      airTemperature: 25.0 + tempVariation + (Math.random() - 0.5),
      airHumidity: 60.0 + (Math.random() - 0.5) * 5,
      soilMoisture: 55 + Math.floor((Math.random() - 0.5) * 10),
      soilTemperature: 22.0 + tempVariation * 0.5,
      timestamp: timestamp,
      isValid: true,
    });
  }

  await prisma.greenhouseSensorReading.createMany({
    data: greenhouseSensorReadings,
  });

  console.log(
    `✅ Created ${greenhouseSensorReadings.length} greenhouse sensor readings`,
  );

  // Create some pump operations
  console.log('\n💧 Creating pump operations...');
  await prisma.pumpOperation.create({
    data: {
      greenhouseId: greenhouse.id,
      duration: 300,
      waterAmount: 5.0,
      reason: 'Irrigação programada - Solo abaixo de 50%',
      startedAt: new Date(now - 7200000), // 2 hours ago
      endedAt: new Date(now - 6900000),
      status: 'completed',
      esp32Response: 'OK - Pump activated successfully',
    },
  });

  await prisma.pumpOperation.create({
    data: {
      greenhouseId: greenhouse.id,
      duration: 180,
      waterAmount: 3.0,
      reason: 'Irrigação manual via dashboard',
      startedAt: new Date(now - 3600000), // 1 hour ago
      endedAt: new Date(now - 3420000),
      status: 'completed',
      esp32Response: 'OK - Pump activated successfully',
    },
  });

  console.log(`✅ Created ${2} pump operations`);

  // Summary
  console.log('\n🎉 Database seeding completed successfully!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📝 Test Credentials:');
  console.log('   Email: admin@greenhouse.local');
  console.log('   Username: admin');
  console.log('   Password: Test@123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n📊 Created Data Summary:');
  console.log(`   • 1 Admin User`);
  console.log(
    `   • 5 Plant Types (Pimenta, Tomate, Alface, Manjericão, Morango)`,
  );
  console.log(`   • 1 Greenhouse`);
  console.log(`   • 1 Active Plant (Pimenta)`);
  console.log(
    `   • ${greenhouseSensorReadings.length} Sensor Readings (7 days)`,
  );
  console.log(`   • 2 Pump Operations`);
  console.log('\n');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
