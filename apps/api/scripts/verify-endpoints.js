const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';

async function verifyEndpoints() {
  console.log('🔍 Verificando Endpoints do Backend');
  console.log('====================================');

  // 1. Verificar endpoint de carregamento
  console.log('\n1️⃣ Testando GET /test-notifications/load-test...');
  try {
    const response = await axios.get(`${API_BASE_URL}/test-notifications/load-test`);
    console.log('✅ Endpoint funcionando!');
    console.log(`📊 Notificações encontradas: ${response.data.notifications?.length || 0}`);
    console.log(`📬 Não lidas: ${response.data.unreadCount || 0}`);
  } catch (error) {
    console.error('❌ Erro ao acessar endpoint:', error.response?.status || error.message);
  }

  // 2. Verificar endpoint de salvar
  console.log('\n2️⃣ Testando POST /notifications/public/save...');
  try {
    const testNotification = {
      userId: 'test-user-id',
      type: 'system_test',
      title: 'Teste de Verificação',
      message: 'Testando endpoint de salvar',
      data: { timestamp: new Date().toISOString() }
    };

    const response = await axios.post(`${API_BASE_URL}/notifications/public/save`, testNotification);
    console.log('✅ Endpoint funcionando!');
    console.log(`📝 Notificação salva com ID: ${response.data.id}`);
  } catch (error) {
    console.error('❌ Erro ao salvar notificação:', error.response?.status || error.message);
  }

  // 3. Verificar novamente o endpoint de carregamento
  console.log('\n3️⃣ Verificando persistência após salvar...');
  try {
    const response = await axios.get(`${API_BASE_URL}/test-notifications/load-test`);
    console.log('✅ Endpoint funcionando!');
    console.log(`📊 Notificações encontradas: ${response.data.notifications?.length || 0}`);
    console.log(`📬 Não lidas: ${response.data.unreadCount || 0}`);

    if (response.data.notifications && response.data.notifications.length > 0) {
      console.log('\n📋 Últimas notificações:');
      response.data.notifications.slice(0, 3).forEach((notif, idx) => {
        console.log(`   ${idx + 1}. ${notif.title} - ${notif.type}`);
      });
    }
  } catch (error) {
    console.error('❌ Erro ao carregar notificações:', error.response?.status || error.message);
  }

  console.log('\n✅ Verificação de endpoints concluída!');
}

verifyEndpoints();
