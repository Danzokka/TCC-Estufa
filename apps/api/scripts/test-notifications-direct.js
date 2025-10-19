const io = require('socket.io-client');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

console.log('🧪 Teste Direto de Notificações Frontend');
console.log('========================================\n');

async function testDirectNotifications() {
  try {
    console.log('🔌 Conectando ao WebSocket...');

    // Conectar ao WebSocket
    const socket = io(`${API_BASE_URL}/greenhouse`, {
      transports: ['websocket']
    });

    let connected = false;
    socket.on('connect', () => {
      console.log('✅ Conectado ao WebSocket');
      connected = true;
    });

    socket.on('disconnect', () => {
      console.log('❌ Desconectado do WebSocket');
    });

    // Aguardar conexão
    await new Promise((resolve) => {
      const checkConnection = () => {
        if (connected) {
          resolve();
        } else {
          setTimeout(checkConnection, 100);
        }
      };
      checkConnection();
    });

    console.log('\n🎯 Enviando notificações de teste...\n');

    // 1. Notificação de Bomba Ativada
    console.log('💧 Enviando notificação de bomba ativada...');
    const pumpNotification = {
      type: 'pump_activated',
      title: 'Bomba Ativada',
      message: 'Bomba ativada por 45s, liberando 3.0L de água',
      data: {
        id: `pump-${Date.now()}`,
        duration: 45,
        waterAmount: 3.0,
        reason: 'Teste de irrigação automática',
        greenhouseId: 'test-greenhouse',
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    };

    // Enviar via evento personalizado
    socket.emit('test-notification', pumpNotification);
    console.log('✅ Notificação de bomba enviada');

    await new Promise(resolve => setTimeout(resolve, 2000));

    // 2. Notificação de Irrigação Detectada
    console.log('\n🌱 Enviando notificação de irrigação detectada...');
    const irrigationNotification = {
      type: 'irrigation_detected',
      title: 'Irrigação Detectada',
      message: 'Detectado aumento de 22.5% na umidade do solo',
      data: {
        id: `irrigation-${Date.now()}`,
        moistureIncrease: 22.5,
        previousMoisture: 28.0,
        currentMoisture: 50.5,
        greenhouseId: 'test-greenhouse',
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString(),
      requiresAction: true,
      actionUrl: `/dashboard/irrigation/confirm/irrigation-${Date.now()}`
    };

    socket.emit('test-notification', irrigationNotification);
    console.log('✅ Notificação de irrigação detectada enviada');

    await new Promise(resolve => setTimeout(resolve, 2000));

    // 3. Notificação de Irrigação Confirmada
    console.log('\n✅ Enviando notificação de irrigação confirmada...');
    const confirmationNotification = {
      type: 'irrigation_confirmed',
      title: 'Irrigação Confirmada',
      message: 'Irrigação manual confirmada: 4.0L de água',
      data: {
        id: `irrigation-${Date.now()}`,
        waterAmount: 4.0,
        notes: 'Teste de confirmação manual',
        greenhouseId: 'test-greenhouse',
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    };

    socket.emit('test-notification', confirmationNotification);
    console.log('✅ Notificação de confirmação enviada');

    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('\n📊 Resumo dos Testes:');
    console.log('====================');
    console.log('✅ Notificação de bomba enviada');
    console.log('✅ Notificação de irrigação detectada enviada');
    console.log('✅ Notificação de confirmação enviada');

    console.log('\n🎉 Testes de notificação concluídos!');
    console.log('\n🌐 Para testar no frontend:');
    console.log(`1. Acesse: ${FRONTEND_URL}/dashboard`);
    console.log('2. Verifique se as notificações aparecem no canto superior direito');
    console.log('3. Teste o formulário de confirmação em: /dashboard/irrigation/confirm/[id]');
    console.log('\n💡 Dica: Abra o DevTools do navegador (F12) para ver os logs do WebSocket');
    console.log('\n🔍 Verifique no console do navegador se as notificações estão sendo recebidas');

    socket.disconnect();
    console.log('\n✅ Teste concluído!');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  }
}

// Executar teste
testDirectNotifications();
