# Use uma imagem base do Node.js
FROM node:18-slim

# Instale o pnpm globalmente
RUN npm install -g pnpm

# Defina o diretório de trabalho
WORKDIR /app

# Copie os arquivos de configuração do pnpm
COPY package.json pnpm-lock.yaml* ./
COPY .npmrc ./

# Copie os arquivos do projeto para o contêiner
COPY . /app

# Instale as dependências do projeto
RUN pnpm install --frozen-lockfile

# Compile o código TypeScript
RUN pnpm run build

# Exponha a porta usada pelo NestJS
EXPOSE 3000

# Comando padrão para iniciar o servidor
CMD ["pnpm", "run", "start:prod"]