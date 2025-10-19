const axios = require('axios');

async function testSimpleHTTP() {
  try {
    console.log('🧪 Teste Simples de HTTP');
    console.log('========================\n');

    console.log('🔍 Testando endpoint de bomba...');
    const response = await axios.post('http://localhost:5000/test-notifications/pump-activated', {
      duration: 30,
      waterAmount: 2.5
    });

    console.log('✅ Resposta recebida:');
    console.log('   - Success:', response.data.success);
    console.log('   - Message:', response.data.message);
    console.log('   - Notification ID:', response.data.notification.data.id);

    console.log('\n🎉 Teste HTTP funcionando!');
    console.log('🌐 Agora acesse o frontend em http://localhost:3000/dashboard');
    console.log('🔔 Verifique se as notificações aparecem no sino');

  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

testSimpleHTTP();
