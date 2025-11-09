"""
Script para treinar o modelo LSTM com dados de sensores da estufa
Usa os 4 campos reais: airTemperature, airHumidity, soilMoisture, soilTemperature
"""

import sys
import logging
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
import matplotlib.pyplot as plt

from db.database import fetch_sensor_data
from data_processing.preprocessor import DataPreprocessor
from models.lstm_model import PlantLSTMTrainer
from config.settings import WINDOW_SIZE, PREDICTION_HORIZON

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def plot_training_loss(losses, model_name):
    """Plota a perda de treinamento ao longo das épocas"""
    plt.figure(figsize=(10, 6))
    plt.plot(losses)
    plt.title(f'Perda de Treinamento - {model_name}')
    plt.xlabel('Época')
    plt.ylabel('MSE Loss')
    plt.grid(True)
    plt.savefig(f'training_loss_{model_name}.png')
    logger.info(f"Gráfico de perda salvo em training_loss_{model_name}.png")

def train_soil_moisture_model():
    """
    Treina modelo LSTM para prever umidade do solo
    com base nos 4 campos de sensores
    """
    logger.info("=" * 80)
    logger.info("INICIANDO TREINAMENTO DO MODELO DE PREVISÃO DE UMIDADE DO SOLO")
    logger.info("=" * 80)
    
    # 1. Buscar dados do banco de dados
    logger.info("\n📊 Fase 1: Carregando dados do banco de dados...")
    df = fetch_sensor_data(days=60)  # Últimos 60 dias
    
    if df.empty:
        logger.error("❌ Nenhum dado encontrado no banco de dados!")
        return False
    
    logger.info(f"✅ {len(df)} leituras de sensores carregadas")
    logger.info(f"   Período: {df['timestamp'].min()} até {df['timestamp'].max()}")
    
    # Verificar campos necessários
    required_columns = ['airTemperature', 'airHumidity', 'soilMoisture', 'soilTemperature']
    missing_columns = [col for col in required_columns if col not in df.columns]
    if missing_columns:
        logger.error(f"❌ Colunas faltando: {missing_columns}")
        return False
    
    # 2. Pré-processamento
    logger.info("\n🔧 Fase 2: Pré-processamento dos dados...")
    preprocessor = DataPreprocessor()
    
    # Limpar dados
    clean_df = preprocessor.clean_data(df)
    logger.info(f"✅ Dados limpos: {len(clean_df)} registros")
    
    # Adicionar características temporais
    enhanced_df = preprocessor.add_time_features(clean_df)
    logger.info("✅ Características temporais adicionadas")
    
    # Normalizar dados
    normalized_df = preprocessor.normalize_data(enhanced_df, fit=True)
    logger.info("✅ Dados normalizados (0-1)")
    
    # 3. Criar sequências para LSTM
    logger.info(f"\n📦 Fase 3: Criando sequências temporais...")
    logger.info(f"   Janela de observação: {WINDOW_SIZE} leituras")
    logger.info(f"   Horizonte de previsão: {PREDICTION_HORIZON} passos")
    
    X, y = preprocessor.create_sequences(
        normalized_df,
        window_size=WINDOW_SIZE,
        horizon=PREDICTION_HORIZON,
        target_col='soilMoisture'
    )
    
    if X is None or y is None:
        logger.error("❌ Erro ao criar sequências")
        return False
    
    logger.info(f"✅ Sequências criadas:")
    logger.info(f"   X shape: {X.shape} (samples, timesteps, features)")
    logger.info(f"   y shape: {y.shape} (samples, prediction_horizon)")
    
    # 4. Dividir em treino e validação
    logger.info("\n✂️  Fase 4: Dividindo dados em treino/validação...")
    X_train, X_val, y_train, y_val = train_test_split(
        X, y, test_size=0.2, random_state=42, shuffle=False
    )
    
    logger.info(f"✅ Divisão concluída:")
    logger.info(f"   Treino: {len(X_train)} sequências ({len(X_train)/len(X)*100:.1f}%)")
    logger.info(f"   Validação: {len(X_val)} sequências ({len(X_val)/len(X)*100:.1f}%)")
    
    # 5. Treinar modelo
    logger.info("\n🤖 Fase 5: Treinando modelo LSTM...")
    trainer = PlantLSTMTrainer(feature_columns=preprocessor.feature_columns)
    
    model, losses = trainer.train_model(
        X_train=X_train,
        y_train=y_train,
        model_name='soil_moisture_predictor',
        epochs=100,
        batch_size=32,
        lr=0.001
    )
    
    logger.info(f"✅ Modelo treinado!")
    logger.info(f"   Perda final: {losses[-1]:.4f}")
    logger.info(f"   Perda mínima: {min(losses):.4f} (época {losses.index(min(losses))+1})")
    
    # Plotar perda de treinamento
    plot_training_loss(losses, 'soil_moisture_predictor')
    
    # 6. Validação do modelo
    logger.info("\n✅ Fase 6: Validando modelo...")
    y_pred = trainer.predict(X_val, 'soil_moisture_predictor')
    
    if y_pred is not None:
        # Calcular métricas
        mse = np.mean((y_val - y_pred) ** 2)
        rmse = np.sqrt(mse)
        mae = np.mean(np.abs(y_val - y_pred))
        
        logger.info(f"📊 Métricas de Validação:")
        logger.info(f"   MSE:  {mse:.4f}")
        logger.info(f"   RMSE: {rmse:.4f}")
        logger.info(f"   MAE:  {mae:.4f}")
        
        # Comparar algumas previsões
        logger.info(f"\n🔍 Exemplos de previsões (primeiros 5 passos):")
        for i in range(min(5, len(y_val))):
            logger.info(f"   Amostra {i+1}:")
            logger.info(f"      Real:    {y_val[i][:5]}")
            logger.info(f"      Previsto: {y_pred[i][:5]}")
    
    logger.info("\n" + "=" * 80)
    logger.info("✨ TREINAMENTO CONCLUÍDO COM SUCESSO!")
    logger.info("=" * 80)
    logger.info(f"📁 Modelo salvo em: models/soil_moisture_predictor/")
    logger.info(f"📈 Gráfico de perda: training_loss_soil_moisture_predictor.png")
    
    return True

def train_plant_health_model():
    """
    Treina modelo para calcular o score de saúde da planta
    com base nos 4 campos de sensores
    """
    logger.info("=" * 80)
    logger.info("INICIANDO TREINAMENTO DO MODELO DE SAÚDE DA PLANTA")
    logger.info("=" * 80)
    
    # 1. Buscar dados do banco de dados
    logger.info("\n📊 Fase 1: Carregando dados do banco de dados...")
    df = fetch_sensor_data(days=60)
    
    if df.empty:
        logger.error("❌ Nenhum dado encontrado no banco de dados!")
        return False
    
    logger.info(f"✅ {len(df)} leituras de sensores carregadas")
    
    # 2. Preparar dados para classificação de saúde
    logger.info("\n🔧 Fase 2: Preparando dados para classificação...")
    
    # Calcular score de saúde baseado em targets da estufa
    df['health_score'] = 100.0  # Score inicial
    
    # Penalizar desvios dos valores target
    if 'targetTemperature' in df.columns:
        temp_deviation = abs(df['airTemperature'] - df['targetTemperature']) / df['targetTemperature']
        df['health_score'] -= temp_deviation * 20
    
    if 'targetHumidity' in df.columns:
        humidity_deviation = abs(df['airHumidity'] - df['targetHumidity']) / df['targetHumidity']
        df['health_score'] -= humidity_deviation * 20
    
    if 'targetSoilMoisture' in df.columns:
        soil_deviation = abs(df['soilMoisture'] - df['targetSoilMoisture']) / df['targetSoilMoisture']
        df['health_score'] -= soil_deviation * 30
    
    # Limitar entre 0 e 100
    df['health_score'] = df['health_score'].clip(0, 100)
    
    logger.info(f"✅ Health score calculado:")
    logger.info(f"   Média: {df['health_score'].mean():.2f}")
    logger.info(f"   Min: {df['health_score'].min():.2f}")
    logger.info(f"   Max: {df['health_score'].max():.2f}")
    
    # 3. Pré-processar e treinar
    preprocessor = DataPreprocessor()
    clean_df = preprocessor.clean_data(df)
    normalized_df = preprocessor.normalize_data(clean_df, fit=True)
    
    # Criar sequências com health_score como target
    X, y = preprocessor.create_sequences(
        normalized_df,
        window_size=WINDOW_SIZE,
        horizon=1,  # Prever apenas próximo score
        target_col='health_score'
    )
    
    if X is None or y is None:
        logger.error("❌ Erro ao criar sequências")
        return False
    
    logger.info(f"✅ Sequências criadas: X{X.shape}, y{y.shape}")
    
    # Dividir dados
    X_train, X_val, y_train, y_val = train_test_split(
        X, y, test_size=0.2, random_state=42, shuffle=False
    )
    
    # Treinar
    trainer = PlantLSTMTrainer(feature_columns=preprocessor.feature_columns)
    model, losses = trainer.train_model(
        X_train=X_train,
        y_train=y_train,
        model_name='plant_health_predictor',
        epochs=100,
        batch_size=32,
        lr=0.001
    )
    
    logger.info(f"✅ Modelo de saúde treinado!")
    logger.info(f"   Perda final: {losses[-1]:.4f}")
    
    plot_training_loss(losses, 'plant_health_predictor')
    
    logger.info("\n✨ TREINAMENTO DO MODELO DE SAÚDE CONCLUÍDO!")
    
    return True

if __name__ == "__main__":
    logger.info("🌱 Sistema de Treinamento de IA - Estufa Inteligente")
    logger.info(f"   Usando 4 campos de sensores reais")
    logger.info(f"   Window Size: {WINDOW_SIZE}")
    logger.info(f"   Prediction Horizon: {PREDICTION_HORIZON}\n")
    
    # Treinar modelo de umidade do solo
    success_moisture = train_soil_moisture_model()
    
    if success_moisture:
        # Treinar modelo de saúde da planta
        success_health = train_plant_health_model()
        
        if success_health:
            logger.info("\n🎉 TODOS OS MODELOS TREINADOS COM SUCESSO!")
            sys.exit(0)
    
    logger.error("\n❌ Falha no treinamento dos modelos")
    sys.exit(1)
