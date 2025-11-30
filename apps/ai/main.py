#!/usr/bin/env python3
"""
Sistema de IA para análise de dados da estufa inteligente
Este módulo principal inicializa a API e o sistema de análise de dados.
"""

import os
import argparse
import logging
from dotenv import load_dotenv

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("ai_system.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Carregar variáveis de ambiente
load_dotenv()

# Verificar variáveis de ambiente essenciais
if "DATABASE_URL" not in os.environ:
    logger.warning("Variável de ambiente DATABASE_URL não encontrada!")
    os.environ["DATABASE_URL"] = "postgresql://user:password@localhost:5432/estufa"
    logger.info("Usando DATABASE_URL padrão para desenvolvimento local")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Sistema de IA para análise de dados da estufa')
    parser.add_argument('--train', action='store_true', help='Treinar modelos iniciais')
    parser.add_argument('--analyze', action='store_true', help='Analisar dados atuais sem iniciar a API')
    args = parser.parse_args()

    # Importar módulos necessários (importação tardia para evitar problemas de dependência circular)
    from api.api_service import start_api, update_sensor_data, generate_all_insights
    from db.database import fetch_user_plants
    from models.lstm_model import PlantLSTMTrainer
    
    if args.train:
        # Treinar modelos iniciais com dados existentes
        from data_processing.preprocessor import DataPreprocessor
        
        logger.info("Iniciando treinamento inicial de modelos...")
        user_plants = fetch_user_plants()
        
        if not user_plants.empty:
            data_processor = DataPreprocessor()
            feature_columns = [
                'air_temperature', 'air_humidity', 'soil_moisture', 
                'soil_temperature', 'water_level', 'water_reserve'
            ]
            model_trainer = PlantLSTMTrainer(feature_columns)
            
            # Treinar modelo default para cada variável monitorada
            from api.api_service import train_plant_model
            
            variables = ['soil_moisture', 'air_temperature', 'air_humidity']
            for var in variables:
                logger.info(f"Treinando modelo default para {var}...")
                # Selecionar a primeira planta para treinar o modelo default
                if len(user_plants) > 0:
                    user_plant_id = user_plants['id'].iloc[0]
                    train_plant_model(user_plant_id, var, 60)  # 60 dias de dados
        
        logger.info("Treinamento inicial concluído!")
    
    elif args.analyze:
        # Executar análise pontual sem iniciar a API
        logger.info("Iniciando análise pontual de dados...")
        
        # Atualizar dados e gerar insights
        update_sensor_data()
        generate_all_insights()
        
        logger.info("Análise pontual concluída!")
    
    else:
        # Iniciar a API normalmente
        logger.info("Iniciando sistema de IA para análise de dados da estufa...")
        start_api()