# Controle de Bomba - Sistema de Irrigação IoT

## Visão Geral

O sistema de controle de bomba permite irrigação automatizada e manual das plantas através de uma interface web integrada com hardware ESP32. O sistema foi simplificado para usar comunicação direta com dispositivos ESP32 via IP, removendo a dependência de associações com estufas.

## Componentes Implementados

### Frontend (Next.js)

- **SimplePumpQuickControl**: Widget compacto para a home page com controle direto por IP
- **SimplePumpControl**: Interface completa para controle direto via IP do dispositivo
- **SimpleDeviceConfigurator**: Configuração simples de dispositivos usando apenas IP

### Backend (NestJS)

- **PumpController**: Endpoints REST para controle direto da bomba via IP
- **PumpService**: Lógica de negócio e integração direta com ESP32
- **PumpDTO**: Validação de dados com DTOs simplificados para controle por IP

### Hardware (ESP32)

- **PumpController**: Controle físico da bomba via relé
- **OLED Display**: Feedback visual no hardware
- **Safety System**: Sistema de segurança com timeouts
- **Direct IP Communication**: Comunicação direta sem dependência de greenhouse

## Funcionalidades

### Controle Simplificado (Home Page)

- ✅ Botões de ação rápida: 30s, 1min, 3min
- ✅ Status em tempo real via IP do dispositivo
- ✅ Feedback visual com status de conexão
- ✅ Configuração automática via localStorage
- ✅ Toasts para confirmação de ações
- ✅ Indicador de dispositivo online/offline

### Configuração de Dispositivo (/device)

- ✅ Configuração simples via IP
- ✅ Teste de conectividade automático
- ✅ Armazenamento local da configuração
- ✅ Interface de controle integrada
- ✅ Modo simplificado (padrão) e modo completo (legacy)

### ESP32 Integration

- ✅ Display OLED mostra status da bomba
- ✅ Informações de duração em tempo real
- ✅ Safety checks automáticos
- ✅ Comunicação direta via IP
- ✅ Timeout máximo de 1 hora

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
├── simple-pump-quick-control.tsx    # Widget para home page (IP-based)
├── simple-pump-control.tsx          # Interface para controle direto
├── pump-quick-control.tsx           # Widget legacy (greenhouse-based)
└── pump-control-panel.tsx          # Interface legacy

apps/web/src/components/device/
├── simple-device-configurator.tsx   # Configuração simples por IP
├── device-management.tsx           # Interface de gerenciamento
└── device-configurator.tsx         # Configuração legacy

apps/web/src/app/
├── page.tsx                 # Home com SimplePumpQuickControl
├── device/page.tsx         # Configuração de dispositivos
└── pump/page.tsx           # Página legacy (greenhouse-based)

apps/web/src/server/actions/
├── pump-simple.ts          # Server actions para controle direto por IP
└── pump.ts                 # Server actions legacy (greenhouse-based)

apps/web/src/hooks/
└── useDeviceConfig.ts      # Hook para gerenciar configuração via localStorage

apps/api/src/pump/
├── pump.controller.ts       # REST endpoints (com suporte IP-based)
├── pump.service.ts         # Lógica de negócio
└── dto/pump.dto.ts         # Validação (com DTOs simplificados)

apps/esp/lib/PUMP/
├── pump.h                  # Interface do controlador
└── pump.cpp               # Implementação do controle

apps/esp/lib/OLED/
├── OLED.h                  # Interface do display
└── OLED.cpp               # Implementação com suporte à bomba
```

## Estado Atual

✅ **Implementado e funcionando**:

- Widget de controle rápido simplificado na home page
- Configuração de dispositivos via IP (sem greenhouse)
- Integração direta com ESP32 via IP
- Sistema de configuração localStorage
- Feedback visual em tempo real com status de conectividade
- Display OLED no ESP32
- Sistema de segurança com timeouts
- Build passando sem erros

## Fluxo de Uso Simplificado

1. **Configuração Inicial**:

   - Acesse `/device`
   - Insira o IP do ESP32
   - Teste a conectividade
   - Salve a configuração

2. **Controle Diário**:

   - Na home page, use os botões rápidos (30s, 1min, 3min)
   - Status em tempo real com indicador online/offline
   - Feedback imediato via OLED do ESP32

3. **Controle Avançado**:
   - Acesse a aba "Controle" em `/device`
   - Configure duração personalizada
   - Monitore status detalhado

## Próximos Passos

1. **Remover componentes legacy**: Limpeza do código antigo baseado em greenhouse
2. **Melhorar UX**: Tornar configuração ainda mais intuitiva
3. **Notificações push**: Alertas para irrigação completada
4. **Agendamento**: Sistema de irrigação automática baseado em IP
5. **Analytics**: Relatórios de uso por dispositivo

## Troubleshooting

### Bomba não ativa

1. Verificar se o IP do dispositivo está configurado
2. Testar conectividade na página `/device`
3. Verificar se o ESP32 está na mesma rede
4. Confirmar status do relé no hardware

### Dispositivo aparece offline

1. Verificar conexão WiFi do ESP32
2. Confirmar IP correto na configuração
3. Testar ping manual para o dispositivo
4. Verificar firewall/rede local

### Configuração não salva

1. Verificar se localStorage está habilitado
2. Limpar dados do navegador se necessário
3. Verificar console do navegador para erros
4. Reconfigurar dispositivo se necessário

---

**Status**: ✅ Implementado e funcionando
**Última atualização**: 22 de junho de 2025
