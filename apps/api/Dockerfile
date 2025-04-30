# Use uma imagem base do Node.js
FROM node:18-slim

# Defina o diretório de trabalho
WORKDIR /app

# Copie os arquivos do projeto para o contêiner
COPY . /app

# Instale as dependências do projeto
RUN npm install

# Compile o código TypeScript
RUN npm run build

# Exponha a porta usada pelo NestJS
EXPOSE 3000

# Comando padrão para iniciar o servidor
CMD ["npm", "run", "start:prod"]