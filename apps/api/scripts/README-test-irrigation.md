# Irrigation System Test Scripts

Este diretório contém scripts para testar o sistema completo de detecção e notificação de irrigação.

## Scripts Disponíveis

### 1. `test-irrigation.js` - Teste Completo do Sistema

Testa detecção de irrigação, notificações WebSocket e persistência no banco de dados.

### 2. `test-frontend-notifications.js` - Teste de Notificações Frontend

Simula notificações WebSocket para testar a interface do usuário.

## Pré-requisitos

1. **Banco de dados**: PostgreSQL rodando
2. **Seed data**: Execute o seed:
   ```bash
   cd apps/api
   npx prisma db seed
   ```
3. **API rodando**: Inicie o servidor:
   ```bash
   cd apps/api
   npm run dev
   ```

## Como executar

### Teste Completo do Sistema

```bash
cd apps/api
npm run test:irrigation
```

### Teste de Notificações Frontend

```bash
cd apps/api
node scripts/test-frontend-notifications.js
```

Ou use o npm script (se adicionado):

```bash
npm run test:frontend-notifications
```

## Resultado esperado do teste completo

```
🚀 Starting Irrigation System Tests

🔧 Setting up test data...
👤 Found test user: Admin User (admin@greenhouse.local)
🏠 Found greenhouse: Estufa Principal
🌱 Found user plant: Tomates da Estufa 1 (Tomate)
📡 Found soil moisture sensor: Soil Moisture Sensor 1

==================================================
🧪 TEST 1: Manual Irrigation Detection
==================================================
🌧️  Simulating manual irrigation/chuva detection...
📊 Current soil moisture: 68%
💧 Simulating soil moisture increase to: 93%
✅ Created sensor reading: [uuid]
⏳ Waiting for irrigation detection...
🎉 Irrigation detected!
   Type: manual
   Status: pending
   Detected at: [timestamp]
   Sensor reading ID: [uuid]
🔔 Irrigation notification received!
   Message: Irrigação detectada - umidade do solo aumentou significativamente
   Type: manual
   Irrigation ID: [uuid]
   User ID: [user-uuid]
✅ Manual irrigation test PASSED

==================================================
🧪 TEST 2: Automatic Pump Irrigation
==================================================
⚙️  Simulating automatic pump activation...
✅ Created pump operation: [uuid]
   Duration: 30000ms
   Water amount: 2.5L
⏳ Waiting for pump irrigation detection...
🎉 Pump irrigation detected!
   Type: automatic
   Status: completed
   Water amount: 2.5L
   Duration: 30000ms
   Detected at: [timestamp]
🔔 Irrigation notification received!
   Message: Bomba ativada por 30 segundos - 2.5L de água
   Type: automatic
   Irrigation ID: [uuid]
   User ID: [user-uuid]
✅ Pump irrigation test PASSED

==================================================
🧪 TEST 3: Irrigation Confirmation
==================================================
📝 Testing irrigation confirmation...
📤 Sending confirmation data...
   Type: manual
   Water Amount: 3.0L
   Notes: Irrigação manual realizada com mangueira
✅ Irrigation confirmed!
   Status: confirmed
   Confirmed at: [timestamp]
✅ Irrigation confirmation test PASSED

============================================================
📊 TEST SUMMARY
============================================================
All irrigation system tests completed!
Check the results above for detailed test outcomes.

💡 Next steps:
1. Start the frontend application
2. Login with admin@greenhouse.local / Test@123
3. Check if notifications appear in real-time
4. Test the irrigation confirmation form
```

## Teste Manual Adicional

Após executar os testes automatizados, você pode verificar manualmente:

1. **Banco de dados**: Verifique as tabelas `Irrigation`, `GreenhouseSensorReading`, e `PumpOperation`
2. **Frontend**: Faça login e veja se as notificações aparecem em tempo real
3. **WebSocket**: Monitore as conexões WebSocket no console do navegador

## Troubleshooting

### Erro: "Test user not found"

```bash
cd apps/api
npx prisma db seed
```

### Erro: "No greenhouse found"

- Verifique se o seed criou greenhouses corretamente
- Execute `npx prisma studio` para verificar os dados

### WebSocket não conecta

- Certifique-se de que a API está rodando na porta correta
- Verifique as configurações de CORS no WebSocket gateway

### Notificações não chegam no frontend

- Verifique se o componente `IrrigationNotification` está montado
- Confirme que o hook `useIrrigationNotifications` está sendo usado
- Verifique o console do navegador para erros de WebSocket

### Dados não salvam no banco

- Verifique a conexão com o banco de dados
- Confirme que as migrações do Prisma foram executadas
- Verifique logs da API para erros de banco de dados

## Configuração de Ambiente

### Variáveis de Ambiente para Testes

```bash
# API Configuration
API_BASE_URL=http://localhost:5000
WS_URL=http://localhost:5000

# Database (from .env)
DATABASE_URL="postgresql://username:password@localhost:5432/greenhouse"

# Test User
TEST_USER_EMAIL=admin@greenhouse.local
TEST_USER_ID=user-uuid-from-seed
```

## Estrutura dos Testes

### Teste 1: Detecção Manual

1. Busca leitura atual de umidade do solo
2. Simula aumento significativo na umidade
3. Cria nova leitura de sensor
4. Aguarda detecção automática
5. Verifica se irrigação foi criada no banco
6. Testa notificação WebSocket

### Teste 2: Detecção Automática

1. Cria registro de operação de bomba
2. Aguarda detecção automática
3. Verifica se irrigação foi criada no banco
4. Testa notificação WebSocket

### Teste 3: Confirmação

1. Usa irrigação criada no Teste 1
2. Simula confirmação do usuário
3. Atualiza registro no banco
4. Verifica se confirmação foi salva

## Extensões Possíveis

- **Testes de Stress**: Múltiplas irrigações simultâneas
- **Testes de Integração**: Com ESP32 real
- **Testes de UI**: Automação completa do frontend
- **Testes de Performance**: Latência de notificações
- **Testes de Segurança**: Autenticação WebSocket
