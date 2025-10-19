const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTest() {
  console.log('🔔 Teste de Notificações em Tempo Real');
  console.log('======================================');
  console.log('⚠️  IMPORTANTE: Mantenha o frontend aberto em http://localhost:3000/dashboard');
  console.log('⚠️  Você deve ouvir um som para cada notificação que chegar!');
  console.log('');

  console.log('📝 Enviando notificações com intervalos de 5 segundos...');
  console.log('⏰ Aguarde 5 segundos entre cada notificação...');
  console.log('');

  const notifications = [
    {
      name: 'Bomba Ativada',
      endpoint: 'pump-activated',
      data: {
        userId: 'test-user-id',
        greenhouseId: 'test-greenhouse-id-1',
        duration: 45,
        waterAmount: 3.0,
        reason: 'Irrigação automática - Tomate'
      }
    },
    {
      name: 'Irrigação Detectada',
      endpoint: 'irrigation-detected',
      data: {
        userId: 'test-user-id',
        greenhouseId: 'test-greenhouse-id-1',
        moistureIncrease: 22.5,
        previousMoisture: 28.0,
        currentMoisture: 50.5
      }
    },
    {
      name: 'Confirmação Manual',
      endpoint: 'irrigation-confirmed',
      data: {
        userId: 'test-user-id',
        greenhouseId: 'test-greenhouse-id-1',
        id: 'irrigation-123',
        waterAmount: 4.0,
        notes: 'Rega manual - Manhã'
      }
    },
    {
      name: 'Alerta de Sistema',
      endpoint: 'pump-activated',
      data: {
        userId: 'test-user-id',
        greenhouseId: 'test-greenhouse-id-1',
        duration: 0,
        waterAmount: 0,
        reason: 'Alerta: Sensor de umidade offline'
      }
    },
    {
      name: 'Manutenção Programada',
      endpoint: 'pump-activated',
      data: {
        userId: 'test-user-id',
        greenhouseId: 'test-greenhouse-id-1',
        duration: 30,
        waterAmount: 2.5,
        reason: 'Manutenção: Limpeza do sistema'
      }
    }
  ];

  for (let i = 0; i < notifications.length; i++) {
    const notification = notifications[i];

    try {
      console.log(`\n${i + 1}️⃣ Enviando: ${notification.name}...`);

      await axios.post(`${API_BASE_URL}/test-notifications/${notification.endpoint}`, notification.data);

      console.log(`✅ ${notification.name} enviada! 🔊 Aguarde o som...`);

      // Aguardar 5 segundos antes da próxima (exceto na última)
      if (i < notifications.length - 1) {
        console.log('⏳ Aguardando 5 segundos para próxima notificação...');
        await delay(5000);
      }

    } catch (error) {
      console.error(`❌ Erro ao enviar ${notification.name}:`, error.message);
    }
  }

  console.log('\n📊 Resumo do Teste:');
  console.log('✅ 5 notificações enviadas com intervalos de 5 segundos');
  console.log('🔊 Cada notificação deve ter tocado um som individual');
  console.log('📱 Verifique o sino (🔔) no frontend para ver todas as notificações');

  console.log('\n🎯 O que você deve ter observado:');
  console.log('   - 5 sons diferentes (um para cada notificação)');
  console.log('   - Notificações aparecendo no sino em tempo real');
  console.log('   - Badge com contador de notificações não lidas');
  console.log('   - Interface animada com Magic UI');

  console.log('\n✅ Teste de notificações em tempo real concluído!');
  console.log('💡 Dica: Dê refresh na página para verificar a persistência!');
}

runTest();
