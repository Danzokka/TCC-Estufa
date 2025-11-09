import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import csv from 'csv-parser';

const prisma = new PrismaClient();

interface CSVRow {
  Timestamp: string;
  Plant_ID: string;
  Soil_Moisture: string;
  Ambient_Temperature: string;
  Soil_Temperature: string;
  Humidity: string;
  Light_Intensity: string;
  Soil_pH: string;
  Nitrogen_Level: string;
  Phosphorus_Level: string;
  Potassium_Level: string;
  Chlorophyll_Content: string;
  Electrochemical_Signal: string;
  Plant_Health_Status: string;
}

interface ProcessedReading {
  timestamp: Date;
  soilMoisture: number;
  airTemperature: number;
  soilTemperature: number;
  airHumidity: number;
  healthStatus: string;
}

async function seedPlantHealthDataset() {
  console.log('🌱 Starting plant health dataset seeding...\n');

  try {
    // 1. Find or create a test user
    let testUser = await prisma.user.findUnique({
      where: { email: 'test@greenhouse.local' },
    });

    if (!testUser) {
      console.log('Creating test user...');
      testUser = await prisma.user.create({
        data: {
          email: 'test@greenhouse.local',
          password: 'hashed_password_placeholder',
          name: 'Test User',
          username: 'test_user_dataset',
          image: 'https://via.placeholder.com/150',
        },
      });
      console.log('✅ Test user created\n');
    } else {
      console.log('✅ Test user already exists\n');
    }

    // 2. Find or create a test plant
    let testPlant = await prisma.plant.findFirst({
      where: { name: 'Planta de Teste - Dataset' },
    });

    if (!testPlant) {
      console.log('Creating test plant...');
      testPlant = await prisma.plant.create({
        data: {
          name: 'Planta de Teste - Dataset',
          description: 'Planta de teste para dados do dataset de saúde',
          air_humidity_final: 70.0,
          air_humidity_initial: 50.0,
          air_temperature_final: 28.0,
          air_temperature_initial: 18.0,
          light_intensity_final: 1000.0,
          light_intensity_initial: 600.0,
          soil_moisture_final: 60,
          soil_moisture_initial: 40,
          soil_temperature_final: 25.0,
          soil_temperature_initial: 18.0,
        },
      });
      console.log('✅ Test plant created\n');
    } else {
      console.log('✅ Test plant already exists\n');
    }

    // 3. Find or create a test greenhouse
    let testGreenhouse = await prisma.greenhouse.findFirst({
      where: {
        ownerId: testUser.id,
        name: 'Estufa de Teste - Dataset',
      },
    });

    if (!testGreenhouse) {
      console.log('Creating test greenhouse...');
      testGreenhouse = await prisma.greenhouse.create({
        data: {
          name: 'Estufa de Teste - Dataset',
          description: 'Estufa de teste para dados do dataset de saúde',
          location: 'Laboratório de Teste - São Paulo, SP',
          targetTemperature: 23.0,
          targetHumidity: 60.0,
          targetSoilMoisture: 50,
          minWaterLevel: 20.0,
          isOnline: true,
          isConfigured: true,
          ownerId: testUser.id,
        },
      });
      console.log('✅ Test greenhouse created\n');
    } else {
      console.log('✅ Test greenhouse already exists\n');
    }

    // 4. Create or find UserPlant relationship
    let testUserPlant = await prisma.userPlant.findFirst({
      where: {
        userId: testUser.id,
        plantId: testPlant.id,
      },
    });

    if (!testUserPlant) {
      console.log('Creating test user-plant relationship...');
      testUserPlant = await prisma.userPlant.create({
        data: {
          userId: testUser.id,
          plantId: testPlant.id,
          greenhouseId: testGreenhouse.id,
          nickname: 'Planta de Teste Dataset',
        },
      });
      console.log('✅ Test user-plant relationship created\n');
    } else {
      console.log('✅ Test user-plant relationship already exists\n');
    }

    // 5. Read and parse CSV file
    const csvPath = path.resolve(
      __dirname,
      '../../ai/dataset/plant_health_data.csv',
    );

    if (!fs.existsSync(csvPath)) {
      throw new Error(`CSV file not found at: ${csvPath}`);
    }

    console.log(`📄 Reading CSV file: ${csvPath}\n`);

    const readings: ProcessedReading[] = [];

    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (row: CSVRow) => {
          try {
            const reading: ProcessedReading = {
              timestamp: new Date(row.Timestamp),
              airTemperature: parseFloat(row.Ambient_Temperature),
              airHumidity: parseFloat(row.Humidity),
              soilMoisture: parseInt(row.Soil_Moisture),
              soilTemperature: parseFloat(row.Soil_Temperature),
              healthStatus: row.Plant_Health_Status,
            };

            // Validate data
            if (
              isNaN(reading.airTemperature) ||
              isNaN(reading.airHumidity) ||
              isNaN(reading.soilMoisture) ||
              isNaN(reading.soilTemperature) ||
              !reading.timestamp
            ) {
              console.warn(
                '⚠️  Skipping invalid row with NaN or invalid timestamp',
              );
              return; // Skip this row
            }

            readings.push(reading);
          } catch (error: unknown) {
            console.warn(
              `⚠️  Error parsing row: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
          }
        })
        .on('end', () => {
          console.log(
            `✅ CSV parsing complete. Found ${readings.length} valid readings\n`,
          );
          resolve();
        })
        .on('error', reject);
    });

    // 6. Check if data already exists
    const existingCount = await prisma.greenhouseSensorReading.count({
      where: { greenhouseId: testGreenhouse.id },
    });

    if (existingCount > 0) {
      console.log(
        `⚠️  Found ${existingCount} existing readings for this greenhouse.`,
      );
      console.log('   Clearing old data before seeding...\n');

      await prisma.greenhouseSensorReading.deleteMany({
        where: { greenhouseId: testGreenhouse.id },
      });
      console.log('✅ Old data cleared\n');
    }

    // 7. Insert readings into database
    console.log('💾 Inserting readings into database...\n');

    let inserted = 0;
    const batchSize = 10;

    for (let i = 0; i < readings.length; i += batchSize) {
      const batch = readings.slice(i, i + batchSize);

      await prisma.$transaction(
        batch.map((reading) =>
          prisma.greenhouseSensorReading.create({
            data: {
              greenhouseId: testGreenhouse.id,
              airTemperature: reading.airTemperature,
              airHumidity: reading.airHumidity,
              soilTemperature: reading.soilTemperature,
              soilMoisture: Math.round(reading.soilMoisture),
              timestamp: reading.timestamp,
              isValid: true,
            },
          }),
        ),
      );

      inserted += batch.length;
      process.stdout.write(
        `   Progress: ${inserted}/${readings.length} readings inserted\r`,
      );
    }

    console.log(`\n✅ Successfully inserted ${inserted} sensor readings\n`);

    // 8. Display summary statistics
    const stats = {
      totalReadings: inserted,
      dateRange: {
        first: readings[0]?.timestamp.toISOString(),
        last: readings[readings.length - 1]?.timestamp.toISOString(),
      },
      avgTemperature: (
        readings.reduce((sum, r) => sum + r.airTemperature, 0) / readings.length
      ).toFixed(2),
      avgHumidity: (
        readings.reduce((sum, r) => sum + r.airHumidity, 0) / readings.length
      ).toFixed(2),
      avgSoilMoisture: (
        readings.reduce((sum, r) => sum + r.soilMoisture, 0) / readings.length
      ).toFixed(2),
      healthStatusCount: readings.reduce(
        (acc, r) => {
          acc[r.healthStatus] = (acc[r.healthStatus] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
    };

    console.log('📊 Dataset Statistics:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Total Readings: ${stats.totalReadings}`);
    console.log(
      `   Date Range: ${stats.dateRange.first} to ${stats.dateRange.last}`,
    );
    console.log(`   Avg Air Temperature: ${stats.avgTemperature}°C`);
    console.log(`   Avg Air Humidity: ${stats.avgHumidity}%`);
    console.log(`   Avg Soil Moisture: ${stats.avgSoilMoisture}%`);
    console.log(`   Health Status Distribution:`);
    Object.entries(stats.healthStatusCount).forEach(([status, count]) => {
      console.log(
        `      - ${status}: ${count} (${((count / stats.totalReadings) * 100).toFixed(1)}%)`,
      );
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('✅ Plant health dataset seeding completed successfully!\n');
    console.log('📝 Summary:');
    console.log(`   - User: ${testUser.email}`);
    console.log(`   - Plant: ${testPlant.name}`);
    console.log(`   - Greenhouse: ${testGreenhouse.name}`);
    console.log(`   - Sensor Readings: ${inserted}\n`);
  } catch (error) {
    console.error('❌ Error seeding plant health dataset:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Execute seed if run directly
if (require.main === module) {
  seedPlantHealthDataset()
    .then(() => {
      console.log('✨ Seeding process completed!\n');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding process failed:', error);
      process.exit(1);
    });
}

export { seedPlantHealthDataset };
