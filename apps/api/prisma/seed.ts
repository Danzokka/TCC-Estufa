import { PrismaClient } from '@prisma/client';
import { randomBytes, pbkdf2Sync } from 'crypto';
import { seedIrrigationData } from './seed-irrigation';

const prisma = new PrismaClient();

// Hash password using pbkdf2 (same method used in UserService)
function hashPassword(password: string): string {
  const salt = randomBytes(8).toString('hex');
  const hash = pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}&${hash}`;
}

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clean existing data (optional - remove if you want to keep existing data)
  console.log('🧹 Cleaning existing data...');
  await prisma.greenhouseSensorReading.deleteMany({});
  await prisma.pumpOperation.deleteMany({});
  await prisma.device.deleteMany({});
  await prisma.greenhouse.deleteMany({});
  await prisma.sensor.deleteMany({});
  await prisma.userPlant.deleteMany({});
  await prisma.like.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.blogPost.deleteMany({});
  await prisma.plant.deleteMany({});
  await prisma.refreshToken.deleteMany({});
  await prisma.user.deleteMany({});

  // Create test user
  console.log('👤 Creating user...');
  const hashedPassword = hashPassword('Test@123');
  console.log(
    `🔐 Generated password hash: ${hashedPassword.substring(0, 20)}...`,
  );

  const adminUser = await prisma.user.create({
    data: {
      username: 'admin',
      name: 'Admin User',
      email: 'admin@greenhouse.local',
      password: hashedPassword,
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    },
  });

  console.log(`✅ Created user: ${adminUser.username}`);

  // Create plants with realistic data
  console.log('🌿 Creating plants...');
  const tomato = await prisma.plant.create({
    data: {
      name: 'Tomate',
      description:
        'Tomate cereja ideal para cultivo em estufa. Requer boa iluminação e irrigação regular.',
      air_temperature_initial: 18.0,
      air_temperature_final: 28.0,
      air_humidity_initial: 50.0,
      air_humidity_final: 70.0,
      soil_moisture_initial: 60,
      soil_moisture_final: 80,
      soil_temperature_initial: 16.0,
      soil_temperature_final: 24.0,
      light_intensity_initial: 400.0,
      light_intensity_final: 800.0,
    },
  });

  const lettuce = await prisma.plant.create({
    data: {
      name: 'Alface',
      description:
        'Alface crespa perfeita para hidroponia. Cresce rápido com temperatura amena.',
      air_temperature_initial: 15.0,
      air_temperature_final: 22.0,
      air_humidity_initial: 60.0,
      air_humidity_final: 80.0,
      soil_moisture_initial: 65,
      soil_moisture_final: 85,
      soil_temperature_initial: 14.0,
      soil_temperature_final: 20.0,
      light_intensity_initial: 300.0,
      light_intensity_final: 600.0,
    },
  });

  const basil = await prisma.plant.create({
    data: {
      name: 'Manjericão',
      description:
        'Erva aromática que requer bastante luz solar e solo bem drenado.',
      air_temperature_initial: 20.0,
      air_temperature_final: 30.0,
      air_humidity_initial: 40.0,
      air_humidity_final: 60.0,
      soil_moisture_initial: 50,
      soil_moisture_final: 70,
      soil_temperature_initial: 18.0,
      soil_temperature_final: 25.0,
      light_intensity_initial: 500.0,
      light_intensity_final: 900.0,
    },
  });

  const strawberry = await prisma.plant.create({
    data: {
      name: 'Morango',
      description:
        'Morango de cultivo vertical. Produz frutos doces com cuidados adequados.',
      air_temperature_initial: 16.0,
      air_temperature_final: 24.0,
      air_humidity_initial: 55.0,
      air_humidity_final: 75.0,
      soil_moisture_initial: 65,
      soil_moisture_final: 80,
      soil_temperature_initial: 15.0,
      soil_temperature_final: 22.0,
      light_intensity_initial: 350.0,
      light_intensity_final: 700.0,
    },
  });

  const pepper = await prisma.plant.create({
    data: {
      name: 'Pimentão',
      description:
        'Pimentão colorido para estufa. Necessita suporte para crescimento vertical.',
      air_temperature_initial: 20.0,
      air_temperature_final: 30.0,
      air_humidity_initial: 50.0,
      air_humidity_final: 70.0,
      soil_moisture_initial: 60,
      soil_moisture_final: 75,
      soil_temperature_initial: 18.0,
      soil_temperature_final: 26.0,
      light_intensity_initial: 450.0,
      light_intensity_final: 850.0,
    },
  });

  console.log(`✅ Created ${5} plants`);

  // Create user plants (plants assigned to users)
  console.log('🌱 Assigning plants to users...');
  const adminTomato = await prisma.userPlant.create({
    data: {
      userId: adminUser.id,
      plantId: tomato.id,
      nickname: 'Tomates da Estufa 1',
    },
  });

  const adminLettuce = await prisma.userPlant.create({
    data: {
      userId: adminUser.id,
      plantId: lettuce.id,
      nickname: 'Alfaces Hidropônicas',
    },
  });

  const adminBasil = await prisma.userPlant.create({
    data: {
      userId: adminUser.id,
      plantId: basil.id,
      nickname: 'Manjericão Aromático',
    },
  });

  const adminStrawberry = await prisma.userPlant.create({
    data: {
      userId: adminUser.id,
      plantId: strawberry.id,
      nickname: 'Morangos Verticais',
    },
  });

  const adminPepper = await prisma.userPlant.create({
    data: {
      userId: adminUser.id,
      plantId: pepper.id,
      nickname: 'Pimentões Coloridos',
    },
  });

  console.log(`✅ Created ${5} user-plant assignments`);

  // Create greenhouses
  console.log('🏠 Creating greenhouses...');
  const greenhouse1 = await prisma.greenhouse.create({
    data: {
      name: 'Estufa Principal',
      description:
        'Estufa principal com sistema de irrigação automatizado e controle de temperatura',
      location: 'Setor A - Galpão 1',
      ownerId: adminUser.id,
      currentTemperature: 24.5,
      currentHumidity: 62.0,
      currentSoilMoisture: 68,
      currentLightIntensity: 650.0,
      currentWaterLevel: 85.5,
      targetTemperature: 25.0,
      targetHumidity: 65.0,
      targetSoilMoisture: 70,
      minWaterLevel: 20.0,
      deviceId: 'ESP32-GH-001',
      wifiSSID: 'Greenhouse_WiFi',
      isOnline: true,
      lastDataUpdate: new Date(),
      isConfigured: true,
    },
  });

  const greenhouse2 = await prisma.greenhouse.create({
    data: {
      name: 'Estufa Experimental',
      description:
        'Estufa para testes de novas culturas e experimentos agronômicos',
      location: 'Setor B - Galpão 2',
      ownerId: adminUser.id,
      currentTemperature: 22.8,
      currentHumidity: 58.5,
      currentSoilMoisture: 65,
      currentLightIntensity: 580.0,
      currentWaterLevel: 72.0,
      targetTemperature: 23.0,
      targetHumidity: 60.0,
      targetSoilMoisture: 65,
      minWaterLevel: 25.0,
      deviceId: 'ESP32-GH-002',
      wifiSSID: 'Greenhouse_WiFi',
      isOnline: true,
      lastDataUpdate: new Date(),
      isConfigured: true,
    },
  });

  const greenhouse3 = await prisma.greenhouse.create({
    data: {
      name: 'Estufa Hidropônica',
      description: 'Sistema hidropônico vertical para cultivo de hortaliças',
      location: 'Setor C - Área Externa',
      ownerId: adminUser.id,
      currentTemperature: 21.5,
      currentHumidity: 70.0,
      currentSoilMoisture: 80,
      currentLightIntensity: 520.0,
      currentWaterLevel: 90.0,
      targetTemperature: 22.0,
      targetHumidity: 70.0,
      targetSoilMoisture: 75,
      minWaterLevel: 30.0,
      deviceId: 'ESP32-GH-003',
      wifiSSID: 'Greenhouse_WiFi',
      isOnline: false,
      lastDataUpdate: new Date(Date.now() - 3600000), // 1 hour ago
      isConfigured: true,
    },
  });

  console.log(`✅ Created ${3} greenhouses`);

  // Create devices (ESP32)
  console.log('📱 Creating IoT devices...');
  const device1 = await prisma.device.create({
    data: {
      name: 'ESP32 Principal',
      greenhouseId: greenhouse1.id,
      type: 'esp32',
      ipAddress: '192.168.1.100',
      macAddress: '24:6F:28:AB:CD:01',
      isOnline: true,
      lastSeen: new Date(),
      firmwareVersion: '1.2.3',
      configuration: {
        sensorInterval: 60000,
        pumpPin: 5,
        temperaturePin: 2,
        moisturePin: 34,
        flowSensorPin: 4,
      },
    },
  });

  const device2 = await prisma.device.create({
    data: {
      name: 'ESP32 Experimental',
      greenhouseId: greenhouse2.id,
      type: 'esp32',
      ipAddress: '192.168.1.101',
      macAddress: '24:6F:28:AB:CD:02',
      isOnline: true,
      lastSeen: new Date(),
      firmwareVersion: '1.2.3',
      configuration: {
        sensorInterval: 60000,
        pumpPin: 5,
        temperaturePin: 2,
        moisturePin: 34,
        flowSensorPin: 4,
      },
    },
  });

  const device3 = await prisma.device.create({
    data: {
      name: 'ESP32 Hidropônico',
      greenhouseId: greenhouse3.id,
      type: 'esp32',
      ipAddress: '192.168.1.102',
      macAddress: '24:6F:28:AB:CD:03',
      isOnline: false,
      lastSeen: new Date(Date.now() - 3600000),
      firmwareVersion: '1.2.2',
      configuration: {
        sensorInterval: 60000,
        pumpPin: 5,
        temperaturePin: 2,
        moisturePin: 34,
        flowSensorPin: 4,
      },
    },
  });

  console.log(`✅ Created ${3} IoT devices`);

  // Create sensor readings (historical data)
  console.log('📊 Creating sensor readings...');
  const now = Date.now();
  const sensorReadings: any[] = [];

  // Create 48 hours of data (one reading every 30 minutes)
  for (let i = 0; i < 96; i++) {
    const timestamp = new Date(now - i * 30 * 60 * 1000);
    const hourOfDay = timestamp.getHours();

    // Simulate realistic day/night temperature variations
    const tempVariation = Math.sin(((hourOfDay - 6) * Math.PI) / 12) * 3;
    const lightVariation = hourOfDay >= 6 && hourOfDay <= 18 ? 1 : 0.1;

    sensorReadings.push({
      userPlantId: adminTomato.id,
      air_temperature: 24.5 + tempVariation + (Math.random() - 0.5),
      air_humidity: 62.0 + (Math.random() - 0.5) * 5,
      soil_moisture: 68 + Math.floor((Math.random() - 0.5) * 10),
      soil_temperature: 22.0 + tempVariation * 0.5 + (Math.random() - 0.5),
      light_intensity: 650.0 * lightVariation + Math.random() * 50,
      water_level: 85.5 - i * 0.1 + (Math.random() - 0.5) * 2,
      water_reserve: 90.0 - i * 0.05,
      timecreated: timestamp,
    });
  }

  await prisma.sensor.createMany({
    data: sensorReadings,
  });

  console.log(`✅ Created ${sensorReadings.length} sensor readings`);

  // Create greenhouse sensor readings
  console.log('📊 Creating greenhouse sensor readings...');
  const greenhouseSensorReadings: any[] = [];

  for (let i = 0; i < 96; i++) {
    const timestamp = new Date(now - i * 30 * 60 * 1000);
    const hourOfDay = timestamp.getHours();

    const tempVariation = Math.sin(((hourOfDay - 6) * Math.PI) / 12) * 3;
    const lightVariation = hourOfDay >= 6 && hourOfDay <= 18 ? 1 : 0.1;

    // Greenhouse 1 readings
    greenhouseSensorReadings.push({
      greenhouseId: greenhouse1.id,
      airTemperature: 24.5 + tempVariation + (Math.random() - 0.5),
      airHumidity: 62.0 + (Math.random() - 0.5) * 5,
      soilMoisture: 68 + Math.floor((Math.random() - 0.5) * 10),
      soilTemperature: 22.0 + tempVariation * 0.5,
      lightIntensity: 650.0 * lightVariation + Math.random() * 50,
      waterLevel: 85.5 - i * 0.1,
      waterReserve: 90.0 - i * 0.05,
      deviceId: device1.id,
      batteryLevel: 95.0 - i * 0.02,
      signalStrength: -45 + Math.floor(Math.random() * 10),
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
      lightIntensity: 580.0 * lightVariation + Math.random() * 50,
      waterLevel: 72.0 - i * 0.08,
      waterReserve: 85.0 - i * 0.04,
      deviceId: device2.id,
      batteryLevel: 92.0 - i * 0.02,
      signalStrength: -50 + Math.floor(Math.random() * 10),
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

  // Create pump operations
  console.log('💧 Creating pump operations...');
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
      greenhouseId: greenhouse1.id,
      duration: 180,
      waterAmount: 3.0,
      reason: 'Irrigação manual via dashboard',
      startedAt: new Date(now - 3600000), // 1 hour ago
      endedAt: new Date(now - 3420000), // 57min ago
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

  await prisma.pumpOperation.create({
    data: {
      greenhouseId: greenhouse1.id,
      duration: 600,
      waterAmount: 10.0,
      reason: 'Irrigação prolongada - Período de calor',
      startedAt: new Date(now - 300000), // 5 min ago
      status: 'active',
    },
  });

  console.log(`✅ Created ${4} pump operations`);

  // Create blog posts
  console.log('📝 Creating blog posts...');
  const blogPost1 = await prisma.blogPost.create({
    data: {
      title: 'Como Otimizar o Cultivo de Tomates em Estufa',
      slug: 'como-otimizar-cultivo-tomates-estufa',
      content: `
# Como Otimizar o Cultivo de Tomates em Estufa

O cultivo de tomates em ambiente controlado oferece inúmeras vantagens, mas requer atenção a diversos fatores para garantir uma produção de qualidade.

## Temperatura Ideal

Mantenha a temperatura entre 18°C e 28°C durante o dia. À noite, pode cair para 15-18°C. Variações bruscas devem ser evitadas.

## Umidade do Ar

A umidade ideal fica entre 50-70%. Níveis muito altos podem favorecer doenças fúngicas.

## Irrigação

Mantenha o solo com 60-80% de umidade. O sistema automatizado com sensores ajuda a manter níveis constantes.

## Iluminação

Tomates precisam de 400-800 lux de intensidade luminosa. Em dias nublados, considere iluminação suplementar.

## Dicas Práticas

- Monitore diariamente os sensores
- Ajuste a irrigação conforme a fase de crescimento
- Faça podas regulares para melhor circulação de ar
- Use suportes verticais para economia de espaço

Com nosso sistema IoT, você pode acompanhar tudo em tempo real!
      `,
      authorId: adminUser.id,
      published: true,
    },
  });

  const blogPost2 = await prisma.blogPost.create({
    data: {
      title: 'Introdução ao Sistema de Monitoramento IoT para Estufas',
      slug: 'introducao-sistema-monitoramento-iot-estufas',
      content: `
# Introdução ao Sistema de Monitoramento IoT para Estufas

A tecnologia IoT está revolucionando a agricultura moderna, especialmente no cultivo em ambiente protegido.

## O que é IoT na Agricultura?

Internet das Coisas (IoT) conecta sensores, atuadores e dispositivos para coletar e analisar dados em tempo real.

## Sensores Utilizados

### Sensor de Temperatura
Monitora a temperatura do ar e do solo, essencial para o desenvolvimento das plantas.

### Sensor de Umidade
Mede a umidade relativa do ar e do solo, prevenindo excesso ou falta de água.

### Sensor de Luminosidade
Garante que as plantas recebam luz suficiente para fotossíntese.

### Sensor de Nível de Água
Monitora o reservatório de água para irrigação automatizada.

## Benefícios do Sistema

1. **Automação**: Irrigação e controle climático automáticos
2. **Economia**: Uso eficiente de água e energia
3. **Produtividade**: Condições ideais aumentam a produção
4. **Monitoramento Remoto**: Acompanhe via smartphone
5. **Previsões**: Machine Learning para decisões inteligentes

## Começando

1. Configure sua estufa no sistema
2. Instale o ESP32 com sensores
3. Conecte à rede WiFi
4. Monitore pelo dashboard

Experimente nosso sistema hoje mesmo!
      `,
      authorId: adminUser.id,
      published: true,
    },
  });

  const blogPost3 = await prisma.blogPost.create({
    data: {
      title: 'Machine Learning Aplicado ao Cultivo Inteligente',
      slug: 'machine-learning-cultivo-inteligente',
      content: `
# Machine Learning Aplicado ao Cultivo Inteligente

Inteligência artificial está transformando a forma como cultivamos plantas em estufas.

## Como Funciona?

Nosso sistema utiliza modelos LSTM (Long Short-Term Memory) para analisar padrões históricos de dados dos sensores e prever condições futuras.

## Previsões Realizadas

- **Temperatura**: Previsão para as próximas 24-48 horas
- **Umidade**: Tendências de variação
- **Necessidade de Irrigação**: Quando regar
- **Saúde das Plantas**: Detecção de anomalias

## Automação Inteligente

O sistema pode ativar automaticamente:
- Irrigação quando solo estiver seco
- Ventilação se temperatura subir
- Iluminação suplementar em dias nublados

## Resultados

Usuários reportam:
- 30% de economia de água
- 25% de aumento na produtividade
- 50% de redução em perdas por doenças

## Futuro

Estamos trabalhando em:
- Reconhecimento de imagens para detectar pragas
- Recomendações personalizadas por tipo de planta
- Integração com previsão do tempo

A agricultura do futuro é inteligente e sustentável!
      `,
      authorId: adminUser.id,
      published: true,
    },
  });

  console.log(`✅ Created ${3} blog posts`);

  // Create comments
  console.log('💬 Creating comments...');
  await prisma.comment.create({
    data: {
      content:
        'Excelente artigo! Estou aplicando essas técnicas na minha estufa e os resultados são impressionantes.',
      blogPostId: blogPost1.id,
      authorId: adminUser.id,
    },
  });

  await prisma.comment.create({
    data: {
      content:
        'O sistema IoT realmente facilita muito. Não preciso mais ficar indo na estufa toda hora.',
      blogPostId: blogPost2.id,
      authorId: adminUser.id,
    },
  });

  await prisma.comment.create({
    data: {
      content:
        'Incrível como a IA pode otimizar o cultivo. Ansioso para testar as previsões de irrigação!',
      blogPostId: blogPost3.id,
      authorId: adminUser.id,
    },
  });

  console.log(`✅ Created ${3} comments`);

  // Create likes
  console.log('❤️ Creating likes...');
  await prisma.like.create({
    data: {
      blogPostId: blogPost1.id,
      userId: adminUser.id,
    },
  });

  await prisma.like.create({
    data: {
      blogPostId: blogPost2.id,
      userId: adminUser.id,
    },
  });

  await prisma.like.create({
    data: {
      blogPostId: blogPost3.id,
      userId: adminUser.id,
    },
  });

  console.log(`✅ Created ${3} likes`);

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
  console.log(`   • ${5} User-Plant Assignments`);
  console.log(`   • ${3} Greenhouses`);
  console.log(`   • ${3} IoT Devices`);
  console.log(`   • ${sensorReadings.length} Sensor Readings`);
  console.log(
    `   • ${greenhouseSensorReadings.length} Greenhouse Sensor Readings`,
  );
  console.log(`   • ${4} Pump Operations`);
  console.log(`   • ${3} Blog Posts`);
  console.log(`   • ${3} Comments`);
  console.log(`   • ${3} Likes\n`);

  // Seed irrigation data
  console.log('🌊 Seeding irrigation data...');
  await seedIrrigationData();
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
