# Guia de Implementação - Sistema de Notificações e Irrigação

## 📋 Resumo

Sistema completo de notificações inteligentes e gerenciamento de irrigação com detecção automática, confirmação de irrigações e integração com IA.

## ✅ Implementações Concluídas

### Backend (NestJS)

#### 1. Sistema de Análise de Métricas

- **PlantMetricsService** (`apps/api/src/plant/plant-metrics.service.ts`)
  - Analisa métricas da planta (temperatura, umidade, solo, água)
  - Compara com valores ideais da tabela Plant
  - Gera alertas com níveis de severidade (low, medium, high)
  - Tipos de alerta: temperature_alert, humidity_alert, soil_moisture_alert, water_level_low

#### 2. Sistema de Geração de Notificações

- **NotificationGeneratorService** (`apps/api/src/notifications/notification-generator.service.ts`)
  - Cria notificações baseadas em alertas de métricas
  - Previne duplicação (verifica últimas 2 horas)
  - Integrado com WebSocket para notificações em tempo real
  - Tipos implementados:
    - `irrigation_detected` - irrigação detectada automaticamente
    - `pump_activated` - bomba ativada
    - Alertas de métricas (temperatura, umidade, etc.)

#### 3. Detecção Automática de Irrigação

- **IrrigationService** (atualizado)
  - Método `detectMoistureIrrigation`: detecta aumento > 15% na umidade
  - Verifica se não houve ativação da bomba
  - Cria registro de irrigação tipo "detected"
  - Gera notificação automaticamente

#### 4. WebSocket para Tempo Real

- **GreenhouseGateway** (verificado e integrado)
  - Namespace: `/greenhouse`
  - Métodos específicos para notificações de irrigação
  - Suporta autenticação JWT
  - Permite teste sem token

### Frontend (Next.js)

#### 1. Server Actions

- **notifications.ts** (`apps/web/src/server/actions/notifications.ts`)
  - `markNotificationAsRead(id)` - marcar notificação como lida
  - `markAllNotificationsAsRead()` - marcar todas como lidas
  - `getNotifications(limit)` - buscar notificações
  - `getUnreadCount()` - contagem de não lidas

- **irrigation.ts** (`apps/web/src/server/actions/irrigation.ts`)
  - `getIrrigations(filters)` - buscar irrigações com filtros
  - `confirmIrrigation(id, data)` - confirmar irrigação detectada
  - `getIrrigationStats()` - estatísticas de irrigação
  - `createIrrigation(data)` - criar nova irrigação

#### 2. Componentes

- **ConfirmIrrigationModal** (`apps/web/src/components/irrigation/confirm-irrigation-modal.tsx`)
  - Modal com formulário de confirmação
  - Radio buttons: Manual ou Chuva
  - Input de quantidade de água (ml) para manual
  - Campo de observações opcional
  - Validação integrada

- **IrrigationTable** (`apps/web/src/components/irrigation/irrigation-table.tsx`)
  - Tabela completa com histórico de irrigações
  - Colunas: Data/Hora, Tipo, Quantidade, Status, Observações, Ações
  - Badges coloridos por tipo
  - Botão de confirmação para irrigações detectadas
  - Estado de carregamento

- **IrrigationPage** (`apps/web/src/app/dashboard/irrigation/page.tsx`)
  - Página completa de gerenciamento
  - Cards com estatísticas (total, água utilizada, últimos 7 dias)
  - Filtros por tipo de irrigação
  - Botão de atualização
  - Integração com tabela

#### 3. Atualizações em Componentes Existentes

- **useNotifications** (hook atualizado)
  - Usa Server Actions em vez de fetch direto
  - UX responsivo (atualiza estado local imediatamente)
  - Rollback em caso de erro

- **Notifications Component** (atualizado)
  - Integrado com ConfirmIrrigationModal
  - Abre modal ao clicar em "Preencher dados"
  - Atualiza notificações após confirmação

- **Navigation** (atualizado)
  - Novo link para `/dashboard/irrigation`
  - Ícone de Droplet
  - Visível no menu mobile

## 🚀 Como Testar

### 1. Preparação

```bash
# No diretório raiz
pnpm install

# Iniciar backend
cd apps/api
pnpm run dev

# Iniciar frontend (em outro terminal)
cd apps/web
pnpm run dev
```

### 2. Testar Detecção de Irrigação (Mock)

```bash
cd apps/api
npx ts-node scripts/mock-irrigation-detection.ts
```

Este script irá:

- Criar/buscar uma estufa
- Criar leitura com umidade baixa (30%)
- Criar leitura com umidade alta (55%) - aumento de 25%
- Verificar se irrigação detectada foi criada
- Verificar se notificação foi gerada

### 3. Fluxo Completo no Frontend

1. **Login** no sistema
2. **Abrir Dashboard** - verificar notificações no sino
3. **Verificar Notificação** de irrigação detectada
4. **Clicar em "Preencher dados"** - abre modal
5. **Preencher formulário**:
   - Selecionar "Manual" ou "Chuva"
   - Se manual: informar quantidade de água
   - Adicionar observações (opcional)
6. **Confirmar** - irrigação atualizada na tabela
7. **Navegar para /dashboard/irrigation** - ver histórico completo
8. **Filtrar por tipo** - testar filtros
9. **Verificar estatísticas** - cards no topo

### 4. Testar Notificações de Métricas

O sistema automaticamente analisa as métricas quando novos dados de sensores são salvos. Para testar:

1. Enviar dados de sensor com valores fora do ideal
2. Verificar notificações geradas automaticamente
3. Tipos de alerta:
   - Temperatura fora do ideal (±5°C)
   - Umidade do ar fora do ideal (±10%)
   - Umidade do solo fora do ideal (±10%)
   - Nível de água baixo (<20%)

## 📝 Endpoints da API

### Notificações

```
GET    /notifications              - Buscar notificações do usuário
GET    /notifications/unread-count - Contagem de não lidas
PUT    /notifications/:id/read     - Marcar como lida
PUT    /notifications/mark-all-read - Marcar todas como lidas
DELETE /notifications/:id          - Deletar notificação
```

### Irrigação

```
GET    /irrigation                    - Buscar irrigações (com filtros)
POST   /irrigation                    - Criar nova irrigação
GET    /irrigation/:id                - Buscar irrigação específica
PUT    /irrigation/:id                - Atualizar irrigação
DELETE /irrigation/:id                - Deletar irrigação
POST   /irrigation/:id/confirm        - Confirmar irrigação detectada
GET    /irrigation/stats/overview     - Estatísticas de irrigação
```

## 🔧 Configurações Necessárias

### Variáveis de Ambiente

```env
# Backend
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:3000

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Banco de Dados

O schema Prisma já está configurado com todos os modelos necessários:

- Notification
- Irrigation
- GreenhouseSensorReading
- Plant
- UserPlant

## 🎯 Próximos Passos (Opcional)

### Fase 2 - Integração com IA

1. **AI Service** (`apps/ai`)
   - Endpoint para receber notificações
   - Análise preditiva de métricas
   - Detecção de padrões preocupantes

2. **Insights Generator**
   - Análise de tendências
   - Recomendações automáticas
   - Alertas preditivos

## 🐛 Troubleshooting

### Notificações não aparecem

1. Verificar se WebSocket está conectado (console do browser)
2. Verificar logs do backend para erros
3. Verificar se token JWT está válido
4. Testar endpoint `/notifications` diretamente

### Irrigação não é detectada

1. Verificar threshold de 15% de aumento
2. Verificar se há leituras anteriores de sensor
3. Verificar se não há irrigação detectada recente (2h)
4. Executar script de mock para debug

### Modal não abre

1. Verificar console do browser para erros
2. Verificar se `irrigationId` está presente nos dados da notificação
3. Verificar se componentes UI (Dialog, RadioGroup) estão instalados

## 📊 Métricas de Sucesso

- ✅ Notificações criadas automaticamente
- ✅ Notificações em tempo real via WebSocket
- ✅ Modal de confirmação funcional
- ✅ Tabela de irrigações com filtros
- ✅ Estatísticas calculadas corretamente
- ✅ Navegação integrada
- ✅ Server Actions funcionando
- ✅ UX responsivo e intuitivo

## 🎉 Implementação Completa!

Todos os itens do plano foram implementados com sucesso. O sistema está pronto para uso e testes.
