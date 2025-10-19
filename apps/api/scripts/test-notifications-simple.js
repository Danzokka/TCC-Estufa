const io = require('socket.io-client');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

console.log('🧪 Teste Simples de Notificações Frontend');
console.log('==========================================\n');

async function testNotifications() {
  try {
    console.log('🔌 Conectando ao WebSocket...');

    // Conectar ao WebSocket sem autenticação (para teste)
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

    // 1. Teste de notificação de bomba
    console.log('\n🧪 Teste 1: Notificação de Bomba');
    console.log('--------------------------------');
    console.log('💧 Simulando ativação de bomba...');

    const pumpData = {
      id: `pump-${Date.now()}`,
      duration: 45,
      waterAmount: 3.0,
      reason: 'Teste de irrigação automática',
      greenhouseId: 'test-greenhouse',
      timestamp: new Date().toISOString()
    };

    console.log(`   - Duração: ${pumpData.duration}s`);
    console.log(`   - Quantidade: ${pumpData.waterAmount}L`);
    console.log(`   - Motivo: ${pumpData.reason}`);

    // Simular notificação de bomba
    socket.emit('test-pump-notification', pumpData);
    console.log('✅ Notificação de bomba enviada');

    // Aguardar um pouco
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 2. Teste de notificação de irrigação detectada
    console.log('\n🧪 Teste 2: Notificação de Irrigação Detectada');
    console.log('---------------------------------------------');
    console.log('🌱 Simulando detecção de irrigação por umidade...');

    const irrigationData = {
      id: `irrigation-${Date.now()}`,
      moistureIncrease: 22.5,
      previousMoisture: 28.0,
      currentMoisture: 50.5,
      greenhouseId: 'test-greenhouse',
      timestamp: new Date().toISOString()
    };

    console.log(`   - Aumento de umidade: ${irrigationData.moistureIncrease}%`);
    console.log(`   - Umidade anterior: ${irrigationData.previousMoisture}%`);
    console.log(`   - Umidade atual: ${irrigationData.currentMoisture}%`);

    // Simular notificação de irrigação detectada
    socket.emit('test-irrigation-detected', irrigationData);
    console.log('✅ Notificação de irrigação detectada enviada');

    // Aguardar um pouco
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 3. Teste de notificação de confirmação
    console.log('\n🧪 Teste 3: Notificação de Confirmação');
    console.log('--------------------------------------');
    console.log('📝 Simulando confirmação de irrigação...');

    const confirmationData = {
      id: irrigationData.id,
      waterAmount: 4.0,
      notes: 'Teste de confirmação manual',
      greenhouseId: 'test-greenhouse',
      timestamp: new Date().toISOString()
    };

    console.log(`   - ID da irrigação: ${confirmationData.id}`);
    console.log(`   - Quantidade confirmada: ${confirmationData.waterAmount}L`);
    console.log(`   - Observações: ${confirmationData.notes}`);

    // Simular notificação de confirmação
    socket.emit('test-irrigation-confirmed', confirmationData);
    console.log('✅ Notificação de confirmação enviada');

    // Aguardar um pouco
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

    socket.disconnect();
    console.log('\n✅ Teste concluído!');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  }
}

// Executar teste
testNotifications();