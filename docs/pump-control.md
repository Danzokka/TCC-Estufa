# Controle de Bomba - Sistema de Irrigação IoT

## Visão Geral

O sistema de controle de bomba permite irrigação automatizada e manual das plantas através de uma interface web integrada com hardware ESP32.

## Componentes Implementados

### Frontend (Next.js)

- **PumpQuickControl**: Widget compacto para a home page com botões de ação rápida
- **PumpControlPanel**: Interface completa para controle avançado na página `/pump`
- **PumpHistory**: Histórico de operações de irrigação

### Backend (NestJS)

- **PumpController**: Endpoints REST para controle da bomba
- **PumpService**: Lógica de negócio e integração com ESP32
- **PumpDTO**: Validação de dados de entrada

### Hardware (ESP32)

- **PumpController**: Controle físico da bomba via relé
- **OLED Display**: Feedback visual no hardware
- **Safety System**: Sistema de segurança com timeouts

## Funcionalidades

### Controle Rápido (Home Page)

- ✅ Botões de ação rápida: 30s, 1min, 3min
- ✅ Status em tempo real com polling automático
- ✅ Barra de progresso para controle por volume
- ✅ Feedback visual com animações
- ✅ Toasts para confirmação de ações

### Controle Avançado (/pump)

- ✅ Configuração precisa de duração (1-3600 segundos)
- ✅ Controle por volume de água (0.1-100 litros)
- ✅ Motivos personalizados para irrigação
- ✅ Parada de emergência
- ✅ Histórico de operações

### ESP32 Integration

- ✅ Display OLED mostra status da bomba
- ✅ Informações de duração e volume
- ✅ Safety checks automáticos
- ✅ Timeout máximo de 5 minutos

## API Endpoints

### POST /api/pump/activate

Ativa a bomba com parâmetros específicos:

```json
{
  "greenhouseId": "uuid",
  "duration": 60,
  "waterAmount": 2.5,
  "notes": "Irrigação manual"
}
```

### GET /api/pump/status/:greenhouseId

Retorna o status atual da bomba.

### DELETE /api/pump/stop/:greenhouseId

Para a operação da bomba imediatamente.

## Como Usar

### Irrigação Rápida

1. Na página inicial, localize o widget "Controle de Irrigação"
2. Clique em um dos botões (30s, 1min, 3min)
3. Aguarde a confirmação e monitore o progresso
4. O ESP32 exibirá o status no OLED

### Irrigação Avançada

1. Clique no ícone de configurações no widget
2. Configure duração e/ou quantidade de água
3. Adicione um motivo (opcional)
4. Clique em "Activate Pump"
5. Use "Stop Pump" para parada manual

## Sistema de Segurança

### Timeouts

- **Máximo por operação**: 60 minutos (3600s)
- **Máximo de segurança**: 5 minutos (ESP32)
- **Polling de status**: A cada 3 segundos

### Validações

- Verificação de greenhouse ID válido
- Limites de duração e volume
- Estado da bomba antes de ativação
- Detecção de falhas de comunicação

## Feedback Visual

### Frontend

- **Status Badge**: Verde (ativa) / Cinza (inativa)
- **Timer**: Contagem regressiva em tempo real
- **Progress Bar**: Para controle por volume
- **Toasts**: Confirmação de ações
- **Indicador ESP32**: Status de conexão

### OLED (ESP32)

- **Linha 1**: Temperatura e umidade
- **Linha 2**: Umidade do solo
- **Linha 3**: Taxa de fluxo
- **Linha 4**: Volume total
- **Status da Bomba**: "PUMP: ON (60s)" ou "PUMP: OFF"
- **Detalhes**: "Runtime: 15s" quando ativa

## Estrutura de Arquivos

```
apps/web/src/components/pump/
├── pump-quick-control.tsx    # Widget para home page
├── pump-control-panel.tsx    # Interface completa
└── pump-history.tsx         # Histórico de operações

apps/web/src/app/
├── page.tsx                 # Home com PumpQuickControl
└── pump/page.tsx           # Página dedicada ao controle

apps/web/src/server/actions/
└── pump.ts                 # Server actions para API

apps/api/src/pump/
├── pump.controller.ts       # REST endpoints
├── pump.service.ts         # Lógica de negócio
└── dto/pump.dto.ts         # Validação de dados

apps/esp/lib/PUMP/
├── pump.h                  # Interface do controlador
└── pump.cpp               # Implementação do controle

apps/esp/lib/OLED/
├── OLED.h                  # Interface do display
└── OLED.cpp               # Implementação com suporte à bomba
```

## Estado Atual

✅ **Implementado e testando**:

- Widget de controle rápido na home page
- Integração completa com API backend
- Feedback visual em tempo real
- Display OLED no ESP32
- Sistema de segurança
- Build passando sem erros

## Próximos Passos

1. **Testes de integração**: Verificar comunicação ESP32 ↔ API
2. **Calibração de sensores**: Ajustar leituras de fluxo
3. **Notificações push**: Alertas para irrigação completada
4. **Agendamento**: Sistema de irrigação automática
5. **Analytics**: Relatórios de consumo de água

## Troubleshooting

### Bomba não ativa

1. Verificar conexão ESP32
2. Confirmar status do relé
3. Verificar logs do backend
4. Testar endpoint diretamente

### OLED não atualiza

1. Verificar conexão I2C (SDA=21, SCL=19)
2. Reiniciar ESP32
3. Verificar código de status da bomba

### Frontend não atualiza

1. Verificar console do navegador
2. Confirmar WebSocket ou polling
3. Verificar server actions

---

**Status**: ✅ Implementado e funcionando
**Última atualização**: 22 de junho de 2025
