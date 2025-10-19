const axios = require('axios');
const io = require('socket.io-client');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Test credentials (you'll need to replace these with actual test data)
const TEST_USER = {
  email: 'test@example.com',
  password: 'password123'
};

const TEST_GREENHOUSE = {
  name: 'Estufa Teste',
  description: 'Estufa para testes de irrigação'
};

class IrrigationNotificationTester {
  constructor() {
    this.token = null;
    this.greenhouseId = null;
    this.socket = null;
    this.notifications = [];
  }

  async login() {
    try {
      console.log('🔐 Fazendo login...');
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: TEST_USER.email,
        password: TEST_USER.password
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
        `${API_BASE_URL}/greenhouse`,
        TEST_GREENHOUSE,
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

  async testPumpIrrigation() {
    try {
      console.log('🧪 Testando detecção de irrigação por bomba...');

      // Criar uma operação de bomba
      const pumpOperation = await axios.post(
        `${API_BASE_URL}/pump/operation`,
        {
          greenhouseId: this.greenhouseId,
          duration: 30,
          waterAmount: 2.5,
          reason: 'Teste de irrigação automática'
        },
        {
          headers: { Authorization: `Bearer ${this.token}` }
        }
      );

      console.log('💧 Operação de bomba criada:', pumpOperation.data.id);

      // Aguardar um pouco para a notificação
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verificar se a notificação foi recebida
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

  async testMoistureIrrigation() {
    try {
      console.log('🧪 Testando detecção de irrigação por umidade...');

      // Criar leituras de sensor simulando aumento de umidade
      const baseMoisture = 30;
      const increasedMoisture = 50; // Aumento de 20% (acima do threshold de 15%)

      // Primeira leitura (umidade baixa)
      await axios.post(
        `${API_BASE_URL}/greenhouse/sensor-reading`,
        {
          greenhouseId: this.greenhouseId,
          airTemperature: 25.0,
          airHumidity: 60.0,
          soilMoisture: baseMoisture,
          soilTemperature: 22.0,
          lightIntensity: 500.0,
          waterLevel: 80.0,
          waterReserve: 50.0
        },
        {
          headers: { Authorization: `Bearer ${this.token}` }
        }
      );

      console.log('📊 Primeira leitura criada (umidade baixa)');

      // Aguardar um pouco
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Segunda leitura (umidade alta)
      const secondReading = await axios.post(
        `${API_BASE_URL}/greenhouse/sensor-reading`,
        {
          greenhouseId: this.greenhouseId,
          airTemperature: 25.0,
          airHumidity: 60.0,
          soilMoisture: increasedMoisture,
          soilTemperature: 22.0,
          lightIntensity: 500.0,
          waterLevel: 80.0,
          waterReserve: 50.0
        },
        {
          headers: { Authorization: `Bearer ${this.token}` }
        }
      );

      console.log('📊 Segunda leitura criada (umidade alta)');

      // Aguardar um pouco para a detecção
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verificar se a notificação foi recebida
      const moistureNotifications = this.notifications.filter(n => n.type === 'irrigation_detected');
      if (moistureNotifications.length > 0) {
        console.log('✅ Notificação de umidade recebida com sucesso');
        return moistureNotifications[0].data.id; // Retornar ID da irrigação para teste de confirmação
      } else {
        console.log('❌ Notificação de umidade não recebida');
        return null;
      }
    } catch (error) {
      console.error('❌ Erro no teste de umidade:', error.response?.data || error.message);
      return null;
    }
  }

  async testIrrigationConfirmation(irrigationId) {
    try {
      console.log('🧪 Testando confirmação de irrigação...');

      const response = await axios.put(
        `${API_BASE_URL}/irrigation/confirm`,
        {
          irrigationId: irrigationId,
          waterAmount: 3.0,
          notes: 'Teste de confirmação manual'
        },
        {
          headers: { Authorization: `Bearer ${this.token}` }
        }
      );

      console.log('✅ Irrigação confirmada:', response.data.id);

      // Aguardar um pouco para a notificação
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verificar se a notificação foi recebida
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

  async runTests() {
    console.log('🚀 Iniciando testes de notificações de irrigação...\n');

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

      // 4. Teste de irrigação por bomba
      console.log('\n--- Teste 1: Irrigação por Bomba ---');
      const pumpSuccess = await this.testPumpIrrigation();

      // 5. Teste de irrigação por umidade
      console.log('\n--- Teste 2: Irrigação por Umidade ---');
      const irrigationId = await this.testMoistureIrrigation();

      // 6. Teste de confirmação (se a irrigação foi detectada)
      if (irrigationId) {
        console.log('\n--- Teste 3: Confirmação de Irrigação ---');
        const confirmationSuccess = await this.testIrrigationConfirmation(irrigationId);
      }

      // 7. Resumo dos resultados
      console.log('\n📊 Resumo dos Testes:');
      console.log(`- Total de notificações recebidas: ${this.notifications.length}`);
      console.log(`- Notificações de bomba: ${this.notifications.filter(n => n.type === 'pump_activated').length}`);
      console.log(`- Notificações de umidade: ${this.notifications.filter(n => n.type === 'irrigation_detected').length}`);
      console.log(`- Notificações de confirmação: ${this.notifications.filter(n => n.type === 'irrigation_confirmed').length}`);

      console.log('\n✅ Testes concluídos!');
      console.log('\n🌐 Para testar no frontend:');
      console.log(`1. Acesse: ${FRONTEND_URL}/dashboard`);
      console.log('2. Verifique se as notificações aparecem no canto superior direito');
      console.log('3. Clique em "Confirmar Irrigação" para testar o formulário');

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

// Executar testes
if (require.main === module) {
  const tester = new IrrigationNotificationTester();
  tester.runTests().catch(console.error);
}

module.exports = IrrigationNotificationTester;
