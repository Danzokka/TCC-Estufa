/**
 * Script para testar notificação de predição LSTM no frontend
 * Este script envia uma notificação de teste para o endpoint /irrigation/ai/prediction
 * para verificar como a notificação aparece na interface
 */

import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

interface PredictionData {
  greenhouseId: string;
  userPlantId: string;
  predictedSoilMoisture: number;
  currentSoilMoisture: number;
  hoursUntilDry: number;
  confidence: number;
  recommendations: string[];
}

async function sendTestPredictionNotification() {
  try {
    console.log('🧪 Iniciando teste de notificação de predição LSTM...\n');

    // 1. Buscar greenhouse e userPlant ativos
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
      },
    });

    if (
      !greenhouse ||
      !greenhouse.userPlants ||
      greenhouse.userPlants.length === 0
    ) {
      console.error('❌ Greenhouse ou planta não encontrados');
      return;
    }

    const userPlant = greenhouse.userPlants[0];

    console.log('📍 Dados encontrados:');
    console.log(`   Greenhouse: ${greenhouse.name} (${greenhouse.id})`);
    console.log(`   Planta: ${userPlant.plant.name} (${userPlant.id})`);
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

    const currentSoilMoisture = latestSensor?.soilMoisture || 45.0;

    console.log('📊 Última leitura de sensor:');
    console.log(`   Umidade do solo atual: ${currentSoilMoisture}%`);
    console.log('');

    // 3. Criar dados de predição de teste
    // Simular que o solo vai secar em 6 horas
    const predictionData: PredictionData = {
      greenhouseId: greenhouse.id,
      userPlantId: userPlant.id,
      predictedSoilMoisture: 18.5, // Abaixo do limite crítico (20%)
      currentSoilMoisture: currentSoilMoisture,
      hoursUntilDry: 6,
      confidence: 0.87, // 87% de confiança
      recommendations: [
        'Preparar irrigação preventiva nas próximas 4-5 horas',
        'Monitorar umidade do solo com atenção',
        'Verificar sistema de irrigação automática',
      ],
    };

    console.log('🤖 Dados de predição (simulados):');
    console.log(
      `   Umidade prevista: ${predictionData.predictedSoilMoisture}%`,
    );
    console.log(`   Horas até secar: ${predictionData.hoursUntilDry}h`);
    console.log(
      `   Confiança: ${(predictionData.confidence * 100).toFixed(0)}%`,
    );
    console.log('');

    // 4. Enviar para a API
    const apiUrl = process.env.API_URL || 'http://localhost:5000';
    const endpoint = `${apiUrl}/irrigation/ai/prediction`;

    console.log('📤 Enviando notificação para:');
    console.log(`   ${endpoint}`);
    console.log('');

    const response = await axios.post(endpoint, predictionData, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    console.log('✅ Notificação enviada com sucesso!');
    console.log('');
    console.log('📋 Resposta da API:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('');

    // 5. Verificar se a notificação foi criada
    const notification = await prisma.notification.findFirst({
      where: {
        userId: greenhouse.ownerId,
        type: 'lstm_prediction',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (notification) {
      console.log('🔔 Notificação criada no banco de dados:');
      console.log(`   ID: ${notification.id}`);
      console.log(`   Tipo: ${notification.type}`);
      console.log(`   Título: ${notification.title}`);
      console.log(`   Mensagem: ${notification.message}`);
      console.log(
        `   Criada em: ${notification.createdAt.toLocaleString('pt-BR')}`,
      );
      console.log(`   Lida: ${notification.isRead ? 'Sim' : 'Não'}`);
      console.log('');
      console.log('✅ Agora você pode verificar a notificação no frontend!');
      console.log(
        '   Acesse: http://localhost:3000 e clique no ícone de notificações',
      );
    } else {
      console.log('⚠️  Notificação não encontrada no banco de dados');
    }
  } catch (error) {
    console.error('❌ Erro ao enviar notificação de teste:');
    if (axios.isAxiosError(error)) {
      console.error('   Status:', error.response?.status);
      console.error('   Mensagem:', error.response?.data);
    } else {
      console.error('   Erro:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Executar teste
sendTestPredictionNotification()
  .then(() => {
    console.log('');
    console.log('🎉 Teste concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });
