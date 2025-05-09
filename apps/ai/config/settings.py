import os
from dotenv import load_dotenv

# Carrega variáveis de ambiente do arquivo .env
load_dotenv()

# Configurações do banco de dados
DATABASE_URL = os.getenv("DATABASE_URL")

# Configurações do modelo
MODEL_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models", "saved")
WINDOW_SIZE = 24  # Janela de tempo para análise (24 horas)
PREDICTION_HORIZON = 12  # Horizonte de previsão (12 horas)

# Limites de variáveis para alertas (podem ser ajustados por planta)
THRESHOLDS = {
    "default": {
        "air_temperature": {"min": 18.0, "max": 30.0},
        "air_humidity": {"min": 40.0, "max": 80.0},
        "soil_moisture": {"min": 0, "max": 4095},
        "soil_temperature": {"min": 15.0, "max": 28.0},
        "light_intensity": {"min": 2000.0, "max": 10000.0},
        "water_level": {"min": 20.0, "max": 100.0},
    }
}

# Configurações de logging
LOG_LEVEL = "INFO"
LOG_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "logs", "ai_system.log")

# Configurações da API
API_HOST = "localhost"
API_PORT = 5000