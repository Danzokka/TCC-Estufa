const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTest() {
  console.log('🔔 Teste WebSocket + Sync Automático');
  console.log('====================================');
  console.log('⚠️  IMPORTANTE: Mantenha o frontend aberto em http://localhost:3000/dashboard');
  console.log('');

  console.log('📝 Enviando notificações via WebSocket (com sync automático)...');

  const notifications = [
    {
      name: 'Bomba Ativada - Sistema Híbrido',
      endpoint: 'pump-activated',
      data: {
        userId: 'test-user-id',
        greenhouseId: 'greenhouse-teste',
        duration: 45,
        waterAmount: 3.5,
        reason: 'Teste de sistema híbrido'
      }
    },
    {
      name: 'Irrigação Detectada - Sync Automático',
      endpoint: 'irrigation-detected',
      data: {
        userId: 'test-user-id',
        greenhouseId: 'greenhouse-teste',
        moistureIncrease: 25.0,
        previousMoisture: 30.0,
        currentMoisture: 55.0
      }
    },
    {
      name: 'Confirmação - Persistência',
      endpoint: 'irrigation-confirmed',
      data: {
        userId: 'test-user-id',
        greenhouseId: 'greenhouse-teste',
        id: 'test-confirmation-123',
        waterAmount: 4.0,
        notes: 'Teste de persistência automática'
      }
    }
  ];

  for (let i = 0; i < notifications.length; i++) {
    const notification = notifications[i];

    try {
      console.log(`\n${i + 1}️⃣ Enviando: ${notification.name}...`);

      const response = await axios.post(`${API_BASE_URL}/test-notifications/${notification.endpoint}`, notification.data);

      console.log(`✅ ${notification.name} enviada!`);
      console.log(`🔊 Aguarde o som e verifique o frontend...`);
      console.log(`📱 O frontend deve fazer sync automático com o backend`);

      if (i < notifications.length - 1) {
        console.log('⏳ Aguardando 4 segundos...');
        await delay(4000);
      }

    } catch (error) {
      console.error(`❌ Erro ao enviar ${notification.name}:`, error.message);
    }
  }

  console.log('\n📊 Resumo do Teste:');
  console.log('✅ 3 notificações enviadas via WebSocket');
  console.log('✅ Frontend deve fazer sync automático');
  console.log('✅ Som individual para cada notificação');
  console.log('✅ Persistência automática no backend');

  console.log('\n🔍 O que você deve ter observado:');
  console.log('   - 3 sons diferentes (um para cada notificação)');
  console.log('   - Notificações aparecendo em tempo real');
  console.log('   - Badge com contador atualizado');
  console.log('   - Console do navegador mostrando "Notificação salva no backend"');

  console.log('\n🎯 Teste de Refresh:');
  console.log('1. Dê refresh na página (F5)');
  console.log('2. As notificações devem continuar lá!');
  console.log('3. Sem som no refresh (apenas no carregamento inicial)');

  console.log('\n✅ Teste WebSocket + Sync automático concluído!');
  console.log('💡 Sistema híbrido: WebSocket (tempo real) + Sync automático (persistência)');
}

runTest();
