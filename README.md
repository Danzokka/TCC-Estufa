# 🌱 TCC - Sistema de Estufa Inteligente

Um projeto de Trabalho de Conclusão de Curso para uma estufa automatizada e inteligente com monitoramento e controle remoto.

## 📋 Visão Geral

Este projeto implementa um sistema completo de estufa inteligente que monitora e controla automaticamente condições ambientais para otimizar o crescimento de plantas. A solução utiliza sensores conectados a um ESP32 para coletar dados em tempo real, uma API backend para processamento e armazenamento dos dados, e uma interface web PWA responsiva para monitoramento e controle remoto.

![Arquitetura do Projeto](/files/Arquitetura.png)

## 👨‍💻 Desenvolvedores

- **Rafael Dantas Boeira** - [GitHub](https://github.com/Danzokka) | [LinkedIn](URL_DO_SEU_LINKEDIN)
- **João Victor Alvez Menezes** - [GitHub](URL_DO_GITHUB_DO_JOAO) | [LinkedIn](URL_DO_LINKEDIN_DO_JOAO)

## 🛠️ Tecnologias Utilizadas

### Hardware

- **ESP32** - Microcontrolador para leitura de sensores e atuação
- **Sensores**:
  - Luminosidade
  - Temperatura ambiente
  - Umidade ambiente
  - Temperatura do solo
  - Umidade do solo
  - Nível de água

### Software

#### Backend

![Backend](https://go-skill-icons.vercel.app/api/icons?i=typescript,nestjs,prisma,postgresql,docker)

- **TypeScript** - Linguagem de programação para maior segurança e escalabilidade
- **NestJS** - Framework Node.js para backend robusto e escalável
- **Prisma ORM** - ORM para acesso e manipulação do banco de dados
- **PostgreSQL** - Banco de dados relacional

#### Frontend

![Frontend](https://go-skill-icons.vercel.app/api/icons?i=typescript,react,nextjs,reactquery,tailwindcss)

- **React** - Biblioteca JavaScript para construção de interfaces de usuário
- **Next.js** - Framework React para criar um PWA responsivo
- **TypeScript** - Tipagem estática para maior segurança no desenvolvimento
- **React Query** - Gerenciamento de estado e cache para chamadas à API
- **Tailwind CSS** - Framework CSS para design moderno e responsivo

#### IA

![IA](https://go-skill-icons.vercel.app/api/icons?i=python,pytorch,pandas)

- **Python** - Processamento de dados e modelo de previsão/recomendação
- **PyTorch** - Biblioteca para aprendizado de máquina
- **Pandas** - Biblioteca para manipulação e análise de dados

#### Dispositivo IoT

![IoT](https://go-skill-icons.vercel.app/api/icons?i=arduino,platformio)

- **Arduino Framework** - Para programação do ESP32
- **PlatformIO** - Ambiente de desenvolvimento para IoT

#### DevOps e Infraestrutura

![DevOps](https://go-skill-icons.vercel.app/api/icons?i=docker,git,github,githubactions,nodejs)

- **Git** - Controle de versão para gerenciamento do código-fonte
- **GitHub** - Hospedagem do repositório e colaboração
- **Docker/Docker Compose** - Contêinerização para consistência nos ambientes
- **Turborepo** - Gerenciamento de monorepo para desenvolvimento otimizado
- **Node.js** - Ambiente de execução JavaScript no servidor

## 🏗️ Estrutura do Projeto

O projeto segue uma arquitetura de monorepo gerenciada pelo Turborepo, organizada da seguinte forma:

```
TCC-Estufa/
├── apps/
│   ├── ai/            # Serviço de IA para análise e previsões
│   ├── esp32/         # Firmware do ESP32 para coleta de dados
│   ├── api/           # Backend NestJS com Prisma
│   └── web/           # Frontend Next.js (PWA)
├── packages/
│   ├── eslint-config/ # Configurações compartilhadas de ESLint
│   ├── typescript-config/ # Configurações compartilhadas de TypeScript
│   └── ui/            # Componentes compartilhados de UI
└── docker-compose.yml # Configuração para execução dos serviços
```

## 🔄 Fluxo de Dados

1. O dispositivo ESP32 coleta dados dos sensores (temperatura, umidade, etc.)
2. Os dados são enviados via Wi-Fi para a API NestJS
3. A API processa, valida e armazena os dados no banco PostgreSQL
4. O frontend Next.js consulta os dados da API para exibição em tempo real
5. O modelo de IA analisa os dados e fornece recomendações
6. Comandos podem ser enviados de volta ao ESP32 para controlar atuadores (irrigação, ventilação, etc.)

## 🚀 Instalação e Execução

### Pré-requisitos

- Docker e Docker Compose
- Node.js (v18+)
- NPM
- PlatformIO (para desenvolvimento do firmware ESP32)

### Configuração e Execução

1. Clone o repositório:

```bash
git clone https://github.com/seu-usuario/TCC-Estufa.git
cd TCC-Estufa
```

2. Instale as dependências:

```bash
npm install
```

3. Execute o projeto em ambiente de desenvolvimento:

```bash
npm run dev
```

4. Para build de produção:

```bash
npm run build
```

5. Para execução com Docker:

```bash
docker-compose up -d
```

## 📱 Recursos do Aplicativo

- Dashboard em tempo real com visualização dos dados dos sensores
- Gráficos históricos de medições
- Configuração de parâmetros ideais para diferentes tipos de plantas
- Alertas e notificações para condições críticas

