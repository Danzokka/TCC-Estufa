# 🚀 Quick Irrigation System Test

Execute estes comandos para testar o sistema completo de irrigação:

## 1. Preparar o ambiente

```bash
# Iniciar serviços (PostgreSQL + Redis)
docker-compose up -d

# Executar seed do banco
cd apps/api
npx prisma db seed

# Instalar dependências se necessário
npm install
```

## 2. Iniciar API

```bash
# Terminal 1 - API Backend
cd apps/api
npm run dev
```

## 3. Executar teste completo

```bash
# Terminal 2 - Teste do sistema
cd apps/api
npm run test:irrigation
```

## 4. Testar frontend (opcional)

```bash
# Terminal 3 - Frontend
cd apps/web
npm run dev

# Terminal 4 - Teste de notificações frontend
cd apps/api
npm run test:frontend-notifications
```

## ✅ Verificação final

1. **API Logs**: Deve mostrar detecção de irrigação
2. **Banco de dados**: Verificar tabelas `Irrigation` e `GreenhouseSensorReading`
3. **Frontend**: Fazer login e verificar notificações em tempo real
4. **WebSocket**: Verificar conexões no console do navegador

## 🎯 Resultado esperado

- ✅ Irrigação manual detectada via aumento de umidade
- ✅ Irrigação automática detectada via operação de bomba
- ✅ Notificações WebSocket enviadas e recebidas
- ✅ Confirmação de irrigação salva no banco
- ✅ Interface do usuário mostra notificações

## 🔧 Troubleshooting rápido

```bash
# Se der erro de usuário não encontrado
npx prisma db seed

# Se WebSocket não conectar
# Verificar se API está rodando na porta 5000

# Se notificações não chegam no frontend
# Verificar console do navegador para erros
```

---

**Tempo estimado**: 5-10 minutos
**Pré-requisitos**: Docker, Node.js, PostgreSQL
