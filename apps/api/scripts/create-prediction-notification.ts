/**
 * Script para criar notificação de predição LSTM diretamente no banco
 * Este script cria a notificação diretamente sem precisar da API rodando
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestPredictionNotification() {
  try {
    console.log('🧪 Criando notificação de predição LSTM de teste...\n');

    // 1. Buscar greenhouse e owner
    const greenhouse = await prisma.greenhouse.findFirst({
      where: {
        id: 'f28ed112-f59c-47ac-a43b-4138f656f93e',
      },
      include: {
        userPlants: {
          include: {
            plant: true,
          },
        },
        owner: true,
      },
    });

    if (!greenhouse) {
      console.error('❌ Greenhouse não encontrado');
      return;
    }

    const userPlant = greenhouse.userPlants[0];

    console.log('📍 Dados encontrados:');
    console.log(`   Greenhouse: ${greenhouse.name} (${greenhouse.id})`);
    console.log(`   Dono: ${greenhouse.owner.name} (${greenhouse.owner.id})`);
    if (userPlant) {
      console.log(`   Planta: ${userPlant.plant.name} (${userPlant.id})`);
    }
    console.log('');

    // 2. Buscar última leitura de sensor
    const latestSensor = await prisma.greenhouseSensorReading.findFirst({
      where: {
        greenhouseId: greenhouse.id,
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    const currentSoilMoisture = latestSensor?.soilMoisture || 45;

    console.log('📊 Última leitura de sensor:');
    console.log(`   Umidade do solo atual: ${currentSoilMoisture}%`);
    console.log(`   Temperatura: ${latestSensor?.airTemperature || 'N/A'}°C`);
    console.log(`   Umidade do ar: ${latestSensor?.airHumidity || 'N/A'}%`);
    console.log('');

    // 3. Criar notificação de predição
    const predictedSoilMoisture = 18.5; // Abaixo do limite crítico
    const hoursUntilDry = 6;
    const confidence = 0.87; // 87%

    console.log('🤖 Criando notificação com dados de predição:');
    console.log(`   Umidade atual: ${currentSoilMoisture}%`);
    console.log(`   Umidade prevista: ${predictedSoilMoisture}%`);
    console.log(`   Horas até secar: ${hoursUntilDry}h`);
    console.log(`   Confiança: ${(confidence * 100).toFixed(0)}%`);
    console.log('');

    const notification = await prisma.notification.create({
      data: {
        userId: greenhouse.ownerId,
        type: 'lstm_prediction',
        title: 'Alerta',
        message: `Prevemos que a umidade do solo cairá para ${predictedSoilMoisture}% nas próximas ${hoursUntilDry} horas. Irrigação preventiva recomendada.`,
        data: {
          greenhouseId: greenhouse.id,
          userPlantId: userPlant?.id,
          plantName: userPlant?.plant.name,
          currentSoilMoisture,
          predictedSoilMoisture,
          hoursUntilDry,
          confidence,
          recommendations: [
            'Preparar irrigação preventiva nas próximas 4-5 horas',
            'Monitorar umidade do solo com atenção redobrada',
            'Verificar se o sistema de irrigação automática está funcionando',
          ],
          timestamp: new Date().toISOString(),
        },
        isRead: false,
      },
    });

    console.log('✅ Notificação criada com sucesso no banco de dados!');
    console.log('');
    console.log('🔔 Detalhes da notificação:');
    console.log(`   ID: ${notification.id}`);
    console.log(`   Tipo: ${notification.type}`);
    console.log(`   Título: ${notification.title}`);
    console.log(`   Mensagem: ${notification.message}`);
    console.log(
      `   Criada em: ${notification.createdAt.toLocaleString('pt-BR')}`,
    );
    console.log(`   Lida: ${notification.isRead ? 'Sim' : 'Não'}`);
    console.log('');
    console.log('✨ Dados adicionais:');
    console.log(JSON.stringify(notification.data, null, 2));
    console.log('');
    console.log('🎉 Agora você pode verificar a notificação no frontend!');
    console.log('   1. Acesse: http://localhost:3000');
    console.log('   2. Faça login se necessário');
    console.log(
      '   3. Clique no ícone de notificações (🔔) no canto superior direito',
    );
    console.log(
      '   4. Você verá a notificação com o ícone de cérebro (🧠) do LSTM',
    );
    console.log('');
    console.log('💡 A notificação aparecerá com:');
    console.log('   • Ícone: BrainCircuit (cérebro com circuitos)');
    console.log('   • Cor: Roxo/Azul (tema de IA)');
    console.log('   • Badge: "lstm_prediction"');
  } catch (error) {
    console.error('❌ Erro ao criar notificação de teste:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar teste
createTestPredictionNotification()
  .then(() => {
    console.log('');
    console.log('🎊 Teste concluído com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });
