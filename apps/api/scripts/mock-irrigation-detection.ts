import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function mockIrrigationDetection() {
  try {
    console.log('🌱 Iniciando teste de detecção de irrigação...\n');

    // 1. Buscar uma estufa e userPlant existentes
    const userPlant = await prisma.userPlant.findFirst({
      include: {
        user: true,
        plant: true,
      },
    });

    if (!userPlant) {
      console.log('❌ Nenhum UserPlant encontrado. Criando um para teste...');

      // Buscar um usuário e planta
      const user = await prisma.user.findFirst();
      const plant = await prisma.plant.findFirst();

      if (!user || !plant) {
        throw new Error('Usuário ou planta não encontrados no banco');
      }

      const newUserPlant = await prisma.userPlant.create({
        data: {
          userId: user.id,
          plantId: plant.id,
          nickname: 'Tomates',
        },
        include: {
          user: true,
          plant: true,
        },
      });

      console.log(`✅ UserPlant criado: ${newUserPlant.nickname}\n`);
      return mockIrrigationDetection(); // Tentar novamente
    }

    console.log(
      `📍 Usando UserPlant: ${userPlant.nickname || userPlant.plant.name}`,
    );
    console.log(`👤 Usuário: ${userPlant.user.name}\n`);

    // 2. Enviar dados de sensor via endpoint (simulando ESP32)
    const baseUrl = process.env.API_URL || 'http://localhost:5000';

    console.log('📡 Enviando dados de sensor via API...\n');

    // Primeira leitura - umidade baixa
    const firstResponse = await fetch(`${baseUrl}/sensor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        air_temperature: 25.0,
        air_humidity: 60.0,
        soil_temperature: 22.0,
        soil_moisture: 30, // Umidade baixa
        light_intensity: 500.0,
        water_level: 80.0,
        water_reserve: 100.0,
        userPlant: userPlant.id,
      }),
    });

    if (!firstResponse.ok) {
      throw new Error(
        `Erro ao enviar primeira leitura: ${firstResponse.status}`,
      );
    }

    console.log('📊 Primeira leitura enviada:');
    console.log(`   Umidade do solo: 30%`);
    console.log(`   Timestamp: ${new Date().toISOString()}\n`);

    // Aguardar um pouco
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Segunda leitura - aumento significativo de umidade
    const secondResponse = await fetch(`${baseUrl}/sensor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        air_temperature: 25.5,
        air_humidity: 62.0,
        soil_temperature: 22.5,
        soil_moisture: 55, // Aumento de 25%!
        light_intensity: 510.0,
        water_level: 80.0,
        water_reserve: 100.0,
        userPlant: userPlant.id,
      }),
    });

    if (!secondResponse.ok) {
      throw new Error(
        `Erro ao enviar segunda leitura: ${secondResponse.status}`,
      );
    }

    const moistureIncrease = 55 - 30;

    console.log('📊 Segunda leitura enviada:');
    console.log(`   Umidade do solo: 55%`);
    console.log(`   Aumento detectado: +${moistureIncrease}%`);
    console.log(`   Timestamp: ${new Date().toISOString()}\n`);

    // 3. Aguardar um pouco para processamento
    console.log('⏳ Aguardando processamento...\n');
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // 4. Verificar se há irrigação detectada criada
    const detectedIrrigation = await prisma.irrigation.findFirst({
      where: {
        type: 'detected',
        createdAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000), // Últimos 5 minutos
        },
      },
    });

    if (detectedIrrigation) {
      console.log('✅ Irrigação detectada criada com sucesso!');
      console.log(`   ID: ${detectedIrrigation.id}`);
      console.log(`   Tipo: ${detectedIrrigation.type}`);
      console.log(`   Notas: ${detectedIrrigation.notes}`);
      console.log(`   Criada em: ${detectedIrrigation.createdAt}\n`);
    } else {
      console.log(
        '⚠️  Nenhuma irrigação detectada foi criada automaticamente.',
      );
      console.log('   Isso pode significar que o threshold não foi atingido');
      console.log('   ou o serviço de detecção não está rodando.\n');
    }

    // 5. Verificar notificações criadas
    const notification = await prisma.notification.findFirst({
      where: {
        userId: userPlant.userId,
        type: 'irrigation_detected',
        createdAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (notification) {
      console.log('✅ Notificação criada com sucesso!');
      console.log(`   ID: ${notification.id}`);
      console.log(`   Título: ${notification.title}`);
      console.log(`   Mensagem: ${notification.message}`);
      console.log(`   Tipo: ${notification.type}`);
      console.log(`   Lida: ${notification.isRead ? 'Sim' : 'Não'}`);
      console.log(`   Criada em: ${notification.createdAt}\n`);
    } else {
      console.log('⚠️  Nenhuma notificação foi criada.');
      console.log(
        '   Verifique se o NotificationGeneratorService está configurado.\n',
      );
    }

    console.log('✅ Teste concluído com sucesso!\n');
    console.log('📝 Próximos passos:');
    console.log('   1. Verifique o frontend em /dashboard/irrigation');
    console.log('   2. Verifique as notificações no centro de notificações');
    console.log('   3. Teste o fluxo de confirmação de irrigação detectada\n');
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o teste
mockIrrigationDetection()
  .then(() => {
    console.log('🎉 Script finalizado!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });
