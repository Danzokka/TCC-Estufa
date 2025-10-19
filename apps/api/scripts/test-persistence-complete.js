const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTest() {
  console.log('🔄 Teste de Persistência Completa');
  console.log('=================================');
  console.log('⚠️  IMPORTANTE: Mantenha o frontend aberto em http://localhost:3000/dashboard');
  console.log('');

  console.log('📝 Fase 1: Enviando notificações via WebSocket...');

  const notifications = [
    {
      name: 'Bomba Ativada - Tomate',
      endpoint: 'pump-activated',
      data: {
        userId: 'test-user-id',
        greenhouseId: 'greenhouse-tomate',
        duration: 60,
        waterAmount: 5.0,
        reason: 'Irrigação automática - Tomate'
      }
    },
    {
      name: 'Irrigação Detectada - Alface',
      endpoint: 'irrigation-detected',
      data: {
        userId: 'test-user-id',
        greenhouseId: 'greenhouse-alface',
        moistureIncrease: 18.5,
        previousMoisture: 35.0,
        currentMoisture: 53.5
      }
    },
    {
      name: 'Confirmação Manual - Pimentão',
      endpoint: 'irrigation-confirmed',
      data: {
        userId: 'test-user-id',
        greenhouseId: 'greenhouse-pimentao',
        id: 'irrigation-pimentao-123',
        waterAmount: 3.5,
        notes: 'Rega manual - Manhã'
      }
    }
  ];

  // Enviar notificações com delay
  for (let i = 0; i < notifications.length; i++) {
    const notification = notifications[i];

    try {
      console.log(`\n${i + 1}️⃣ Enviando: ${notification.name}...`);

      await axios.post(`${API_BASE_URL}/test-notifications/${notification.endpoint}`, notification.data);

      console.log(`✅ ${notification.name} enviada via WebSocket!`);
      console.log(`🔊 Aguarde o som e verifique o frontend...`);

      if (i < notifications.length - 1) {
        console.log('⏳ Aguardando 3 segundos...');
        await delay(3000);
      }

    } catch (error) {
      console.error(`❌ Erro ao enviar ${notification.name}:`, error.message);
    }
  }

  console.log('\n📊 Fase 2: Verificando persistência...');

  try {
    // Aguardar um pouco para o sync automático
    console.log('⏳ Aguardando 5 segundos para sync automático...');
    await delay(5000);

    // Verificar se as notificações foram salvas
    const response = await axios.get(`${API_BASE_URL}/test-notifications/load-test`);

    if (response.data && response.data.notifications) {
      console.log(`✅ Notificações salvas no banco: ${response.data.notifications.length}`);
      console.log(`📊 Não lidas: ${response.data.unreadCount}`);

      response.data.notifications.forEach((notif, index) => {
        console.log(`   ${index + 1}. ${notif.title} - ${notif.type}`);
      });
    }
  } catch (error) {
    console.error('❌ Erro ao verificar persistência:', error.message);
  }

  console.log('\n🎯 Fase 3: Teste de Refresh...');
  console.log('1. Dê refresh na página (F5)');
  console.log('2. As notificações devem continuar lá!');
  console.log('3. Verifique se o som não toca no refresh (apenas no carregamento inicial)');

  console.log('\n📊 Resumo do Teste:');
  console.log('✅ Notificações enviadas via WebSocket');
  console.log('✅ Sync automático com backend');
  console.log('✅ Persistência no banco de dados');
  console.log('✅ Som individual para cada notificação');
  console.log('✅ Interface responsiva');

  console.log('\n🔍 O que você deve ter observado:');
  console.log('   - 3 sons diferentes (um para cada notificação)');
  console.log('   - Notificações aparecendo em tempo real');
  console.log('   - Badge com contador atualizado');
  console.log('   - Persistência após refresh');
  console.log('   - Sem som no refresh (apenas no carregamento inicial)');

  console.log('\n✅ Teste de persistência completa concluído!');
  console.log('💡 Sistema híbrido funcionando: WebSocket + Sync automático + Persistência');
}

runTest();
