# Use uma imagem base do Python
FROM python:latest
# Defina o diretório de trabalho
WORKDIR /app

# Copie os arquivos do projeto para o contêiner
COPY . /app

# Instale as dependências do Python
RUN pip install --no-cache-dir -r requirements.txt

# Comando padrão para executar o script Python
CMD ["python", "test.py"]