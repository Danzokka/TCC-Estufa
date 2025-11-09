import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed script to generate realistic GreenhouseSensorReading data
 * for testing AI predictions
 *
 * Generates 48 hours of sensor readings with realistic variations:
 * - Temperature: Day/night cycle (20-32°C air, 18-28°C soil)
 * - Humidity: Inverse to temperature (40-80%)
 * - Soil Moisture: Gradual decrease with irrigation events (30-70%)
 */

// Helper function to generate realistic temperature with day/night cycle
function generateTemperature(
  hour: number,
  baseTemp: number,
  variation: number,
): number {
  // Sine wave for day/night cycle (peak at 14:00, low at 02:00)
  const timeOffset = ((hour - 2) / 24) * 2 * Math.PI;
  const dailyCycle = Math.sin(timeOffset);
  const temp = baseTemp + dailyCycle * variation;

  // Add small random noise
  const noise = (Math.random() - 0.5) * 2;
  return Math.round((temp + noise) * 10) / 10;
}

// Helper function to generate humidity (inverse to temperature)
function generateHumidity(temperature: number, baseHumidity: number): number {
  // Higher temperature = lower humidity
  const tempEffect = (30 - temperature) * 1.5;
  const humidity = baseHumidity + tempEffect;

  // Add random noise
  const noise = (Math.random() - 0.5) * 5;
  const result = humidity + noise;

  // Clamp between 30-90%
  return Math.round(Math.max(30, Math.min(90, result)) * 10) / 10;
}

// Helper function to generate soil moisture with gradual decrease
function generateSoilMoisture(
  hoursSinceIrrigation: number,
  lastMoisture: number,
): number {
  // Gradual decrease over time (exponential decay)
  const decreaseRate = 0.8; // % per hour
  const decrease = hoursSinceIrrigation * decreaseRate;
  const moisture = lastMoisture - decrease;

  // Add random noise
  const noise = (Math.random() - 0.5) * 2;
  const result = moisture + noise;

  // Clamp between 25-75%
  return Math.round(Math.max(25, Math.min(75, result)));
}

export async function seedSensorData(greenhouseId: string, hours: number = 48) {
  console.log(
    `\n🌡️  Generating ${hours} hours of sensor data for greenhouse ${greenhouseId}...`,
  );

  const now = new Date();
  const readings: Array<{
    greenhouseId: string;
    timestamp: Date;
    airTemperature: number;
    airHumidity: number;
    soilMoisture: number;
    soilTemperature: number;
    isValid: boolean;
  }> = [];

  // Initial values
  let currentSoilMoisture = 65; // Start with well-watered soil
  let hoursSinceIrrigation = 0;

  // Generate readings for each hour
  for (let i = hours; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
    const hour = timestamp.getHours();

    // Generate air temperature (base 26°C, ±6°C variation)
    const airTemperature = generateTemperature(hour, 26, 6);

    // Generate air humidity (base 60%, inverse to temperature)
    const airHumidity = generateHumidity(airTemperature, 60);

    // Generate soil temperature (base 22°C, ±4°C variation, lags air temp)
    const soilTemperature = generateTemperature(hour - 2, 22, 4);

    // Simulate irrigation every 8-12 hours when moisture drops below 40%
    hoursSinceIrrigation++;
    if (currentSoilMoisture < 40 && hoursSinceIrrigation > 8) {
      currentSoilMoisture = 65 + Math.random() * 5; // Reset to 65-70%
      hoursSinceIrrigation = 0;
      console.log(`  💧 Irrigation event at ${timestamp.toISOString()}`);
    }

    // Generate soil moisture
    const soilMoisture = generateSoilMoisture(
      hoursSinceIrrigation,
      currentSoilMoisture,
    );
    currentSoilMoisture = soilMoisture;

    readings.push({
      greenhouseId,
      timestamp,
      airTemperature,
      airHumidity,
      soilMoisture,
      soilTemperature,
      isValid: true,
    });
  }

  // Insert all readings in batch
  console.log(`  📊 Inserting ${readings.length} sensor readings...`);
  await prisma.greenhouseSensorReading.createMany({
    data: readings,
  });

  // Get statistics
  const avgAirTemp =
    readings.reduce((sum, r) => sum + r.airTemperature, 0) / readings.length;
  const avgSoilMoisture =
    readings.reduce((sum, r) => sum + r.soilMoisture, 0) / readings.length;
  const minSoilMoisture = Math.min(...readings.map((r) => r.soilMoisture));
  const maxSoilMoisture = Math.max(...readings.map((r) => r.soilMoisture));

  console.log(`  ✅ Created ${readings.length} sensor readings`);
  console.log(`  📈 Statistics:`);
  console.log(`     - Avg Air Temp: ${avgAirTemp.toFixed(1)}°C`);
  console.log(`     - Avg Soil Moisture: ${avgSoilMoisture.toFixed(1)}%`);
  console.log(
    `     - Soil Moisture Range: ${minSoilMoisture}% - ${maxSoilMoisture}%`,
  );

  return readings;
}

async function main() {
  console.log('🌱 Starting sensor data seeding...');

  // Get the first greenhouse
  const greenhouse = await prisma.greenhouse.findFirst({
    select: {
      id: true,
      name: true,
      owner: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  if (!greenhouse) {
    console.log('❌ No greenhouse found in database.');
    console.log('   Please run the main seed script first: npm run seed');
    return;
  }

  console.log(`\n🏡 Found greenhouse: ${greenhouse.name}`);
  console.log(`   Owner: ${greenhouse.owner.name} (${greenhouse.owner.email})`);
  console.log(`   ID: ${greenhouse.id}`);

  // Check existing sensor data
  const existingCount = await prisma.greenhouseSensorReading.count({
    where: { greenhouseId: greenhouse.id },
  });

  if (existingCount > 0) {
    console.log(`\n⚠️  Found ${existingCount} existing sensor readings.`);
    console.log(`   Delete them? (y/N)`);

    // In production, you might want to prompt for confirmation
    // For now, we'll delete automatically
    console.log(`   🧹 Deleting existing readings...`);
    await prisma.greenhouseSensorReading.deleteMany({
      where: { greenhouseId: greenhouse.id },
    });
  }

  // Generate 48 hours of data
  await seedSensorData(greenhouse.id, 48);

  console.log('\n✅ Sensor data seeding complete!');
  console.log('\n🧪 Test the AI service:');
  console.log(`   curl -X POST http://localhost:5001/analyze-sensors \\`);
  console.log(`     -H "Content-Type: application/json" \\`);
  console.log(`     -d '{"greenhouseId": "${greenhouse.id}"}'`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
