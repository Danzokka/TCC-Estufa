# Sistema de Notificações em Tempo Real

## 🎯 Visão Geral

Sistema híbrido de notificações que combina **WebSocket** para tempo real com **sync automático** para persistência no banco de dados.

## 🏗️ Arquitetura

### Backend (NestJS)

1. **WebSocket Gateway** (`greenhouse.gateway.ts`)
   - Emite notificações via Socket.IO
   - Conexões sem autenticação para testes

2. **NotificationsService** (`notifications.service.ts`)
   - CRUD de notificações no banco
   - Gerenciamento de status (lido/não lido)

3. **PublicNotificationsController** (`public-notifications.controller.ts`)
   - Endpoint público `/notifications/public/save`
   - Cria ou busca usuário de teste automaticamente
   - Salva notificações recebidas do frontend

4. **TestNotificationsController** (`test-notifications.controller.ts`)
   - Endpoints para testes: `/test-notifications/pump-activated`, etc.
   - Apenas emite via WebSocket (não salva no banco)
   - Endpoint `/test-notifications/load-test` para carregar notificações

### Frontend (Next.js)

1. **useNotifications Hook** (`useNotifications.ts`)

   ```typescript
   // Fluxo:
   // 1. WebSocket recebe notificação
   // 2. Toca som imediatamente
   // 3. Atualiza UI instantaneamente
   // 4. Sync automático com backend
   // 5. Persistência garantida
   ```

2. **Proxy do Next.js** (`next.config.ts`)
   ```typescript
   rewrites: [
     { source: '/api/:path*', destination: 'http://localhost:5000/:path*' },
   ];
   ```

## 🔄 Fluxo Completo

### 1. Notificação em Tempo Real

```
Backend (WebSocket) → Frontend recebe → Som toca → UI atualiza → Sync automático → Banco de dados
```

### 2. Carregamento Inicial (Refresh)

```
Frontend inicia → Busca notificações do banco → Carrega estado → Sem som
```

## 🚀 Como Usar

### Scripts de Teste

1. **Teste Individual** (2s entre notificações)

   ```bash
   cd apps/api
   node scripts/test-individual-notifications.js
   ```

2. **Teste em Tempo Real** (5s entre notificações)

   ```bash
   cd apps/api
   node scripts/test-realtime-notifications.js
   ```

3. **Teste WebSocket + Sync** (4s entre notificações)

   ```bash
   cd apps/api
   node scripts/test-websocket-only.js
   ```

4. **Verificar Endpoints**
   ```bash
   cd apps/api
   node scripts/verify-endpoints.js
   ```

### Endpoints da API

1. **Salvar Notificação** (Público)

   ```http
   POST /notifications/public/save
   Content-Type: application/json

   {
     "type": "pump_activated",
     "title": "Bomba Ativada",
     "message": "Bomba ativada por 45s",
     "data": { ... }
   }
   ```

2. **Carregar Notificações** (Teste)

   ```http
   GET /test-notifications/load-test
   ```

3. **Enviar via WebSocket** (Teste)

   ```http
   POST /test-notifications/pump-activated
   Content-Type: application/json

   {
     "duration": 45,
     "waterAmount": 3.0,
     "reason": "Irrigação automática"
   }
   ```

## 🎵 Comportamento do Som

- ✅ **Toca**: Quando notificação chega via WebSocket
- ❌ **Não toca**: No carregamento inicial (refresh)
- ✅ **Som individual**: Cada notificação toca separadamente

## 💾 Persistência

### Automática

- Frontend salva automaticamente após receber via WebSocket
- Usa endpoint `/notifications/public/save`
- Usuário de teste criado/buscado automaticamente

### Carregamento

- Carrega do banco ao iniciar/refresh
- Usa endpoint `/test-notifications/load-test`
- Mantém estado de lido/não lido

## 🎯 Tipos de Notificação

1. **pump_activated** - Bomba ativada
2. **irrigation_detected** - Irrigação detectada
3. **irrigation_confirmed** - Irrigação confirmada
4. **system_alert** - Alerta do sistema
5. **maintenance** - Manutenção

## 🔧 Configuração

### Variáveis de Ambiente

```env
# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:5000

# Backend (.env)
DATABASE_URL=postgresql://...
```

### Banco de Dados

```prisma
model Notification {
  id        String   @id @default(uuid())
  userId    String
  type      String
  title     String
  message   String
  data      Json?
  isRead    Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user      User     @relation(...)
}
```

## ✅ Checklist de Teste

- [ ] Notificações chegam em tempo real
- [ ] Som toca para cada notificação
- [ ] Interface atualiza instantaneamente
- [ ] Console mostra "Notificação salva no backend"
- [ ] Refresh mantém notificações
- [ ] Sem som no refresh
- [ ] Badge com contador atualizado
- [ ] Botão "Marcar como lida" funciona

## 🎉 Resultado Final

**Sistema híbrido perfeito:**

- ✅ WebSocket para tempo real
- ✅ Sync automático para persistência
- ✅ Som individual por notificação
- ✅ Interface responsiva
- ✅ Persistência após refresh
- ✅ Sem erros de foreign key
- ✅ Proxy do Next.js funcionando
