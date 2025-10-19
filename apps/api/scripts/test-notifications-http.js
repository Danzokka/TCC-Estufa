const axios = require('axios');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

console.log('🧪 Teste de Notificações via HTTP');
console.log('==================================\n');

async function testNotificationsViaHTTP() {
  try {
    console.log('🚀 Enviando notificações via endpoints HTTP...\n');

    // 1. Teste de notificação de bomba
    console.log('💧 Enviando notificação de bomba ativada...');
    const pumpResponse = await axios.post(`${API_BASE_URL}/test-notifications/pump-activated`, {
      duration: 45,
      waterAmount: 3.0,
      reason: 'Teste de irrigação automática',
      greenhouseId: 'test-greenhouse'
    });

    console.log('✅ Resposta da bomba:', pumpResponse.data.message);
    console.log('   - Duração:', pumpResponse.data.notification.data.duration + 's');
    console.log('   - Quantidade:', pumpResponse.data.notification.data.waterAmount + 'L');

    await new Promise(resolve => setTimeout(resolve, 2000));

    // 2. Teste de notificação de irrigação detectada
    console.log('\n🌱 Enviando notificação de irrigação detectada...');
    const irrigationResponse = await axios.post(`${API_BASE_URL}/test-notifications/irrigation-detected`, {
      moistureIncrease: 22.5,
      previousMoisture: 28.0,
      currentMoisture: 50.5,
      greenhouseId: 'test-greenhouse'
    });

    console.log('✅ Resposta da irrigação:', irrigationResponse.data.message);
    console.log('   - Aumento de umidade:', irrigationResponse.data.notification.data.moistureIncrease + '%');
    console.log('   - Umidade anterior:', irrigationResponse.data.notification.data.previousMoisture + '%');
    console.log('   - Umidade atual:', irrigationResponse.data.notification.data.currentMoisture + '%');

    await new Promise(resolve => setTimeout(resolve, 2000));

    // 3. Teste de notificação de confirmação
    console.log('\n✅ Enviando notificação de irrigação confirmada...');
    const confirmationResponse = await axios.post(`${API_BASE_URL}/test-notifications/irrigation-confirmed`, {
      waterAmount: 4.0,
      notes: 'Teste de confirmação manual',
      greenhouseId: 'test-greenhouse'
    });

    console.log('✅ Resposta da confirmação:', confirmationResponse.data.message);
    console.log('   - Quantidade confirmada:', confirmationResponse.data.notification.data.waterAmount + 'L');
    console.log('   - Observações:', confirmationResponse.data.notification.data.notes);

    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('\n📊 Resumo dos Testes:');
    console.log('====================');
    console.log('✅ Notificação de bomba enviada via HTTP');
    console.log('✅ Notificação de irrigação detectada enviada via HTTP');
    console.log('✅ Notificação de confirmação enviada via HTTP');

    console.log('\n🎉 Testes de notificação concluídos!');
    console.log('\n🌐 Para testar no frontend:');
    console.log(`1. Acesse: ${FRONTEND_URL}/dashboard`);
    console.log('2. Verifique se as notificações aparecem no sino (🔔) no canto superior direito');
    console.log('3. Clique no sino para ver todas as notificações');
    console.log('4. Teste o formulário de confirmação clicando em "Irrigação Detectada"');
    console.log('\n💡 Dica: Abra o DevTools do navegador (F12) para ver os logs do WebSocket');
    console.log('\n🔍 Verifique no console do navegador se as notificações estão sendo recebidas');
    console.log('\n📱 As notificações devem aparecer no componente de alertas com ícones específicos:');
    console.log('   - 💧 Bomba Ativada (ícone de gotas)');
    console.log('   - ⚠️  Irrigação Detectada (ícone de alerta)');
    console.log('   - ✅ Irrigação Confirmada (ícone de check)');

    console.log('\n✅ Teste concluído!');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.response?.data || error.message);
  }
}

// Executar teste
testNotificationsViaHTTP();
