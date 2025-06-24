# Use uma imagem base do Node.js
FROM node:18-slim

# Defina o diretório de trabalho
WORKDIR /app

# Copie os arquivos do projeto para o contêiner
COPY . /app

# Instale as dependências do projeto
RUN npm install

# Construa o projeto Next.js
RUN npm run build

# Exponha a porta usada pelo Next.js
EXPOSE 3000

# Comando padrão para iniciar o servidor
CMD ["npm", "run", "start"]