"""
Database layer using SQLAlchemy
Provides access to PostgreSQL with type safety matching NestJS backend
"""
import pandas as pd
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
import logging
from typing import Optional, List
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool

# Configuração de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Carrega variáveis de ambiente
load_dotenv()

# Global SQLAlchemy engine
_engine = None
_SessionLocal = None

def get_database_url() -> str:
    """Get database URL from environment"""
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        raise ValueError("DATABASE_URL não configurada no ambiente")
    return database_url

def get_engine():
    """Get or create SQLAlchemy engine singleton"""
    global _engine
    
    if _engine is None:
        database_url = get_database_url()
        _engine = create_engine(
            database_url,
            poolclass=QueuePool,
            pool_size=5,
            max_overflow=10,
            pool_pre_ping=True
        )
        logger.info("✅ SQLAlchemy Engine conectado ao banco de dados")
    
    return _engine

def get_session():
    """Get database session"""
    global _SessionLocal
    
    if _SessionLocal is None:
        engine = get_engine()
        _SessionLocal = sessionmaker(bind=engine)
    
    return _SessionLocal()

def close_database():
    """Close database connections"""
    global _engine, _SessionLocal
    
    if _engine is not None:
        _engine.dispose()
        _engine = None
        _SessionLocal = None
        logger.info("SQLAlchemy Engine desconectado")

def fetch_sensor_data(hours: int = 24, greenhouse_id: Optional[str] = None) -> pd.DataFrame:
    """
    Fetch sensor data from database using SQLAlchemy
    
    Args:
        hours: Number of hours to fetch (default: 24)
        greenhouse_id: Optional Greenhouse ID to filter data
        
    Returns:
        DataFrame with sensor readings (4 real fields only)
    """
    try:
        engine = get_engine()
        
        # Calculate start time
        start_time = datetime.now() - timedelta(hours=hours)
        
        # Build SQL query - table name matches Prisma schema
        query = """
            SELECT 
                id,
                timestamp,
                "airTemperature",
                "airHumidity",
                "soilMoisture",
                "soilTemperature",
                "greenhouseId",
                "plantHealthScore"
            FROM "GreenhouseSensorReading"
            WHERE timestamp >= :start_time
        """
        
        params = {'start_time': start_time}
        
        if greenhouse_id:
            query += ' AND "greenhouseId" = :greenhouse_id'
            params['greenhouse_id'] = greenhouse_id
        
        query += ' ORDER BY timestamp ASC'
        
        # Execute query and convert to DataFrame
        with engine.connect() as conn:
            df = pd.read_sql(text(query), conn, params=params)
        
        if df.empty:
            logger.warning(f"⚠️  Nenhum dado encontrado para as últimas {hours} horas")
            return pd.DataFrame()
        
        # Rename columns to match expected format
        df = df.rename(columns={
            'greenhouseId': 'greenhouse_id',
            'plantHealthScore': 'plantHealthScore'
        })
        
        # Ensure timestamp is datetime
        if 'timestamp' in df.columns:
            df['timestamp'] = pd.to_datetime(df['timestamp'])
        
        # Ensure soilMoisture is float
        if 'soilMoisture' in df.columns:
            df['soilMoisture'] = df['soilMoisture'].astype(float)
        
        logger.info(f"✅ Dados carregados: {len(df)} registros (últimas {hours}h)")
        return df
        
        df = pd.DataFrame(data)
        
        # Ensure timestamp is datetime
        if 'timestamp' in df.columns:
            df['timestamp'] = pd.to_datetime(df['timestamp'])
        
        logger.info(f"✅ Dados carregados: {len(df)} registros (últimas {hours}h)")
        return df
        
    except Exception as e:
        logger.error(f"❌ Erro ao buscar dados dos sensores: {e}")
        raise

def update_plant_health(sensor_id: str, health_score: float, predicted_moisture: Optional[List[float]] = None):
    """
    Update sensor record with AI predictions
    
    Args:
        sensor_id: GreenhouseSensorReading record ID
        health_score: Predicted plant health score (0-100)
        predicted_moisture: Optional array of 12h moisture predictions
    """
    try:
        engine = get_engine()
        
        query = text("""
            UPDATE "GreenhouseSensorReading"
            SET "plantHealthScore" = :health_score
            WHERE id = :sensor_id
        """)
        
        with engine.connect() as conn:
            conn.execute(query, {'sensor_id': sensor_id, 'health_score': health_score})
            conn.commit()
        
        logger.info(f"✅ Health score atualizado: {health_score:.2f} (sensor: {sensor_id[:8]}...)")
        
    except Exception as e:
        logger.error(f"❌ Erro ao atualizar health score: {e}")
        raise

def get_latest_sensor_reading(greenhouse_id: str) -> Optional[dict]:
    """
    Get the latest sensor reading for a greenhouse
    
    Args:
        greenhouse_id: Greenhouse ID
        
    Returns:
        Dict with latest sensor data or None
    """
    try:
        engine = get_engine()
        
        query = text("""
            SELECT 
                id,
                timestamp,
                "airTemperature",
                "airHumidity",
                "soilMoisture",
                "soilTemperature",
                "greenhouseId",
                "plantHealthScore"
            FROM "GreenhouseSensorReading"
            WHERE "greenhouseId" = :greenhouse_id
            ORDER BY timestamp DESC
            LIMIT 1
        """)
        
        with engine.connect() as conn:
            result = conn.execute(query, {'greenhouse_id': greenhouse_id}).fetchone()
        
        if result:
            return {
                'id': result.id,
                'timestamp': result.timestamp,
                'airTemperature': result.airTemperature,
                'airHumidity': result.airHumidity,
                'soilMoisture': float(result.soilMoisture),
                'soilTemperature': result.soilTemperature,
                'greenhouse_id': result.greenhouseId,
                'plantHealthScore': result.plantHealthScore
            }
        
        return None
        
    except Exception as e:
        logger.error(f"❌ Erro ao buscar último registro: {e}")
        return None

def get_greenhouse_info(greenhouse_id: str) -> Optional[dict]:
    """
    Get greenhouse information
    
    Args:
        greenhouse_id: Greenhouse ID
        
    Returns:
        Dict with greenhouse info or None
    """
    try:
        engine = get_engine()
        
        query = text("""
            SELECT 
                id,
                name,
                "ownerId"
            FROM "Greenhouse"
            WHERE id = :greenhouse_id
        """)
        
        with engine.connect() as conn:
            result = conn.execute(query, {'greenhouse_id': greenhouse_id}).fetchone()
        
        if result:
            return {
                'id': result.id,
                'name': result.name,
                'owner_id': result.ownerId
            }
        
        return None
        
    except Exception as e:
        logger.error(f"❌ Erro ao buscar greenhouse: {e}")
        return None

