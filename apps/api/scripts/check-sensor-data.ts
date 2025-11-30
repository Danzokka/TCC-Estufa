import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkData() {
  try {
    // Count sensor readings
    const totalReadings = await prisma.greenhouseSensorReading.count();
    console.log(`📊 Total de leituras de sensores: ${totalReadings}`);

    if (totalReadings > 0) {
      // Get first and last readings
      const firstReading = await prisma.greenhouseSensorReading.findFirst({
        orderBy: { timestamp: 'asc' },
        include: {
          greenhouse: {
            select: { name: true },
          },
        },
      });

      const lastReading = await prisma.greenhouseSensorReading.findFirst({
        orderBy: { timestamp: 'desc' },
        include: {
          greenhouse: {
            select: { name: true },
          },
        },
      });

      console.log('\n📅 Primeira leitura:');
      console.log(`   Data: ${firstReading?.timestamp}`);
      console.log(`   Estufa: ${firstReading?.greenhouse.name}`);
      console.log(`   Temperatura: ${firstReading?.airTemperature}°C`);
      console.log(`   Umidade do Ar: ${firstReading?.airHumidity}%`);
      console.log(`   Umidade do Solo: ${firstReading?.soilMoisture}%`);
      console.log(`   Temperatura do Solo: ${firstReading?.soilTemperature}°C`);

      console.log('\n📅 Última leitura:');
      console.log(`   Data: ${lastReading?.timestamp}`);
      console.log(`   Estufa: ${lastReading?.greenhouse.name}`);
      console.log(`   Temperatura: ${lastReading?.airTemperature}°C`);
      console.log(`   Umidade do Ar: ${lastReading?.airHumidity}%`);
      console.log(`   Umidade do Solo: ${lastReading?.soilMoisture}%`);
      console.log(`   Temperatura do Solo: ${lastReading?.soilTemperature}°C`);

      // Sample readings
      console.log('\n📋 Amostra de 5 leituras recentes:');
      const samples = await prisma.greenhouseSensorReading.findMany({
        take: 5,
        orderBy: { timestamp: 'desc' },
        select: {
          timestamp: true,
          airTemperature: true,
          airHumidity: true,
          soilMoisture: true,
          soilTemperature: true,
          plantHealthScore: true,
        },
      });

      samples.forEach((reading, idx) => {
        console.log(`\n   ${idx + 1}. ${reading.timestamp}`);
        console.log(
          `      🌡️  Temp Ar: ${reading.airTemperature}°C | 💧 Umid Ar: ${reading.airHumidity}%`,
        );
        console.log(
          `      🌱 Umid Solo: ${reading.soilMoisture}% | 🌡️  Temp Solo: ${reading.soilTemperature}°C`,
        );
        console.log(
          `      💚 Health Score: ${reading.plantHealthScore ?? 'N/A'}`,
        );
      });

      // Statistics
      const stats = await prisma.greenhouseSensorReading.aggregate({
        _avg: {
          airTemperature: true,
          airHumidity: true,
          soilMoisture: true,
          soilTemperature: true,
        },
        _min: {
          airTemperature: true,
          airHumidity: true,
          soilMoisture: true,
          soilTemperature: true,
        },
        _max: {
          airTemperature: true,
          airHumidity: true,
          soilMoisture: true,
          soilTemperature: true,
        },
      });

      console.log('\n📈 Estatísticas dos Sensores:');
      console.log(
        `   Temperatura do Ar: ${stats._min.airTemperature?.toFixed(1)}°C - ${stats._max.airTemperature?.toFixed(1)}°C (média: ${stats._avg.airTemperature?.toFixed(1)}°C)`,
      );
      console.log(
        `   Umidade do Ar: ${stats._min.airHumidity?.toFixed(1)}% - ${stats._max.airHumidity?.toFixed(1)}% (média: ${stats._avg.airHumidity?.toFixed(1)}%)`,
      );
      console.log(
        `   Umidade do Solo: ${stats._min.soilMoisture?.toFixed(1)}% - ${stats._max.soilMoisture?.toFixed(1)}% (média: ${stats._avg.soilMoisture?.toFixed(1)}%)`,
      );
      console.log(
        `   Temperatura do Solo: ${stats._min.soilTemperature?.toFixed(1)}°C - ${stats._max.soilTemperature?.toFixed(1)}°C (média: ${stats._avg.soilTemperature?.toFixed(1)}°C)`,
      );
    } else {
      console.log(
        '\n⚠️  Nenhuma leitura de sensor encontrada no banco de dados!',
      );
    }
  } catch (error) {
    console.error('❌ Erro ao verificar dados:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
