const axios = require('axios');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

console.log('🧪 Teste Completo de Notificações com Banco de Dados');
console.log('====================================================\n');

async function testCompleteNotifications() {
  try {
    console.log('🚀 Enviando notificações completas...\n');

    // 1. Teste de notificação de bomba
    console.log('💧 Enviando notificação de bomba ativada...');
    const pumpResponse = await axios.post(`${API_BASE_URL}/test-notifications/pump-activated`, {
      duration: 45,
      waterAmount: 3.0,
      reason: 'Teste de irrigação automática',
      greenhouseId: 'test-greenhouse',
      userId: 'test-user-id'
    });

    console.log('✅ Resposta da bomba:', pumpResponse.data.message);
    console.log('   - ID salvo no banco:', pumpResponse.data.notification.id);
    console.log('   - Duração:', pumpResponse.data.notification.data.duration + 's');
    console.log('   - Quantidade:', pumpResponse.data.notification.data.waterAmount + 'L');

    await new Promise(resolve => setTimeout(resolve, 3000));

    // 2. Teste de notificação de irrigação detectada
    console.log('\n🌱 Enviando notificação de irrigação detectada...');
    const irrigationResponse = await axios.post(`${API_BASE_URL}/test-notifications/irrigation-detected`, {
      moistureIncrease: 22.5,
      previousMoisture: 28.0,
      currentMoisture: 50.5,
      greenhouseId: 'test-greenhouse',
      userId: 'test-user-id'
    });

    console.log('✅ Resposta da irrigação:', irrigationResponse.data.message);
    console.log('   - ID salvo no banco:', irrigationResponse.data.notification.id);
    console.log('   - Aumento de umidade:', irrigationResponse.data.notification.data.moistureIncrease + '%');
    console.log('   - Umidade anterior:', irrigationResponse.data.notification.data.previousMoisture + '%');
    console.log('   - Umidade atual:', irrigationResponse.data.notification.data.currentMoisture + '%');

    await new Promise(resolve => setTimeout(resolve, 3000));

    // 3. Teste de notificação de confirmação
    console.log('\n✅ Enviando notificação de irrigação confirmada...');
    const confirmationResponse = await axios.post(`${API_BASE_URL}/test-notifications/irrigation-confirmed`, {
      waterAmount: 4.0,
      notes: 'Teste de confirmação manual',
      greenhouseId: 'test-greenhouse',
      userId: 'test-user-id'
    });

    console.log('✅ Resposta da confirmação:', confirmationResponse.data.message);
    console.log('   - ID salvo no banco:', confirmationResponse.data.notification.id);
    console.log('   - Quantidade confirmada:', confirmationResponse.data.notification.data.waterAmount + 'L');
    console.log('   - Observações:', confirmationResponse.data.notification.data.notes);

    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('\n📊 Resumo dos Testes:');
    console.log('====================');
    console.log('✅ Notificação de bomba enviada e salva no banco');
    console.log('✅ Notificação de irrigação detectada enviada e salva no banco');
    console.log('✅ Notificação de confirmação enviada e salva no banco');

    console.log('\n🎉 Testes de notificação concluídos!');
    console.log('\n🌐 Para testar no frontend:');
    console.log(`1. Acesse: ${FRONTEND_URL}/dashboard`);
    console.log('2. Verifique se as notificações aparecem no sino (🔔) no canto superior direito');
    console.log('3. Clique no sino para ver todas as notificações');
    console.log('4. Teste o botão "Marcar como lida"');
    console.log('5. Verifique se o contador diminui ao marcar como lida');
    console.log('\n🔊 Recursos implementados:');
    console.log('   - Som de notificação (se disponível)');
    console.log('   - Contador de notificações não lidas (9+ se > 9)');
    console.log('   - Persistência no banco de dados');
    console.log('   - Tempo relativo (x s, y m, z h)');
    console.log('   - Botão para marcar como lida');
    console.log('   - Notificações persistem até serem lidas');

    console.log('\n✅ Teste completo concluído!');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.response?.data || error.message);
  }
}

// Executar teste
testCompleteNotifications();
