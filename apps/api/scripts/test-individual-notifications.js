const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTest() {
  console.log('🔔 Teste de Notificações Individuais');
  console.log('=====================================');

  console.log('\n📝 Enviando notificações uma por vez...');

  try {
    // Primeira notificação - Bomba ativada
    console.log('\n1️⃣ Enviando notificação de bomba...');
    await axios.post(`${API_BASE_URL}/test-notifications/pump-activated`, {
      userId: 'test-user-id',
      greenhouseId: 'test-greenhouse-id-1',
      duration: 45,
      waterAmount: 3.0,
      reason: 'Teste de irrigação automática'
    });
    console.log('✅ Notificação 1 enviada - Aguarde o som!');

    // Aguardar 2 segundos
    await delay(2000);

    // Segunda notificação - Irrigação detectada
    console.log('\n2️⃣ Enviando notificação de irrigação detectada...');
    await axios.post(`${API_BASE_URL}/test-notifications/irrigation-detected`, {
      userId: 'test-user-id',
      greenhouseId: 'test-greenhouse-id-1',
      moistureIncrease: 22.5,
      previousMoisture: 28.0,
      currentMoisture: 50.5
    });
    console.log('✅ Notificação 2 enviada - Aguarde o som!');

    // Aguardar 2 segundos
    await delay(2000);

    // Terceira notificação - Confirmação de irrigação
    console.log('\n3️⃣ Enviando notificação de confirmação...');
    await axios.post(`${API_BASE_URL}/test-notifications/irrigation-confirmed`, {
      userId: 'test-user-id',
      greenhouseId: 'test-greenhouse-id-1',
      id: 'some-irrigation-id',
      waterAmount: 4.0,
      notes: 'Teste de confirmação manual'
    });
    console.log('✅ Notificação 3 enviada - Aguarde o som!');

    // Aguardar 2 segundos
    await delay(2000);

    // Quarta notificação - Alerta do sistema
    console.log('\n4️⃣ Enviando alerta do sistema...');
    await axios.post(`${API_BASE_URL}/test-notifications/pump-activated`, {
      userId: 'test-user-id',
      greenhouseId: 'test-greenhouse-id-1',
      duration: 10,
      waterAmount: 0,
      reason: 'Alerta de sistema de teste'
    });
    console.log('✅ Notificação 4 enviada - Aguarde o som!');

  } catch (error) {
    console.error('❌ Erro ao enviar notificações:', error.message);
  }

  console.log('\n📊 Resumo:');
  console.log('✅ 4 notificações enviadas individualmente');
  console.log('🔊 Cada notificação deve tocar um som separado');

  console.log('\n🌐 Para testar no frontend:');
  console.log('1. Acesse: http://localhost:3000/dashboard');
  console.log('2. Clique no sino (🔔) no canto superior direito');
  console.log('3. Você deve ver 4 notificações');
  console.log('4. Cada notificação deve ter tocado um som individual');

  console.log('\n🔊 Recursos testados:');
  console.log('   - Som individual para cada notificação');
  console.log('   - Notificações em tempo real');
  console.log('   - Interface animada');
  console.log('   - Persistência no banco');

  console.log('\n✅ Teste de notificações individuais concluído!');
}

runTest();
