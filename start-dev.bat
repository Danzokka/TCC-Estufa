@echo off
REM ==========================================================
REM Script de Inicializacao Rapida - Sistema de Estufa Inteligente
REM ==========================================================
REM
REM Este script automatiza a inicializacao de todos os servicos
REM para desenvolvimento e apresentacoes.
REM
REM Uso: start-dev.bat
REM
REM ==========================================================

echo.
echo ================================================================
echo      Sistema de Estufa Inteligente - Inicializacao
echo ================================================================
echo.

REM Verificar Docker
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Docker nao encontrado. Por favor, instale o Docker.
    pause
    exit /b 1
)

REM Verificar pnpm
pnpm --version >nul 2>&1
if errorlevel 1 (
    echo [INFO] pnpm nao encontrado. Instalando...
    npm install -g pnpm
)

REM Verificar Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Python nao encontrado. Por favor, instale o Python 3.12+.
    pause
    exit /b 1
)

echo [OK] Todos os pre-requisitos verificados!
echo.

REM Passo 1: Iniciar banco de dados
echo [1/5] Iniciando banco de dados...
docker-compose up -d db
echo [OK] Banco de dados iniciado!
echo.

REM Aguardar banco estar pronto
echo [INFO] Aguardando banco de dados estar pronto...
timeout /t 5 /nobreak >nul

REM Passo 2: Instalar dependencias
echo [2/5] Instalando dependencias...
call pnpm install
echo [OK] Dependencias instaladas!
echo.

REM Passo 3: Configurar Prisma
echo [3/5] Configurando Prisma...
cd apps\api
call pnpm prisma generate
call pnpm prisma migrate dev --name init 2>nul || call pnpm prisma migrate deploy
echo [OK] Prisma configurado!
echo.

REM Passo 4: Seed do banco
echo [4/5] Populando banco de dados...
call pnpm prisma:seed 2>nul
echo [OK] Banco populado!
echo.

cd ..\..

REM Passo 5: Instalar dependencias Python
echo [5/5] Instalando dependencias Python...
cd apps\ai
python -m pip install -r requirements.txt --quiet
cd ..\..
echo [OK] Dependencias Python instaladas!
echo.

echo.
echo ================================================================
echo                       Setup Completo!
echo ================================================================
echo.
echo Para iniciar os servicos, execute em terminais separados:
echo.
echo Terminal 1 - Backend:
echo   cd apps\api ^&^& pnpm dev
echo.
echo Terminal 2 - IA:
echo   cd apps\ai ^&^& python app_service.py
echo.
echo Terminal 3 - Frontend:
echo   cd apps\web ^&^& pnpm dev
echo.
echo ----------------------------------------------------------------
echo Credenciais de acesso:
echo   Email: admin@greenhouse.local
echo   Senha: Test@123
echo.
echo URLs:
echo   Dashboard: https://localhost:3000
echo   API Docs:  http://localhost:5000/api
echo   AI Health: http://localhost:8000/health
echo ----------------------------------------------------------------
echo.
pause
