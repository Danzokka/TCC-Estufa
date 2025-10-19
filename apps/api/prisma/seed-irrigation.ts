import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedIrrigationData() {
  console.log('🌱 Iniciando seed de dados de irrigação...');

  try {
    // Buscar ou criar usuário de teste
    let testUser = await prisma.user.findFirst({
      where: { username: 'test-user' },
    });

    if (!testUser) {
      testUser = await prisma.user.create({
        data: {
          username: 'test-user',
          name: 'Usuário de Teste',
          email: 'test@example.com',
          image: '',
          password: 'test-password',
        },
      });
      console.log('✅ Usuário de teste criado');
    }

    // Buscar ou criar estufa de teste
    let testGreenhouse = await prisma.greenhouse.findFirst({
      where: { name: 'Estufa de Teste' },
    });

    if (!testGreenhouse) {
      testGreenhouse = await prisma.greenhouse.create({
        data: {
          name: 'Estufa de Teste',
          description: 'Estufa para testes de irrigação',
          location: 'Laboratório',
          ownerId: testUser.id,
          currentTemperature: 25.5,
          currentHumidity: 65.0,
          currentSoilMoisture: 45,
          currentLightIntensity: 80.0,
          currentWaterLevel: 75.0,
          isOnline: true,
          isConfigured: true,
        },
      });
      console.log('✅ Estufa de teste criada');
    }

    // Buscar ou criar planta de teste
    let testPlant = await prisma.plant.findFirst({
      where: { name: 'Tomate' },
    });

    if (!testPlant) {
      testPlant = await prisma.plant.create({
        data: {
          name: 'Tomate',
          description: 'Planta de tomate para testes',
          air_temperature_initial: 25.0,
          air_humidity_initial: 60.0,
          soil_moisture_initial: 50,
          soil_temperature_initial: 22.0,
          light_intensity_initial: 70.0,
          air_temperature_final: 28.0,
          air_humidity_final: 65.0,
          soil_moisture_final: 45,
          soil_temperature_final: 24.0,
          light_intensity_final: 75.0,
        },
      });
      console.log('✅ Planta de teste criada');
    }

    // Criar leituras de sensor para associar às irrigações
    const sensorReadings: any[] = [];
    for (let i = 0; i < 10; i++) {
      const reading = await prisma.greenhouseSensorReading.create({
        data: {
          greenhouseId: testGreenhouse.id,
          airTemperature: 25 + Math.random() * 5,
          airHumidity: 60 + Math.random() * 10,
          soilMoisture: 40 + Math.random() * 20,
          soilTemperature: 22 + Math.random() * 3,
          lightIntensity: 70 + Math.random() * 20,
          waterLevel: 70 + Math.random() * 20,
          waterReserve: 50 + Math.random() * 30,
          timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000), // Últimos 10 dias
        },
      });
      sensorReadings.push(reading);
    }

    // Criar irrigações de teste
    const irrigations: any[] = [];

    // 1. Irrigação automática (bomba ativada)
    irrigations.push(
      await prisma.irrigation.create({
        data: {
          type: 'automatic',
          waterAmount: 2.5,
          notes: 'Irrigação automática - bomba ativada por sensor de umidade',
          greenhouseId: testGreenhouse.id,
          plantId: testPlant.id,
          sensorId: sensorReadings[0].id,
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 dia atrás
        },
      }),
    );

    // 2. Irrigação manual
    irrigations.push(
      await prisma.irrigation.create({
        data: {
          type: 'manual',
          waterAmount: 1.5,
          notes: 'Irrigação manual - usuário regou as plantas',
          greenhouseId: testGreenhouse.id,
          userId: testUser.id,
          plantId: testPlant.id,
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 dias atrás
        },
      }),
    );

    // 3. Irrigação detectada (ainda não confirmada)
    irrigations.push(
      await prisma.irrigation.create({
        data: {
          type: 'detected',
          notes: 'Aumento de umidade detectado - aguardando confirmação',
          greenhouseId: testGreenhouse.id,
          plantId: testPlant.id,
          sensorId: sensorReadings[2].id,
          createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 horas atrás
        },
      }),
    );

    // 4. Irrigação por chuva
    irrigations.push(
      await prisma.irrigation.create({
        data: {
          type: 'rain',
          waterAmount: 3.0,
          notes: 'Chuva natural - 3mm de precipitação',
          greenhouseId: testGreenhouse.id,
          plantId: testPlant.id,
          sensorId: sensorReadings[3].id,
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 dias atrás
        },
      }),
    );

    // 5. Outra irrigação automática
    irrigations.push(
      await prisma.irrigation.create({
        data: {
          type: 'automatic',
          waterAmount: 1.8,
          notes: 'Sistema automático - umidade do solo baixa',
          greenhouseId: testGreenhouse.id,
          plantId: testPlant.id,
          sensorId: sensorReadings[4].id,
          createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 dias atrás
        },
      }),
    );

    // 6. Irrigação manual recente
    irrigations.push(
      await prisma.irrigation.create({
        data: {
          type: 'manual',
          waterAmount: 2.0,
          notes: 'Rega manual - plantas estavam secas',
          greenhouseId: testGreenhouse.id,
          userId: testUser.id,
          plantId: testPlant.id,
          createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 horas atrás
        },
      }),
    );

    // 7. Irrigação detectada (mais antiga)
    irrigations.push(
      await prisma.irrigation.create({
        data: {
          type: 'detected',
          notes: 'Detecção de irrigação - possível vazamento',
          greenhouseId: testGreenhouse.id,
          plantId: testPlant.id,
          sensorId: sensorReadings[5].id,
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 dias atrás
        },
      }),
    );

    // 8. Irrigação automática com mais água
    irrigations.push(
      await prisma.irrigation.create({
        data: {
          type: 'automatic',
          waterAmount: 3.2,
          notes: 'Sistema automático - temperatura alta, mais água necessária',
          greenhouseId: testGreenhouse.id,
          plantId: testPlant.id,
          sensorId: sensorReadings[6].id,
          createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 dias atrás
        },
      }),
    );

    // 9. Irrigação manual de emergência
    irrigations.push(
      await prisma.irrigation.create({
        data: {
          type: 'manual',
          waterAmount: 4.0,
          notes: 'Rega de emergência - plantas muito secas',
          greenhouseId: testGreenhouse.id,
          userId: testUser.id,
          plantId: testPlant.id,
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 dias atrás
        },
      }),
    );

    // 10. Irrigação por chuva forte
    irrigations.push(
      await prisma.irrigation.create({
        data: {
          type: 'rain',
          waterAmount: 5.5,
          notes: 'Chuva forte - 5.5mm de precipitação',
          greenhouseId: testGreenhouse.id,
          plantId: testPlant.id,
          sensorId: sensorReadings[7].id,
          createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 dias atrás
        },
      }),
    );

    console.log(`✅ ${irrigations.length} irrigações de teste criadas`);

    // Criar notificações relacionadas às irrigações
    const notifications: any[] = [];

    // Notificação de bomba ativada
    notifications.push(
      await prisma.notification.create({
        data: {
          userId: testUser.id,
          type: 'pump_activated',
          title: 'Bomba Ativada',
          message: `Bomba ativada por 45s, liberando 2.5L de água`,
          data: {
            irrigationId: irrigations[0].id,
            duration: 45,
            waterAmount: 2.5,
            reason: 'Irrigação automática - sensor de umidade',
            greenhouseId: testGreenhouse.id,
            timestamp: new Date().toISOString(),
          },
          isRead: false,
        },
      }),
    );

    // Notificação de irrigação detectada
    notifications.push(
      await prisma.notification.create({
        data: {
          userId: testUser.id,
          type: 'irrigation_detected',
          title: 'Irrigação Detectada',
          message: 'Detectado aumento de 25% na umidade do solo',
          data: {
            irrigationId: irrigations[2].id,
            moistureIncrease: 25,
            greenhouseId: testGreenhouse.id,
            timestamp: new Date().toISOString(),
          },
          isRead: false,
        },
      }),
    );

    // Notificação de irrigação confirmada
    notifications.push(
      await prisma.notification.create({
        data: {
          userId: testUser.id,
          type: 'irrigation_confirmed',
          title: 'Irrigação Confirmada',
          message: 'Irrigação manual confirmada - 1.5L de água',
          data: {
            irrigationId: irrigations[1].id,
            waterAmount: 1.5,
            type: 'manual',
            greenhouseId: testGreenhouse.id,
            timestamp: new Date().toISOString(),
          },
          isRead: true,
        },
      }),
    );

    console.log(`✅ ${notifications.length} notificações de teste criadas`);

    // Estatísticas finais
    const stats = await prisma.irrigation.aggregate({
      where: { greenhouseId: testGreenhouse.id },
      _count: { id: true },
      _sum: { waterAmount: true },
    });

    console.log('📊 Estatísticas das irrigações:');
    console.log(`   Total de irrigações: ${stats._count.id}`);
    console.log(`   Total de água: ${stats._sum.waterAmount || 0}L`);
    console.log(`   Estufa: ${testGreenhouse.name}`);
    console.log(`   Usuário: ${testUser.name}`);

    console.log('🎉 Seed de irrigação concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro durante o seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o seed se chamado diretamente
if (require.main === module) {
  seedIrrigationData().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export { seedIrrigationData };
