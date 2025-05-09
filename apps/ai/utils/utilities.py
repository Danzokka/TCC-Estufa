"""
Funções utilitárias para o sistema de IA da estufa inteligente.
"""

import os
import json
import numpy as np
import pandas as pd
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

def create_directory_if_not_exists(directory_path):
    """
    Cria um diretório se ele não existir
    
    Args:
        directory_path: Caminho do diretório
    """
    if not os.path.exists(directory_path):
        os.makedirs(directory_path)
        logger.info(f"Diretório criado: {directory_path}")

def save_json(data, filepath):
    """
    Salva dados em formato JSON
    
    Args:
        data: Dados a serem salvos
        filepath: Caminho do arquivo
    """
    try:
        # Garantir que o diretório existe
        directory = os.path.dirname(filepath)
        create_directory_if_not_exists(directory)
        
        # Converter qualquer NumPy array ou valor especial para Python nativo
        class NumpyEncoder(json.JSONEncoder):
            def default(self, obj):
                if isinstance(obj, np.ndarray):
                    return obj.tolist()
                if isinstance(obj, np.integer):
                    return int(obj)
                if isinstance(obj, np.floating):
                    return float(obj)
                if isinstance(obj, datetime):
                    return obj.isoformat()
                if pd.isna(obj):
                    return None
                return super(NumpyEncoder, self).default(obj)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, cls=NumpyEncoder, ensure_ascii=False, indent=4)
            
        logger.info(f"Dados salvos em {filepath}")
        return True
    except Exception as e:
        logger.error(f"Erro ao salvar JSON em {filepath}: {e}")
        return False

def load_json(filepath):
    """
    Carrega dados de um arquivo JSON
    
    Args:
        filepath: Caminho do arquivo
        
    Returns:
        Dados carregados ou None se ocorrer erro
    """
    try:
        if not os.path.exists(filepath):
            logger.warning(f"Arquivo não encontrado: {filepath}")
            return None
            
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        logger.info(f"Dados carregados de {filepath}")
        return data
    except Exception as e:
        logger.error(f"Erro ao carregar JSON de {filepath}: {e}")
        return None

def save_dataframe(df, filepath, format='csv'):
    """
    Salva DataFrame em arquivo
    
    Args:
        df: DataFrame a ser salvo
        filepath: Caminho do arquivo
        format: Formato do arquivo ('csv' ou 'parquet')
    """
    try:
        # Garantir que o diretório existe
        directory = os.path.dirname(filepath)
        create_directory_if_not_exists(directory)
        
        if format.lower() == 'csv':
            df.to_csv(filepath, index=False, encoding='utf-8')
        elif format.lower() == 'parquet':
            df.to_parquet(filepath, index=False)
        else:
            logger.error(f"Formato não suportado: {format}")
            return False
            
        logger.info(f"DataFrame salvo em {filepath}")
        return True
    except Exception as e:
        logger.error(f"Erro ao salvar DataFrame em {filepath}: {e}")
        return False

def load_dataframe(filepath, format='csv'):
    """
    Carrega DataFrame de um arquivo
    
    Args:
        filepath: Caminho do arquivo
        format: Formato do arquivo ('csv' ou 'parquet')
        
    Returns:
        DataFrame carregado ou None se ocorrer erro
    """
    try:
        if not os.path.exists(filepath):
            logger.warning(f"Arquivo não encontrado: {filepath}")
            return None
            
        if format.lower() == 'csv':
            df = pd.read_csv(filepath)
        elif format.lower() == 'parquet':
            df = pd.read_parquet(filepath)
        else:
            logger.error(f"Formato não suportado: {format}")
            return None
            
        logger.info(f"DataFrame carregado de {filepath}")
        return df
    except Exception as e:
        logger.error(f"Erro ao carregar DataFrame de {filepath}: {e}")
        return None

def format_timestamp(timestamp):
    """
    Formata um timestamp para exibição amigável
    
    Args:
        timestamp: Timestamp para formatar (datetime ou string)
        
    Returns:
        String formatada com o timestamp
    """
    if isinstance(timestamp, str):
        try:
            timestamp = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
        except:
            try:
                timestamp = datetime.strptime(timestamp, '%Y-%m-%dT%H:%M:%S.%f')
            except:
                return timestamp
    
    if isinstance(timestamp, datetime):
        return timestamp.strftime('%d/%m/%Y %H:%M:%S')
        
    return str(timestamp)