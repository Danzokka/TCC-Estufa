<!-- 3532f057-bfaf-4a12-bda2-9a7d4e4094c5 0c5e1b6f-9854-4aa3-97d3-4624a7101503 -->
# Sistema de Notificações e Gerenciamento de Irrigação

## 1. Backend - Sistema de Notificações Inteligentes

### 1.1 Atualizar NotificationsService e Controller

- Ajustar endpoints de marcar como lida já existentes (`PUT /notifications/:id/read` e `PUT /notifications/mark-all-read`)
- Criar novo serviço `NotificationGeneratorService` para gerar notificações baseadas em métricas

### 1.2 Criar Sistema de Análise de Métricas

- Criar `PlantMetricsService` em `apps/api/src/plant/plant-metrics.service.ts`
- Implementar lógica de comparação com valores ideais da tabela Plant
- Integrar com NotificationsService para criar notificações automáticas
- Tipos de notificação:
- `temperature_alert` - temperatura fora do ideal
- `humidity_alert` - umidade fora do ideal
- `soil_moisture_alert` - umidade do solo fora do ideal
- `water_level_low` - nível de água baixo
- `irrigation_detected` - irrigação detectada automaticamente

### 1.3 Melhorar Sistema de Detecção de Irrigação

- Ajustar `detectMoistureIrrigation` no `IrrigationService` (já existe)
- Integrar com NotificationsService para criar notificação quando detectar irrigação
- Verificar se não houve ativação da bomba antes de notificar

### 1.4 Criar Endpoints de Irrigação

- Ajustar endpoints existentes em `IrrigationController`
- Criar endpoint `POST /irrigation/:id/confirm` para confirmar irrigação detectada
- Atualizar lógica de `confirmDetectedIrrigation` para aceitar tipo (rain/manual) e waterAmount

## 2. Frontend - Interface de Notificações

### 2.1 Atualizar Hook useNotifications

- Ajustar `markNotificationAsRead` para usar endpoint correto
- Ajustar `markAllAsRead` para usar endpoint correto
- Remover URLs de teste e usar APIs reais

### 2.2 Atualizar Componente de Notificações

- Ajustar `apps/web/src/components/modules/notification/notifications.tsx`
- Implementar modal de confirmação de irrigação ao clicar em "Preencher dados"
- Criar formulário com:
- Radio buttons: "Foi chuva?" ou "Foi irrigação manual?"
- Input numérico condicional para quantidade de água (ml) se manual
- Campo de observações opcional
- Botões de "Cancelar" e "Confirmar"

### 2.3 Criar Componente de Modal de Confirmação

- Criar `apps/web/src/components/irrigation/confirm-irrigation-modal.tsx`
- Usar shadcn Dialog component
- Integrar com API `/irrigation/:id/confirm`

## 3. Frontend - Página de Irrigação

### 3.1 Criar Página de Irrigação

- Criar `apps/web/src/app/dashboard/irrigation/page.tsx`
- Criar layout com:
- Título e descrição
- Filtros (tipo, data)
- Tabela de irrigações

### 3.2 Criar Componente de Tabela de Irrigação

- Criar `apps/web/src/components/irrigation/irrigation-table.tsx`
- Colunas:
- Data/Hora
- Tipo (Manual/Automático/Detectado)
- Quantidade de água (ml)
- Status (Confirmado/Pendente)
- Ações (Confirmar para tipo "detected")
- Usar shadcn Table component
- Implementar paginação
- Badge com cores diferentes para cada tipo

### 3.3 Criar Server Actions de Irrigação

- Criar `apps/web/src/server/actions/irrigation.ts`
- Funções:
- `getIrrigations(filters)` - buscar irrigações
- `confirmIrrigation(id, data)` - confirmar irrigação detectada
- `getIrrigationStats()` - estatísticas de irrigação

### 3.4 Criar Route Handler de Irrigação

- Atualizar `apps/web/src/app/api/irrigation/route.ts`
- Remover endpoint de teste (`/test-irrigation`)
- Usar endpoint real de autenticação (`/irrigation`)

## 4. Backend - Sistema de Análise com IA (Opcional/Futuro)

### 4.1 Criar Endpoint de Notificações no AI Service

- Adicionar em `apps/ai/api/api_service.py`:
- Endpoint `POST /notify` para enviar notificações ao backend
- Integração com backend NestJS via HTTP

### 4.2 Implementar Análise Preditiva de Métricas

- Atualizar `apps/ai/analysis/insights_generator.py`
- Criar função para analisar tendências e anomalias
- Enviar notificações quando detectar padrões preocupantes

## 5. Testes e Mock

### 5.1 Criar Script de Mock de Detecção

- Criar `apps/api/scripts/mock-irrigation-detection.ts`
- Simular aumento de umidade do solo
- Criar leitura de sensor com aumento significativo
- Testar geração de notificação automática

### 5.2 Atualizar Seed de Irrigação

- Ajustar `apps/api/prisma/seed-irrigation.ts`
- Adicionar exemplos de todos os tipos de irrigação
- Incluir irrigações pendentes de confirmação

## 6. Integração e Ajustes Finais

### 6.1 Atualizar Schema do Prisma (se necessário)

- Verificar se modelo Irrigation tem todos os campos necessários
- Criar migration se houver alterações

### 6.2 Ajustar WebSocket Gateway

- Verificar `apps/api/src/websocket/websocket.gateway.ts`
- Garantir que notificações sejam enviadas em tempo real
- Testar conexão e recebimento de notificações

### 6.3 Adicionar Menu de Navegação

- Adicionar link para `/dashboard/irrigation` no menu principal
- Atualizar header/sidebar com novo item

### 6.4 Testes de Integração

- Testar fluxo completo:

1. Detecção de irrigação
2. Criação de notificação
3. Recebimento em tempo real no frontend
4. Confirmação via modal
5. Atualização na tabela de irrigação

- Testar marcar notificações como lidas (individual e todas)

## Arquivos Principais a Modificar/Criar

### Backend (NestJS)

- `apps/api/src/plant/plant-metrics.service.ts` (CRIAR)
- `apps/api/src/notifications/notification-generator.service.ts` (CRIAR)
- `apps/api/src/notifications/notifications.service.ts` (AJUSTAR)
- `apps/api/src/irrigation/irrigation.service.ts` (AJUSTAR)
- `apps/api/src/irrigation/irrigation.controller.ts` (AJUSTAR)
- `apps/api/src/sensor/sensor.service.ts` (AJUSTAR integração)

### Frontend (Next.js)

- `apps/web/src/hooks/useNotifications.ts` (AJUSTAR)
- `apps/web/src/components/modules/notification/notifications.tsx` (AJUSTAR)
- `apps/web/src/components/irrigation/confirm-irrigation-modal.tsx` (CRIAR)
- `apps/web/src/components/irrigation/irrigation-table.tsx` (CRIAR)
- `apps/web/src/app/dashboard/irrigation/page.tsx` (CRIAR)
- `apps/web/src/server/actions/irrigation.ts` (CRIAR)
- `apps/web/src/app/api/irrigation/route.ts` (AJUSTAR)

### AI Service (Python) - Fase 2

- `apps/ai/api/api_service.py` (AJUSTAR)
- `apps/ai/analysis/insights_generator.py` (AJUSTAR)

## Observações Técnicas

1. **Valores Ideais**: Usar campos existentes da tabela Plant (air_temperature_initial/final, air_humidity_initial/final, etc.)
2. **Detecção de Irrigação**: Considerar aumento > 15% na umidade do solo sem ativação da bomba
3. **Notificações em Tempo Real**: Usar WebSocket existente (`/greenhouse` namespace)
4. **Autenticação**: Todos os endpoints protegidos com AuthGuard
5. **Validação**: Usar DTOs com class-validator no backend

### To-dos

- [ ] Criar PlantMetricsService para análise de métricas e comparação com valores ideais
- [ ] Criar NotificationGeneratorService para gerar notificações automáticas baseadas em métricas
- [ ] Melhorar sistema de detecção de irrigação e integrar com notificações
- [ ] Ajustar endpoints de irrigação e criar endpoint de confirmação
- [ ] Atualizar useNotifications para usar endpoints corretos de marcar como lida
- [ ] Criar modal de confirmação de irrigação detectada com formulário
- [ ] Criar página /dashboard/irrigation com tabela de irrigações
- [ ] Criar componente de tabela de irrigação com filtros e ações
- [ ] Criar server actions e route handlers para irrigação
- [ ] Verificar e testar WebSocket Gateway para notificações em tempo real
- [ ] Adicionar link para página de irrigação no menu de navegação
- [ ] Criar script de mock para testar detecção de irrigação
- [ ] Testar fluxo completo de detecção, notificação e confirmação