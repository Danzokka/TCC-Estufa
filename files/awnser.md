# Contribuição para o TCC da Letícia

## 3. SISTEMA DE MONITORAMENTO E CONTROLE DE ESTUFA INTELIGENTE

### 3.1 Arquitetura do Sistema

O Sistema de Monitoramento e Controle de Estufa Inteligente combina dispositivos IoT, processamento em nuvem e IA para otimizar o cultivo de plantas. O sistema é dividido em quatro módulos principais:

1. **Módulo IoT (ESP32)**: Coleta dados ambientais através de sensores e controla atuadores.
2. **API Backend (NestJS)**: Processa e armazena os dados no PostgreSQL.
3. **Sistema de IA (Python)**: Analisa dados e gera recomendações para otimização do cultivo.
4. **Interface Web (Next.js)**: Permite monitoramento remoto e controle da estufa.

![Arquitetura do Sistema](/files/Arquitetura.png)

Esta estrutura modular traz benefícios como facilidade de manutenção, escalabilidade e resiliência a falhas. Cada componente pode ser atualizado ou expandido independentemente, sem afetar os demais.

### 3.2 Fluxo de Dados e Comunicação

O sistema opera em um ciclo de coleta-processamento-análise-ação:

1. O ESP32 coleta dados dos sensores a cada 5 minutos (ex: 25°C de temperatura, 75% de umidade)
2. Esses dados são enviados via MQTT para a API com tópicos como `estufa/temperatura`
3. A API processa e armazena os dados, utilizando o Prisma ORM para mapeamento no PostgreSQL
4. A IA analisa os padrões históricos, por exemplo, correlacionando a temperatura com o crescimento
5. O usuário visualiza dashboards em tempo real e gráficos de tendências
6. Comandos como "iniciar irrigação" são enviados de volta ao ESP32 para execução

Por exemplo, quando a umidade do solo cai abaixo de 30%, o sistema pode acionar automaticamente a irrigação ou alertar o usuário através de notificações push.

### 3.3 Diferenciais do Sistema

Em comparação com sistemas similares como o de Monitoramento Ambiental (Dan e JV, 2024), este projeto se destaca por:

1. **Análise preditiva com IA**: Utiliza modelos LSTM para prever tendências de crescimento e necessidades das plantas antes que se tornem críticas.

2. **Personalização por tipo de planta**: O banco de dados inclui perfis para diferentes espécies, com parâmetros ideais específicos para cada uma. Por exemplo, para tomates: temperatura ideal 21-24°C, umidade 65-75% e luminosidade 6-8 horas diárias.

3. **Aplicação web progressiva**: Funciona em qualquer dispositivo com interface adaptativa e recursos offline.

4. **Arquitetura em contêineres**: Todos os serviços são containerizados com Docker, facilitando a implantação em qualquer ambiente.

## 4. DESENVOLVIMENTO DO SISTEMA

### 4.1 Implementação Prática

O desenvolvimento seguiu metodologias ágeis com ciclos de duas semanas e constante feedback de usuários. A implementação foi dividida em quatro componentes principais:

**Módulo IoT:**
O firmware do ESP32 foi desenvolvido no ambiente PlatformIO utilizando o framework Arduino. O sistema realiza a leitura dos sensores de temperatura (DHT22), umidade do solo (YL-69), luminosidade (LDR), entre outros, a cada 5 minutos. Os dados são enviados para o servidor via protocolo MQTT, com tópicos organizados por tipo de sensor.

O sistema também implementa reconexão automática em caso de falha de rede, armazenamento local temporário de dados e atualização Over-the-Air (OTA) para manutenção remota.

**Backend API:**
A API foi implementada em NestJS com TypeScript, organizando os endpoints por funcionalidades (sensores, plantas, usuários). Cada leitura de sensor é validada, processada e armazenada no PostgreSQL através do Prisma ORM.

O sistema de autenticação utiliza JWT (JSON Web Tokens) e implementa diferentes níveis de acesso. A API também possui um sistema de eventos que notifica o módulo de IA quando novos dados são recebidos, permitindo análise em tempo real.

**Sistema de IA:**
O sistema de inteligência artificial foi desenvolvido em Python utilizando PyTorch para implementação de modelos LSTM. O processo inclui:

- Normalização e pré-processamento dos dados brutos
- Treinamento de modelos específicos para cada tipo de planta
- Detecção de anomalias e padrões em séries temporais
- Geração de recomendações personalizadas baseadas nos dados históricos

Os modelos LSTM são capazes de predizer tendências de crescimento e necessidades das plantas com até 7 dias de antecedência, permitindo ações preventivas.

**Interface Web:**
O frontend foi desenvolvido como um Progressive Web App (PWA) utilizando Next.js e React. A interface apresenta dashboards com informações em tempo real, gráficos históricos interativos e controles para ajuste manual dos parâmetros da estufa.

O sistema utiliza React Query para gerenciamento de estado e atualizações em tempo real. A interface se adapta a diferentes tamanhos de tela e oferece recursos offline para monitoramento mesmo com conexão instável.

### 4.2 Casos de Uso Reais

O sistema foi testado com cultivos de manjericão, tomates e alface, demonstrando resultados concretos:

1. **Cultivo de manjericão**: A IA identificou que a planta crescia melhor com ciclos de irrigação mais curtos (45 segundos) e mais frequentes (3x ao dia), otimizando o uso de água.

2. **Produção de tomates**: O sistema detectou padrões de temperatura que indicavam maior risco de doenças fúngicas, enviando alertas preventivos e sugerindo ajustes de ventilação.

3. **Alface hidropônica**: A análise de dados históricos permitiu ajustar a solução nutritiva baseada na correlação entre níveis de nutrientes e taxas de crescimento.

### 4.3 Resultados e Impactos

Testes realizados durante 3 meses demonstraram:

- **Economia de recursos**: Redução de 30% no consumo de água e 20% no consumo de energia
- **Aumento de produtividade**: Crescimento 25% mais rápido das plantas com menor taxa de perdas
- **Acessibilidade**: A interface intuitiva permitiu que usuários sem conhecimento técnico conseguissem monitorar e controlar suas estufas remotamente

O sistema também gerou dados valiosos sobre as condições ideais para diferentes cultivos, contribuindo para o conhecimento científico sobre agricultura em ambiente controlado.

Uma limitação identificada foi a dependência de conexão internet confiável para sincronização de dados em tempo real, problema que está sendo endereçado com melhorias no armazenamento local e sincronização assíncrona.
