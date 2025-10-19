const axios = require('axios');
const io = require('socket.io-client');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

console.log('🧪 Teste Real de Notificações Frontend');
console.log('======================================\n');

class RealNotificationTester {
  constructor() {
    this.token = null;
    this.greenhouseId = null;
    this.socket = null;
    this.notifications = [];
  }

  async login() {
    try {
      console.log('🔐 Fazendo login...');

      // Tentar fazer login com usuário existente
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: 'admin@example.com',
        password: 'password123'
      });

      this.token = response.data.access_token;
      console.log('✅ Login realizado com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro no login:', error.response?.data || error.message);
      return false;
    }
  }

  async createTestGreenhouse() {
    try {
      console.log('🏠 Criando estufa de teste...');
      const response = await axios.post(
        `${API_BASE_URL}/greenhouses`,
        {
          name: 'Estufa Teste Notificações',
          description: 'Estufa para teste de notificações frontend',
          location: 'Laboratório de Testes'
        },
        {
          headers: { Authorization: `Bearer ${this.token}` }
        }
      );

      this.greenhouseId = response.data.id;
      console.log('✅ Estufa criada:', this.greenhouseId);
      return true;
    } catch (error) {
      console.error('❌ Erro ao criar estufa:', error.response?.data || error.message);
      return false;
    }
  }

  connectWebSocket() {
    return new Promise((resolve, reject) => {
      console.log('🔌 Conectando ao WebSocket...');

      this.socket = io(`${API_BASE_URL}/greenhouse`, {
        auth: { token: this.token },
        transports: ['websocket']
      });

      this.socket.on('connect', () => {
        console.log('✅ Conectado ao WebSocket');
        resolve(true);
      });

      this.socket.on('disconnect', () => {
        console.log('❌ Desconectado do WebSocket');
      });

      // Capturar notificações
      this.socket.on('notification', (notification) => {
        console.log('🔔 Notificação recebida:', notification);
        this.notifications.push(notification);
      });

      this.socket.on('pump-activated', (data) => {
        console.log('💧 Bomba ativada:', data);
        this.notifications.push({
          type: 'pump_activated',
          title: 'Bomba Ativada',
          message: `Bomba ativada por ${data.duration}s, liberando ${data.waterAmount}L de água`,
          data,
          timestamp: new Date().toISOString()
        });
      });

      this.socket.on('irrigation-detected', (data) => {
        console.log('🌱 Irrigação detectada:', data);
        this.notifications.push({
          type: 'irrigation_detected',
          title: 'Irrigação Detectada',
          message: `Detectado aumento de ${data.moistureIncrease.toFixed(1)}% na umidade do solo`,
          data,
          timestamp: new Date().toISOString(),
          requiresAction: true,
          actionUrl: `/dashboard/irrigation/confirm/${data.id}`
        });
      });

      this.socket.on('irrigation-confirmed', (data) => {
        console.log('✅ Irrigação confirmada:', data);
        this.notifications.push({
          type: 'irrigation_confirmed',
          title: 'Irrigação Confirmada',
          message: `Irrigação manual confirmada: ${data.waterAmount}L de água`,
          data,
          timestamp: new Date().toISOString()
        });
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ Erro de conexão WebSocket:', error);
        reject(error);
      });

      // Timeout para conexão
      setTimeout(() => {
        if (!this.socket.connected) {
          reject(new Error('Timeout na conexão WebSocket'));
        }
      }, 5000);
    });
  }

  async testPumpNotification() {
    try {
      console.log('\n🧪 Teste 1: Notificação de Bomba via API');
      console.log('------------------------------------------');

      // Criar uma operação de bomba real
      const pumpOperation = await axios.post(
        `${API_BASE_URL}/pump/operation`,
        {
          greenhouseId: this.greenhouseId,
          duration: 30,
          waterAmount: 2.5,
          reason: 'Teste de notificação de bomba'
        },
        {
          headers: { Authorization: `Bearer ${this.token}` }
        }
      );

      console.log('💧 Operação de bomba criada:', pumpOperation.data.id);
      console.log(`   - Duração: ${pumpOperation.data.duration}s`);
      console.log(`   - Quantidade: ${pumpOperation.data.waterAmount}L`);

      // Aguardar notificação
      await new Promise(resolve => setTimeout(resolve, 3000));

      const pumpNotifications = this.notifications.filter(n => n.type === 'pump_activated');
      if (pumpNotifications.length > 0) {
        console.log('✅ Notificação de bomba recebida com sucesso');
        return true;
      } else {
        console.log('❌ Notificação de bomba não recebida');
        return false;
      }
    } catch (error) {
      console.error('❌ Erro no teste de bomba:', error.response?.data || error.message);
      return false;
    }
  }

  async testMoistureNotification() {
    try {
      console.log('\n🧪 Teste 2: Notificação de Irrigação Detectada');
      console.log('-----------------------------------------------');

      console.log('📊 Enviando dados de sensor simulando aumento de umidade...');

      // Primeira leitura - umidade baixa
      await axios.post(
        `${API_BASE_URL}/greenhouses/sensor-data`,
        {
          greenhouseId: this.greenhouseId,
          airTemperature: 25.0,
          airHumidity: 60.0,
          soilMoisture: 30, // Umidade baixa
          soilTemperature: 22.0,
          lightIntensity: 500.0,
          waterLevel: 80.0,
          waterReserve: 50.0
        },
        {
          headers: { Authorization: `Bearer ${this.token}` }
        }
      );

      console.log('📊 Primeira leitura enviada (umidade baixa: 30%)');

      // Aguardar um pouco
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Segunda leitura - umidade alta (simulando irrigação)
      await axios.post(
        `${API_BASE_URL}/greenhouses/sensor-data`,
        {
          greenhouseId: this.greenhouseId,
          airTemperature: 25.0,
          airHumidity: 60.0,
          soilMoisture: 55, // Umidade alta (aumento de 25%)
          soilTemperature: 22.0,
          lightIntensity: 500.0,
          waterLevel: 80.0,
          waterReserve: 50.0
        },
        {
          headers: { Authorization: `Bearer ${this.token}` }
        }
      );

      console.log('📊 Segunda leitura enviada (umidade alta: 55%)');
      console.log('🌱 Aguardando detecção de irrigação...');

      // Aguardar detecção
      await new Promise(resolve => setTimeout(resolve, 3000));

      const moistureNotifications = this.notifications.filter(n => n.type === 'irrigation_detected');
      if (moistureNotifications.length > 0) {
        console.log('✅ Notificação de irrigação detectada recebida com sucesso');
        return moistureNotifications[0].data.id;
      } else {
        console.log('❌ Notificação de irrigação detectada não recebida');
        return null;
      }
    } catch (error) {
      console.error('❌ Erro no teste de umidade:', error.response?.data || error.message);
      return null;
    }
  }

  async testConfirmationNotification(irrigationId) {
    try {
      console.log('\n🧪 Teste 3: Notificação de Confirmação via API');
      console.log('-----------------------------------------------');

      if (!irrigationId) {
        console.log('⚠️  Nenhuma irrigação detectada para confirmar');
        return false;
      }

      console.log('📝 Confirmando irrigação via API...');
      console.log(`   - ID da irrigação: ${irrigationId}`);
      console.log('   - Quantidade: 3.5L');
      console.log('   - Observações: Teste de confirmação manual');

      const response = await axios.put(
        `${API_BASE_URL}/irrigation/confirm`,
        {
          irrigationId: irrigationId,
          waterAmount: 3.5,
          notes: 'Teste de confirmação manual'
        },
        {
          headers: { Authorization: `Bearer ${this.token}` }
        }
      );

      console.log('✅ Irrigação confirmada via API:', response.data.id);

      // Aguardar notificação
      await new Promise(resolve => setTimeout(resolve, 2000));

      const confirmationNotifications = this.notifications.filter(n => n.type === 'irrigation_confirmed');
      if (confirmationNotifications.length > 0) {
        console.log('✅ Notificação de confirmação recebida com sucesso');
        return true;
      } else {
        console.log('❌ Notificação de confirmação não recebida');
        return false;
      }
    } catch (error) {
      console.error('❌ Erro na confirmação:', error.response?.data || error.message);
      return false;
    }
  }

  async runCompleteTest() {
    console.log('🚀 Iniciando teste real de notificações...\n');

    try {
      // 1. Login
      const loginSuccess = await this.login();
      if (!loginSuccess) {
        throw new Error('Falha no login');
      }

      // 2. Criar estufa de teste
      const greenhouseSuccess = await this.createTestGreenhouse();
      if (!greenhouseSuccess) {
        throw new Error('Falha ao criar estufa');
      }

      // 3. Conectar WebSocket
      await this.connectWebSocket();

      // 4. Teste de notificação de bomba
      const pumpSuccess = await this.testPumpNotification();

      // 5. Teste de notificação de umidade
      const irrigationId = await this.testMoistureNotification();

      // 6. Teste de notificação de confirmação
      let confirmationSuccess = false;
      if (irrigationId) {
        confirmationSuccess = await this.testConfirmationNotification(irrigationId);
      }

      // 7. Resumo dos resultados
      console.log('\n📊 Resumo dos Testes:');
      console.log('====================');
      console.log(`- Total de notificações recebidas: ${this.notifications.length}`);
      console.log(`- Notificações de bomba: ${this.notifications.filter(n => n.type === 'pump_activated').length}`);
      console.log(`- Notificações de umidade: ${this.notifications.filter(n => n.type === 'irrigation_detected').length}`);
      console.log(`- Notificações de confirmação: ${this.notifications.filter(n => n.type === 'irrigation_confirmed').length}`);

      const allTestsPassed = pumpSuccess && irrigationId && confirmationSuccess;

      if (allTestsPassed) {
        console.log('\n🎉 Todos os testes passaram!');
        console.log('✅ Sistema de notificações funcionando perfeitamente');
      } else {
        console.log('\n⚠️  Alguns testes falharam');
        console.log('❌ Verifique a configuração do WebSocket e frontend');
      }

      console.log('\n🌐 Para testar no frontend:');
      console.log(`1. Acesse: ${FRONTEND_URL}/dashboard`);
      console.log('2. Verifique se as notificações aparecem no canto superior direito');
      console.log('3. Teste o formulário de confirmação em: /dashboard/irrigation/confirm/[id]');
      console.log('\n💡 Dica: Abra o DevTools do navegador (F12) para ver os logs do WebSocket');

    } catch (error) {
      console.error('\n❌ Erro durante os testes:', error.message);
    } finally {
      // Limpar recursos
      if (this.socket) {
        this.socket.disconnect();
      }
    }
  }
}

// Executar teste
if (require.main === module) {
  const tester = new RealNotificationTester();
  tester.runCompleteTest().catch(console.error);
}

module.exports = RealNotificationTester;
