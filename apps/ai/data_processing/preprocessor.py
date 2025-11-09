import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler
import logging

# Configuração de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DataPreprocessor:
    """Classe para pré-processamento de dados de sensores"""
    
    def __init__(self):
        self.scalers = {}
        # Apenas os 4 campos reais de sensores (camelCase do banco de dados)
        self.feature_columns = [
            'airTemperature', 'airHumidity', 
            'soilMoisture', 'soilTemperature'
        ]
        # Mapeamento snake_case para camelCase (compatibilidade)
        self.column_mapping = {
            'air_temperature': 'airTemperature',
            'air_humidity': 'airHumidity',
            'soil_moisture': 'soilMoisture',
            'soil_temperature': 'soilTemperature'
        }
    
    def normalize_column_names(self, df):
        """
        Normaliza os nomes das colunas para o padrão camelCase do banco de dados
        
        Args:
            df: DataFrame com nomes de colunas em snake_case ou camelCase
            
        Returns:
            DataFrame com nomes de colunas normalizados
        """
        normalized_df = df.copy()
        
        # Aplicar mapeamento se necessário
        for old_name, new_name in self.column_mapping.items():
            if old_name in normalized_df.columns and new_name not in normalized_df.columns:
                normalized_df.rename(columns={old_name: new_name}, inplace=True)
                logger.info(f"Renomeada coluna {old_name} para {new_name}")
        
        # Também normalizar timestamp
        if 'timecreated' in normalized_df.columns:
            normalized_df.rename(columns={'timecreated': 'timestamp'}, inplace=True)
        
        return normalized_df
        
    def clean_data(self, df):
        """
        Limpa os dados removendo outliers e preenchendo valores ausentes
        
        Args:
            df: DataFrame com dados de sensores
            
        Returns:
            DataFrame limpo
        """
        logger.info("Iniciando limpeza de dados...")
        
        # Normalizar nomes de colunas primeiro
        clean_df = self.normalize_column_names(df)
        
        # Converter coluna de tempo para datetime
        if 'timestamp' in clean_df.columns:
            clean_df['timestamp'] = pd.to_datetime(clean_df['timestamp'])
            clean_df = clean_df.sort_values('timestamp')
        
        # Remover duplicatas
        original_len = len(clean_df)
        clean_df = clean_df.drop_duplicates()
        if len(clean_df) < original_len:
            logger.info(f"Removidas {original_len - len(clean_df)} entradas duplicadas")
        
        # Lidar com valores ausentes
        for feature in self.feature_columns:
            if feature in clean_df.columns:
                # Verificar valores ausentes
                missing = clean_df[feature].isna().sum()
                if missing > 0:
                    logger.info(f"Preenchendo {missing} valores ausentes na coluna {feature}")
                    # Preencher valores ausentes com média móvel ou interpolação
                    clean_df[feature] = clean_df[feature].interpolate(method='linear')
                
                # Remover outliers (usando IQR)
                Q1 = clean_df[feature].quantile(0.25)
                Q3 = clean_df[feature].quantile(0.75)
                IQR = Q3 - Q1
                lower_bound = Q1 - 1.5 * IQR
                upper_bound = Q3 + 1.5 * IQR
                
                # Substituir outliers por limites
                outliers = ((clean_df[feature] < lower_bound) | (clean_df[feature] > upper_bound)).sum()
                if outliers > 0:
                    logger.info(f"Tratando {outliers} outliers na coluna {feature}")
                    clean_df.loc[clean_df[feature] < lower_bound, feature] = lower_bound
                    clean_df.loc[clean_df[feature] > upper_bound, feature] = upper_bound
        
        logger.info("Limpeza de dados concluída")
        return clean_df
    
    def normalize_data(self, df, fit=True):
        """
        Normaliza os dados para uso no modelo LSTM
        
        Args:
            df: DataFrame com dados de sensores
            fit: Se True, ajusta novos escaladores; se False, usa os existentes
            
        Returns:
            DataFrame normalizado
        """
        logger.info("Normalizando dados...")
        
        normalized_df = df.copy()
        
        for feature in self.feature_columns:
            if feature in normalized_df.columns:
                if fit:
                    self.scalers[feature] = MinMaxScaler(feature_range=(0, 1))
                    normalized_df[feature] = self.scalers[feature].fit_transform(
                        normalized_df[[feature]]
                    )
                else:
                    if feature in self.scalers:
                        normalized_df[feature] = self.scalers[feature].transform(
                            normalized_df[[feature]]
                        )
                    else:
                        logger.warning(f"Nenhum scaler encontrado para {feature}, ajustando novo")
                        self.scalers[feature] = MinMaxScaler(feature_range=(0, 1))
                        normalized_df[feature] = self.scalers[feature].fit_transform(
                            normalized_df[[feature]]
                        )
        
        logger.info("Normalização concluída")
        return normalized_df
    
    def denormalize_data(self, df):
        """
        Reverte a normalização dos dados
        
        Args:
            df: DataFrame com dados normalizados
            
        Returns:
            DataFrame com dados em escala original
        """
        denormalized_df = df.copy()
        
        for feature in self.feature_columns:
            if feature in denormalized_df.columns and feature in self.scalers:
                denormalized_df[feature] = self.scalers[feature].inverse_transform(
                    denormalized_df[[feature]]
                )
        
        return denormalized_df
    
    def create_sequences(self, df, window_size=24, horizon=12, target_col='soil_moisture'):
        """
        Cria sequências para treinar o modelo LSTM
        
        Args:
            df: DataFrame com dados normalizados
            window_size: Tamanho da janela de observação
            horizon: Horizonte de previsão
            target_col: Coluna alvo para previsão
            
        Returns:
            X: Array de sequências de entrada
            y: Array de valores alvo
        """
        logger.info(f"Criando sequências com janela de {window_size} e horizonte de {horizon}")
        
        if target_col not in df.columns:
            logger.error(f"Coluna alvo {target_col} não encontrada no DataFrame")
            return None, None
            
        features = df[self.feature_columns].values
        target = df[target_col].values
        
        X, y = [], []
        
        for i in range(len(df) - window_size - horizon):
            X.append(features[i:i+window_size])
            y.append(target[i+window_size:i+window_size+horizon])
        
        logger.info(f"Criadas {len(X)} sequências de treinamento")
        return np.array(X), np.array(y)
    
    def add_time_features(self, df):
        """
        Adiciona características de tempo ao DataFrame
        
        Args:
            df: DataFrame com coluna 'timestamp'
            
        Returns:
            DataFrame com características de tempo adicionadas
        """
        if 'timestamp' not in df.columns:
            logger.warning("Coluna 'timestamp' não encontrada")
            return df
            
        enhanced_df = df.copy()
        enhanced_df['hour'] = enhanced_df['timestamp'].dt.hour
        enhanced_df['day_of_week'] = enhanced_df['timestamp'].dt.dayofweek
        enhanced_df['month'] = enhanced_df['timestamp'].dt.month
        
        # Convertendo hora para característica cíclica
        enhanced_df['hour_sin'] = np.sin(enhanced_df['hour'] * (2 * np.pi / 24))
        enhanced_df['hour_cos'] = np.cos(enhanced_df['hour'] * (2 * np.pi / 24))
        
        # Convertendo dia da semana para característica cíclica
        enhanced_df['day_sin'] = np.sin(enhanced_df['day_of_week'] * (2 * np.pi / 7))
        enhanced_df['day_cos'] = np.cos(enhanced_df['day_of_week'] * (2 * np.pi / 7))
        
        logger.info("Características de tempo adicionadas ao DataFrame")
        return enhanced_df