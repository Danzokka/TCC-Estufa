import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import SQLAlchemyError
import pandas as pd

from ..config.settings import DATABASE_URL

# Configuração de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Criação da engine SQLAlchemy
try:
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base = declarative_base()
    logger.info("Conexão com o banco de dados estabelecida com sucesso")
except Exception as e:
    logger.error(f"Erro ao conectar com o banco de dados: {e}")
    raise

def get_db_session():
    """Fornece uma sessão do banco de dados"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def fetch_sensor_data(user_plant_id=None, days=30):
    """
    Busca dados dos sensores do banco de dados
    
    Args:
        user_plant_id: ID opcional da planta do usuário para filtrar
        days: Número de dias de dados a retornar (padrão: 30)
    
    Returns:
        DataFrame pandas com os dados dos sensores
    """
    try:
        db = next(get_db_session())
        query = """
            SELECT 
                s.*,
                up.nickname as plant_nickname,
                p.name as plant_name,
                p.air_temperature_initial, p.air_temperature_final,
                p.air_humidity_initial, p.air_humidity_final,
                p.soil_moisture_initial, p.soil_moisture_final,
                p.soil_temperature_initial, p.soil_temperature_final,
                p.light_intensity_initial, p.light_intensity_final
            FROM "Sensor" s
            JOIN "UserPlant" up ON s.userPlantId = up.id
            JOIN "Plant" p ON up.plantId = p.id
            WHERE s.timecreated >= NOW() - INTERVAL '{} days'
        """.format(days)
        
        if user_plant_id:
            query += f" AND s.userPlantId = '{user_plant_id}'"
            
        query += " ORDER BY s.timecreated ASC"
        
        df = pd.read_sql(query, engine)
        logger.info(f"Dados de sensores recuperados: {len(df)} registros")
        return df
    
    except SQLAlchemyError as e:
        logger.error(f"Erro ao buscar dados dos sensores: {e}")
        return pd.DataFrame()

def fetch_plant_metadata():
    """
    Busca metadados das plantas do banco de dados
    
    Returns:
        DataFrame pandas com os metadados das plantas
    """
    try:
        db = next(get_db_session())
        query = """
            SELECT 
                p.*
            FROM "Plant" p
        """
        
        df = pd.read_sql(query, engine)
        logger.info(f"Metadados de plantas recuperados: {len(df)} registros")
        return df
    
    except SQLAlchemyError as e:
        logger.error(f"Erro ao buscar metadados das plantas: {e}")
        return pd.DataFrame()

def fetch_user_plants():
    """
    Busca plantas dos usuários do banco de dados
    
    Returns:
        DataFrame pandas com as plantas dos usuários
    """
    try:
        db = next(get_db_session())
        query = """
            SELECT 
                up.*,
                u.username,
                p.name as plant_name
            FROM "UserPlant" up
            JOIN "User" u ON up.userId = u.id
            JOIN "Plant" p ON up.plantId = p.id
        """
        
        df = pd.read_sql(query, engine)
        logger.info(f"Plantas dos usuários recuperadas: {len(df)} registros")
        return df
    
    except SQLAlchemyError as e:
        logger.error(f"Erro ao buscar plantas dos usuários: {e}")
        return pd.DataFrame()