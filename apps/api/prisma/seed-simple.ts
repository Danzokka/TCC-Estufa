import { PrismaClient } from '@prisma/client';
import { pbkdf2Sync, randomBytes } from 'crypto';

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}&${hash}`; // Backend usa & como separador, não :
}

async function main() {
  console.log('🌱 Starting simplified seed...\n');

  // Clean tables
  console.log('🧹 Cleaning database...');
  await prisma.greenhouseSensorReading.deleteMany({});
  await prisma.pumpOperation.deleteMany({});
  await prisma.irrigation.deleteMany({});
  await prisma.userPlant.deleteMany({});
  await prisma.greenhouse.deleteMany({});
  await prisma.plant.deleteMany({});
  await prisma.refreshToken.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.user.deleteMany({});

  // Create admin user
  console.log('👤 Creating admin user...');
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@greenhouse.local',
      username: 'admin',
      name: 'Admin User',
      image: 'https://github.com/shadcn.png',
      password: hashPassword('Test@123'),
    },
  });
  console.log(`✅ Created admin user: ${adminUser.email}`);

  // Create plants
  console.log('\n🌿 Creating plants...');
  const tomato = await prisma.plant.create({
    data: {
      name: 'Tomate',
      description: 'Tomate cereja ideal para cultivo em estufa',
      air_temperature_initial: 18.0,
      air_temperature_final: 28.0,
      air_humidity_initial: 50.0,
      air_humidity_final: 70.0,
      soil_temperature_initial: 16.0,
      soil_temperature_final: 24.0,
      soil_moisture_initial: 60,
      soil_moisture_final: 80,
      light_intensity_initial: 400.0,
      light_intensity_final: 800.0,
    },
  });

  const lettuce = await prisma.plant.create({
    data: {
      name: 'Alface',
      description: 'Alface crespa para cultivo hidropônico',
      air_temperature_initial: 15.0,
      air_temperature_final: 22.0,
      air_humidity_initial: 60.0,
      air_humidity_final: 80.0,
      soil_temperature_initial: 14.0,
      soil_temperature_final: 20.0,
      soil_moisture_initial: 70,
      soil_moisture_final: 85,
      light_intensity_initial: 300.0,
      light_intensity_final: 600.0,
    },
  });

  const basil = await prisma.plant.create({
    data: {
      name: 'Manjericão',
      description: 'Manjericão aromático italiano',
      air_temperature_initial: 20.0,
      air_temperature_final: 30.0,
      air_humidity_initial: 40.0,
      air_humidity_final: 60.0,
      soil_temperature_initial: 18.0,
      soil_temperature_final: 25.0,
      soil_moisture_initial: 50,
      soil_moisture_final: 70,
      light_intensity_initial: 350.0,
      light_intensity_final: 700.0,
    },
  });

  const strawberry = await prisma.plant.create({
    data: {
      name: 'Morango',
      description: 'Morango para cultivo vertical',
      air_temperature_initial: 16.0,
      air_temperature_final: 24.0,
      air_humidity_initial: 55.0,
      air_humidity_final: 75.0,
      soil_temperature_initial: 15.0,
      soil_temperature_final: 22.0,
      soil_moisture_initial: 60,
      soil_moisture_final: 75,
      light_intensity_initial: 400.0,
      light_intensity_final: 700.0,
    },
  });

  const pepper = await prisma.plant.create({
    data: {
      name: 'Pimentão',
      description: 'Pimentão colorido para estufa',
      air_temperature_initial: 20.0,
      air_temperature_final: 30.0,
      air_humidity_initial: 50.0,
      air_humidity_final: 70.0,
      soil_temperature_initial: 18.0,
      soil_temperature_final: 26.0,
      soil_moisture_initial: 55,
      soil_moisture_final: 75,
      light_intensity_initial: 450.0,
      light_intensity_final: 850.0,
    },
  });

  console.log(`✅ Created ${5} plants`);

  // Create greenhouses
  console.log('\n🏠 Creating greenhouses...');
  const greenhouse1 = await prisma.greenhouse.create({
    data: {
      name: 'Estufa Principal',
      description: 'Estufa principal com sistema automatizado',
      location: 'Setor A - Galpão 1',
      ownerId: adminUser.id,
      currentTemperature: 24.5,
      currentHumidity: 62.0,
      currentSoilMoisture: 68,
      targetTemperature: 25.0,
      targetHumidity: 65.0,
      targetSoilMoisture: 70,
      minWaterLevel: 20.0,
      wifiSSID: 'Greenhouse_WiFi',
      isOnline: true,
      lastDataUpdate: new Date(),
      isConfigured: true,
    },
  });

  const greenhouse2 = await prisma.greenhouse.create({
    data: {
      name: 'Estufa Experimental',
      description: 'Estufa para testes e experimentos',
      location: 'Setor B - Galpão 2',
      ownerId: adminUser.id,
      currentTemperature: 22.8,
      currentHumidity: 58.5,
      currentSoilMoisture: 65,
      targetTemperature: 23.0,
      targetHumidity: 60.0,
      targetSoilMoisture: 65,
      minWaterLevel: 25.0,
      wifiSSID: 'Greenhouse_WiFi',
      isOnline: true,
      lastDataUpdate: new Date(),
      isConfigured: true,
    },
  });

  const greenhouse3 = await prisma.greenhouse.create({
    data: {
      name: 'Estufa Hidropônica',
      description: 'Sistema hidropônico vertical',
      location: 'Setor C - Área Externa',
      ownerId: adminUser.id,
      currentTemperature: 21.5,
      currentHumidity: 70.0,
      currentSoilMoisture: 80,
      targetTemperature: 22.0,
      targetHumidity: 70.0,
      targetSoilMoisture: 75,
      minWaterLevel: 30.0,
      wifiSSID: 'Greenhouse_WiFi',
      isOnline: false,
      lastDataUpdate: new Date(Date.now() - 3600000), // 1 hour ago
      isConfigured: true,
    },
  });

  console.log(`✅ Created ${3} greenhouses`);

  // Create UserPlants with greenhouseId
  console.log('\n🌱 Creating user-plant assignments with greenhouses...');

  const adminTomato = await prisma.userPlant.create({
    data: {
      userId: adminUser.id,
      plantId: tomato.id,
      greenhouseId: greenhouse1.id, // Estufa Principal
      nickname: 'Tomates da Estufa 1',
    },
  });

  const adminLettuce = await prisma.userPlant.create({
    data: {
      userId: adminUser.id,
      plantId: lettuce.id,
      greenhouseId: greenhouse3.id, // Estufa Hidropônica
      nickname: 'Alfaces Hidropônicas',
    },
  });

  const adminBasil = await prisma.userPlant.create({
    data: {
      userId: adminUser.id,
      plantId: basil.id,
      greenhouseId: greenhouse1.id, // Estufa Principal
      nickname: 'Manjericão Aromático',
    },
  });

  const adminStrawberry = await prisma.userPlant.create({
    data: {
      userId: adminUser.id,
      plantId: strawberry.id,
      greenhouseId: greenhouse2.id, // Estufa Experimental
      nickname: 'Morangos Verticais',
    },
  });

  const adminPepper = await prisma.userPlant.create({
    data: {
      userId: adminUser.id,
      plantId: pepper.id,
      greenhouseId: greenhouse1.id, // Estufa Principal
      nickname: 'Pimentões Coloridos',
    },
  });

  console.log(`✅ Created ${5} user-plant assignments with greenhouses`);

  // Create abundant sensor readings (7 days of data, hourly readings)
  console.log('\n📊 Creating 7 days of sensor readings...');
  const now = Date.now();
  const greenhouseSensorReadings: any[] = [];

  // 7 days = 168 hours
  for (let i = 0; i < 168; i++) {
    const timestamp = new Date(now - i * 60 * 60 * 1000); // Each hour
    const hourOfDay = timestamp.getHours();

    // Simulate day/night temperature variation
    const tempVariation = Math.sin(((hourOfDay - 6) * Math.PI) / 12) * 3;

    // Greenhouse 1 readings
    greenhouseSensorReadings.push({
      greenhouseId: greenhouse1.id,
      airTemperature: 24.5 + tempVariation + (Math.random() - 0.5),
      airHumidity: 62.0 + (Math.random() - 0.5) * 5,
      soilMoisture: 68 + Math.floor((Math.random() - 0.5) * 10),
      soilTemperature: 22.0 + tempVariation * 0.5,
      timestamp: timestamp,
      isValid: true,
    });

    // Greenhouse 2 readings
    greenhouseSensorReadings.push({
      greenhouseId: greenhouse2.id,
      airTemperature: 22.8 + tempVariation + (Math.random() - 0.5),
      airHumidity: 58.5 + (Math.random() - 0.5) * 5,
      soilMoisture: 65 + Math.floor((Math.random() - 0.5) * 10),
      soilTemperature: 21.0 + tempVariation * 0.5,
      timestamp: timestamp,
      isValid: true,
    });

    // Greenhouse 3 readings
    greenhouseSensorReadings.push({
      greenhouseId: greenhouse3.id,
      airTemperature: 21.5 + tempVariation + (Math.random() - 0.5),
      airHumidity: 70.0 + (Math.random() - 0.5) * 5,
      soilMoisture: 80 + Math.floor((Math.random() - 0.5) * 10),
      soilTemperature: 20.0 + tempVariation * 0.5,
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
      greenhouseId: greenhouse1.id,
      duration: 300,
      waterAmount: 5.0,
      reason: 'Irrigação programada - Solo abaixo de 65%',
      startedAt: new Date(now - 7200000), // 2 hours ago
      endedAt: new Date(now - 6900000), // 1h 55min ago
      status: 'completed',
      esp32Response: 'OK - Pump activated successfully',
    },
  });

  await prisma.pumpOperation.create({
    data: {
      greenhouseId: greenhouse2.id,
      duration: 240,
      waterAmount: 4.0,
      reason: 'Automação baseada em previsão ML',
      startedAt: new Date(now - 1800000), // 30 min ago
      endedAt: new Date(now - 1560000), // 26min ago
      status: 'completed',
      esp32Response: 'OK - Pump activated successfully',
    },
  });

  console.log(`✅ Created ${2} pump operations`);

  console.log('\n🎉 Database seeding completed successfully!\n');
  console.log('📝 Test Credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👤 Admin User:');
  console.log('   Email: admin@greenhouse.local');
  console.log('   Username: admin');
  console.log('   Password: Test@123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n📊 Created Data Summary:');
  console.log(`   • ${1} User`);
  console.log(`   • ${5} Plants`);
  console.log(`   • ${5} User-Plant Assignments (with greenhouses)`);
  console.log(`   • ${3} Greenhouses`);
  console.log(
    `   • ${greenhouseSensorReadings.length} Sensor Readings (7 days)`,
  );
  console.log(`   • ${2} Pump Operations\n`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
