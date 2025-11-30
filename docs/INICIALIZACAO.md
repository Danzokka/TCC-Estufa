# 🚀 Guia de Inicialização - Sistema de Estufa Inteligente

Este documento descreve como configurar, inicializar e testar todos os serviços do sistema de estufa inteligente.

---

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

| Ferramenta     | Versão Mínima | Download                            |
| -------------- | ------------- | ----------------------------------- |
| Node.js        | 18+           | [nodejs.org](https://nodejs.org/)   |
| pnpm           | 9.0.0         | `npm install -g pnpm`               |
| Python         | 3.12+         | [python.org](https://python.org/)   |
| Docker Desktop | Latest        | [docker.com](https://docker.com/)   |
| Git            | Latest        | [git-scm.com](https://git-scm.com/) |

---

## 🏗️ Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                        Sistema de Estufa                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   Frontend   │    │   Backend    │    │     AI       │      │
│  │   Next.js    │◄──►│   NestJS     │◄──►│   Python     │      │
│  │  Port 3000   │    │  Port 5000   │    │  Port 8000   │      │
│  └──────────────┘    └──────┬───────┘    └──────────────┘      │
│                             │                                   │
│                      ┌──────▼───────┐                          │
│                      │  PostgreSQL  │                          │
│                      │  Port 5432   │                          │
│                      └──────────────┘                          │
│                                                                 │
│  ┌──────────────┐                                              │
│  │    ESP32     │─────────────────────────────────────────────►│
│  │  IoT Device  │                                              │
│  └──────────────┘                                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🐳 Opção 1: Inicialização com Docker (Recomendado para Produção)

### 1. Iniciar todos os serviços

```bash
# Iniciar apenas o banco de dados
docker-compose up -d db

# Ou iniciar todos os serviços
docker-compose up -d
```

### 2. Verificar status dos serviços

```bash
docker-compose ps
```

### 3. Ver logs dos serviços

```bash
# Todos os logs
docker-compose logs -f

# Logs específicos
docker-compose logs -f api
docker-compose logs -f ai
docker-compose logs -f web
```

### 4. Parar todos os serviços

```bash
docker-compose down
```

---

## 💻 Opção 2: Inicialização para Desenvolvimento

Esta opção é recomendada para desenvolvimento e apresentações.

### Passo 1: Instalar Dependências

```bash
# Na raiz do projeto
pnpm install
```

### Passo 2: Iniciar o Banco de Dados

```bash
docker-compose up -d db
```

Aguarde alguns segundos até o banco estar pronto.

### Passo 3: Configurar o Prisma (Backend)

```bash
cd apps/api

# Gerar cliente Prisma
pnpm prisma generate

# Executar migrações
pnpm prisma migrate dev

# Popular banco com dados iniciais
pnpm prisma:seed
```

### Passo 4: Iniciar o Backend (NestJS)

```bash
# Em apps/api
pnpm dev
```

✅ **Verificar**: Acesse http://localhost:5000/api para ver a documentação Swagger

### Passo 5: Configurar e Iniciar a IA (Python)

```bash
cd apps/ai

# Criar ambiente virtual (opcional, mas recomendado)
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
.\venv\Scripts\activate   # Windows

# Instalar dependências
pip install -r requirements.txt

# Iniciar serviço de IA
python app_service.py
```

✅ **Verificar**: Acesse http://localhost:8000/health para verificar o status

### Passo 6: Iniciar o Frontend (Next.js)

```bash
cd apps/web

# Iniciar em modo desenvolvimento
pnpm dev
```

✅ **Verificar**: Acesse https://localhost:3000

---

## 🔑 Credenciais Padrão

Após executar o seed, use estas credenciais para acessar o sistema:

| Campo     | Valor                    |
| --------- | ------------------------ |
| **Email** | `admin@greenhouse.local` |
| **Senha** | `Test@123`               |

---

## 🧪 Scripts de Teste

O projeto inclui vários scripts para testar funcionalidades específicas. Execute-os a partir da pasta `apps/api`:

```bash
cd apps/api
```

### Testes de Integração com IA

```bash
# Testar integração completa com o serviço de IA
npx ts-node scripts/test-ai-integration.ts

# Verificar irrigações detectadas pela IA
npx ts-node scripts/check-ai-irrigations.ts
```

### Testes de Dados do Sensor

```bash
# Verificar dados dos sensores no banco
npx ts-node scripts/check-sensor-data.ts

# Testar detecção de irrigação
npx ts-node scripts/test-irrigation-detection.ts

# Testar irrigação com sensores
npx ts-node scripts/test-sensor-irrigation.ts
```

### Testes de Notificações

```bash
# Criar notificação de predição
npx ts-node scripts/create-prediction-notification.ts

# Testar notificações de predição
npx ts-node scripts/test-prediction-notification.ts

# Testar sistema de notificações completo
node scripts/test-notifications-complete.js
```

### Configuração de Planta

```bash
# Configurar planta ativa para testes
npx ts-node scripts/setup-active-plant.ts
```

---

## 🔍 Verificação de Saúde dos Serviços

### Backend (NestJS)

```bash
curl http://localhost:5000/health
```

### IA (Python)

```bash
curl http://localhost:8000/health
```

### Frontend (Next.js)

Acesse https://localhost:3000 no navegador.

### Banco de Dados

```bash
docker-compose exec db psql -U postgres -d postgres -c "SELECT 1"
```

---

## 📊 Comandos Úteis do Prisma

```bash
cd apps/api

# Visualizar banco de dados no navegador
pnpm prisma studio

# Gerar cliente após mudanças no schema
pnpm prisma generate

# Criar nova migração
pnpm prisma migrate dev --name nome_da_migracao

# Aplicar migrações em produção
pnpm prisma migrate deploy

# Resetar banco de dados (CUIDADO!)
pnpm prisma migrate reset
```

---

## 🎯 Inicialização Rápida para Apresentação

Execute estes comandos em ordem para uma demonstração rápida:

```bash
# Terminal 1: Banco de Dados
docker-compose up -d db

# Terminal 2: Backend (aguarde o banco iniciar)
cd apps/api
pnpm prisma generate
pnpm prisma migrate dev
pnpm prisma:seed
pnpm dev

# Terminal 3: IA
cd apps/ai
pip install -r requirements.txt
python app_service.py

# Terminal 4: Frontend
cd apps/web
pnpm dev
```

Depois, acesse:

- **Dashboard**: https://localhost:3000
- **Login**: `admin@greenhouse.local` / `Test@123`
- **API Docs**: http://localhost:5000/api

---

## 🐛 Troubleshooting

### Erro: "Port already in use"

```bash
# Verificar processos usando a porta (Windows PowerShell)
netstat -ano | findstr :5000

# Matar processo (substituir PID)
taskkill /PID <PID> /F
```

### Erro: "Database connection failed"

1. Verifique se o Docker está rodando
2. Verifique se o container do banco está ativo: `docker-compose ps`
3. Aguarde alguns segundos após iniciar o container

### Erro: "Prisma Client not found"

```bash
cd apps/api
pnpm prisma generate
```

### Erro: "AI service connection refused"

1. Verifique se o serviço Python está rodando na porta 8000
2. Verifique se todas as dependências Python foram instaladas
3. Verifique os logs do serviço de IA

### Erro: "ECONNREFUSED" no Frontend

1. Verifique se o backend está rodando na porta 5000
2. Verifique a variável `NEXT_PUBLIC_API_URL` no `.env.local`

---

## 📁 Variáveis de Ambiente

### Backend (.env em apps/api)

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres"
JWT_SECRET="seu-jwt-secret-aqui"
AI_SERVICE_URL="http://localhost:8000"
```

### Frontend (.env.local em apps/web)

```env
NEXT_PUBLIC_API_URL="http://localhost:5000"
NEXT_PUBLIC_AI_URL="http://localhost:8000"
```

### IA (.env em apps/ai)

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres"
BACKEND_URL="http://localhost:5000"
```

---

## 🎥 Funcionalidades para Demonstrar

1. **Dashboard Principal**
   - Visualização em tempo real dos sensores
   - Gráficos de temperatura e umidade
   - Status da estufa

2. **Analytics (IA)**
   - Insights gerados pela IA
   - Anomalias detectadas
   - Recomendações inteligentes

3. **Gestão de Plantas**
   - Catálogo de plantas
   - Parâmetros ideais por espécie

4. **Sistema de Irrigação**
   - Histórico de irrigações
   - Irrigação automática baseada em IA

5. **Notificações**
   - Alertas de condições críticas
   - Recomendações de ação

---

## 📞 Suporte

Em caso de dúvidas ou problemas:

- Verifique os logs dos serviços
- Consulte a documentação do código
- Abra uma issue no repositório

---

_Última atualização: Janeiro 2025_
