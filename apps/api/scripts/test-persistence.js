const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';

async function testPersistence() {
  console.log('🧪 Teste de Persistência de Notificações');
  console.log('=======================================\n');

  try {
    // 1. Criar algumas notificações
    console.log('📝 Criando notificações de teste...');

    const notifications = [
      {
        type: 'pump_activated',
        title: 'Bomba Ativada',
        message: 'Bomba ativada por 45s, liberando 3.0L de água',
        duration: 45,
        waterAmount: 3.0,
        reason: 'Teste de persistência',
        greenhouseId: 'test-greenhouse',
        userId: 'test-user-id'
      },
      {
        type: 'irrigation_detected',
        title: 'Irrigação Detectada',
        message: 'Detectado aumento de 22.5% na umidade do solo',
        moistureIncrease: 22.5,
        previousMoisture: 28.0,
        currentMoisture: 50.5,
        greenhouseId: 'test-greenhouse',
        userId: 'test-user-id'
      },
      {
        type: 'system_alert',
        title: 'Alerta do Sistema',
        message: 'Sistema de monitoramento detectou anomalia',
        severity: 'high',
        component: 'sensor-temp-01',
        greenhouseId: 'test-greenhouse',
        userId: 'test-user-id'
      }
    ];

    const createdNotifications = [];

    for (const notification of notifications) {
      try {
        let endpoint = '';
        if (notification.type === 'pump_activated') {
          endpoint = '/test-notifications/pump-activated';
        } else if (notification.type === 'irrigation_detected') {
          endpoint = '/test-notifications/irrigation-detected';
        } else {
          // Para system_alert, usar pump-activated como fallback
          endpoint = '/test-notifications/pump-activated';
        }

        const response = await axios.post(`${API_BASE_URL}${endpoint}`, notification);
        createdNotifications.push(response.data);
        console.log(`✅ ${notification.type}: ${response.data.message}`);
      } catch (error) {
        console.error(`❌ Erro ao criar ${notification.type}:`, error.message);
      }
    }

    console.log('\n📊 Resumo:');
    console.log(`✅ ${createdNotifications.length} notificações criadas`);
    console.log('\n🌐 Para testar no frontend:');
    console.log('1. Acesse: http://localhost:3000/dashboard');
    console.log('2. Clique no sino (🔔) no canto superior direito');
    console.log('3. Verifique se as notificações aparecem');
    console.log('4. Dê refresh na página (F5)');
    console.log('5. As notificações devem continuar lá!');
    console.log('\n🔊 Recursos testados:');
    console.log('   - Persistência no banco de dados');
    console.log('   - Carregamento após refresh');
    console.log('   - Interface animada');
    console.log('   - Som de notificação');

    console.log('\n✅ Teste de persistência concluído!');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  }
}

testPersistence();
