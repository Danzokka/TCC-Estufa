#!/bin/bash
# ==========================================================
# Script de Inicialização Rápida - Sistema de Estufa Inteligente
# ==========================================================
#
# Este script automatiza a inicialização de todos os serviços
# para desenvolvimento e apresentações.
#
# Uso:
#   chmod +x start-dev.sh
#   ./start-dev.sh
#
# ==========================================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║     🌱 Sistema de Estufa Inteligente - Inicialização         ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Função para verificar se comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Verificar pré-requisitos
echo -e "${YELLOW}📋 Verificando pré-requisitos...${NC}"

if ! command_exists docker; then
    echo -e "${RED}❌ Docker não encontrado. Por favor, instale o Docker.${NC}"
    exit 1
fi

if ! command_exists pnpm; then
    echo -e "${RED}❌ pnpm não encontrado. Instalando...${NC}"
    npm install -g pnpm
fi

if ! command_exists python; then
    if ! command_exists python3; then
        echo -e "${RED}❌ Python não encontrado. Por favor, instale o Python 3.12+.${NC}"
        exit 1
    fi
    PYTHON_CMD="python3"
else
    PYTHON_CMD="python"
fi

echo -e "${GREEN}✅ Todos os pré-requisitos verificados!${NC}\n"

# Passo 1: Iniciar banco de dados
echo -e "${BLUE}🐳 Passo 1: Iniciando banco de dados...${NC}"
docker-compose up -d db
echo -e "${GREEN}✅ Banco de dados iniciado!${NC}\n"

# Aguardar banco estar pronto
echo -e "${YELLOW}⏳ Aguardando banco de dados estar pronto...${NC}"
sleep 5

# Passo 2: Instalar dependências
echo -e "${BLUE}📦 Passo 2: Instalando dependências...${NC}"
pnpm install
echo -e "${GREEN}✅ Dependências instaladas!${NC}\n"

# Passo 3: Configurar Prisma
echo -e "${BLUE}🔧 Passo 3: Configurando Prisma...${NC}"
cd apps/api
pnpm prisma generate
pnpm prisma migrate dev --name init 2>/dev/null || pnpm prisma migrate deploy
echo -e "${GREEN}✅ Prisma configurado!${NC}\n"

# Passo 4: Seed do banco
echo -e "${BLUE}🌱 Passo 4: Populando banco de dados...${NC}"
pnpm prisma:seed || true
echo -e "${GREEN}✅ Banco populado!${NC}\n"

cd ../..

# Passo 5: Instalar dependências Python
echo -e "${BLUE}🐍 Passo 5: Instalando dependências Python...${NC}"
cd apps/ai
$PYTHON_CMD -m pip install -r requirements.txt --quiet
cd ../..
echo -e "${GREEN}✅ Dependências Python instaladas!${NC}\n"

# Informações finais
echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                    ✅ Setup Completo!                         ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${YELLOW}Para iniciar os serviços, execute em terminais separados:${NC}\n"

echo -e "${GREEN}Terminal 1 - Backend:${NC}"
echo "  cd apps/api && pnpm dev"
echo ""

echo -e "${GREEN}Terminal 2 - IA:${NC}"
echo "  cd apps/ai && python app_service.py"
echo ""

echo -e "${GREEN}Terminal 3 - Frontend:${NC}"
echo "  cd apps/web && pnpm dev"
echo ""

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}🔑 Credenciais de acesso:${NC}"
echo "   Email: admin@greenhouse.local"
echo "   Senha: Test@123"
echo ""
echo -e "${YELLOW}🌐 URLs:${NC}"
echo "   Dashboard: https://localhost:3000"
echo "   API Docs:  http://localhost:5000/api"
echo "   AI Health: http://localhost:8000/health"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
