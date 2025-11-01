# Jornada do Usuário - Sistema de Estufa Inteligente

Este documento descreve as funcionalidades disponíveis e a experiência do usuário no sistema.

---

## 1. Primeiro Acesso

- **Login:** O usuário faz login no sistema
- **Dashboard:** Após login, acessa o dashboard principal com visão geral da estufa

---

## 2. Configuração Inicial

### Estufa

- Criar uma nova estufa com nome e descrição
- Configurar dispositivo ESP32 (via IP ou QR Code)
- Definir localização da estufa (automática, mapa ou manual)
- Selecionar a planta que está sendo monitorada na estufa

### Plantas

- Adicionar plantas ao sistema selecionando do catálogo
- Vincular planta a uma estufa específica
- Definir nickname personalizado para cada planta

---

## 3. Monitoramento em Tempo Real

### Dashboard Principal

- Visualizar métricas atuais: temperatura, umidade do ar, umidade do solo, nível de água
- Ver gráficos históricos das últimas 24h, semana ou mês
- Filtrar dados por período (hoje, semana, mês, personalizado)
- Acompanhar tendências com indicadores visuais (↑↓)

### Previsão do Tempo

- Ver previsão dos próximos 3 dias
- Informações sobre temperatura, umidade e chuva prevista
- Integração automática baseada na localização da estufa

---

## 4. Notificações Inteligentes

- **Notificações em tempo real** via WebSocket quando eventos importantes acontecem
- **Notificações PWA** no navegador (mesmo com app fechado)
- **Tipos de notificações:**
  - Irrigação detectada automaticamente (aumento de umidade)
  - Bomba de irrigação ativada
  - Alertas quando métricas saem do ideal (temperatura, umidade, água)
- **Centro de notificações** para ver histórico e marcar como lidas

---

## 5. Gerenciamento de Irrigação

- Ver histórico completo de todas as irrigações
- Confirmar irrigações detectadas pelo sistema (informar se foi manual ou chuva)
- Ativar bomba de irrigação remotamente
- Filtrar irrigações por tipo (manual, detectada, bomba, chuva) e período
- Ver estatísticas de uso de água

---

## 6. Relatórios com Inteligência Artificial

- Gerar relatórios semanais, mensais ou gerais sobre o cultivo
- Receber insights em linguagem natural sobre:
  - Condições gerais das plantas
  - Tendências e padrões identificados
  - Anomalias detectadas
  - Impacto do clima nas plantas
- Obter recomendações priorizadas de ações:
  - Alta prioridade: ações críticas
  - Média prioridade: melhorias recomendadas
  - Baixa prioridade: otimizações
- Visualizar gráficos e análises detalhadas

---

## 7. Configurações

- **Preferências pessoais:** Alterar tema (claro/escuro)
- **Localização:** Atualizar localização da estufa a qualquer momento
- **Notificações:** Habilitar/desabilitar tipos específicos de alertas
- **Instalação PWA:** Instruções para instalar como app no celular/desktop

---

## 8. Recursos Disponíveis

- **Seleção de planta:** Trocar entre plantas vinculadas facilmente
---

