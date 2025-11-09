"""
Database layer using Prisma Client Python
Provides async access to PostgreSQL with type safety matching NestJS backend
"""
import pandas as pd
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
import logging
from typing import Optional, List
import asyncio

from prisma import Prisma
from prisma.models import GreenhouseSensorReading

# Configuração de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Carrega variáveis de ambiente
load_dotenv()

# Global Prisma client instance
_prisma_client: Optional[Prisma] = None

async def get_prisma_client() -> Prisma:
    """
    Get or create Prisma client singleton
    Ensures only one connection is maintained
    """
    global _prisma_client
    
    if _prisma_client is None:
        _prisma_client = Prisma()
        await _prisma_client.connect()
        logger.info("✅ Prisma Client Python conectado ao banco de dados")
    
    return _prisma_client

async def close_prisma_client():
    """Close Prisma client connection"""
    global _prisma_client
    
    if _prisma_client is not None:
        await _prisma_client.disconnect()
        _prisma_client = None
        logger.info("Prisma Client desconectado")

async def fetch_sensor_data_async(hours: int = 24, greenhouse_id: Optional[str] = None) -> pd.DataFrame:
    """
    Fetch sensor data from database using Prisma Client Python
    
    Args:
        hours: Number of hours to fetch (default: 24)
        greenhouse_id: Optional Greenhouse ID to filter data
        
    Returns:
        DataFrame with sensor readings (4 real fields only)
    """
    try:
        prisma = await get_prisma_client()
        
        # Calculate start time
        start_time = datetime.now() - timedelta(hours=hours)
        
        # Build query filters
        where_conditions = {
            'timestamp': {
                'gte': start_time
            }
        }
        
        if greenhouse_id:
            where_conditions['greenhouseId'] = greenhouse_id
        
        # Fetch data using Prisma
        sensors: List[GreenhouseSensorReading] = await prisma.greenhousesensorreading.find_many(
            where=where_conditions,
            order={
                'timestamp': 'asc'
            }
        )
        
        if not sensors:
            logger.warning(f"⚠️  Nenhum dado encontrado para as últimas {hours} horas")
            return pd.DataFrame()
        
        # Convert to DataFrame
        data = []
        for sensor in sensors:
            data.append({
                'id': sensor.id,
                'timestamp': sensor.timestamp,
                'airTemperature': sensor.airTemperature,
                'airHumidity': sensor.airHumidity,
                'soilMoisture': float(sensor.soilMoisture),  # Convert Int to Float
                'soilTemperature': sensor.soilTemperature,
                'greenhouse_id': sensor.greenhouseId,
                'plantHealthScore': sensor.plantHealthScore,
            })
        
        df = pd.DataFrame(data)
        
        # Ensure timestamp is datetime
        if 'timestamp' in df.columns:
            df['timestamp'] = pd.to_datetime(df['timestamp'])
        
        logger.info(f"✅ Dados carregados: {len(df)} registros (últimas {hours}h)")
        return df
        
    except Exception as e:
        logger.error(f"❌ Erro ao buscar dados dos sensores: {e}")
        raise

def fetch_sensor_data(hours: int = 24, greenhouse_id: Optional[str] = None) -> pd.DataFrame:
    """
    Synchronous wrapper for async fetch_sensor_data_async
    Used for compatibility with existing Flask code
    
    Args:
        hours: Number of hours to fetch
        greenhouse_id: Optional Greenhouse ID filter
        
    Returns:
        DataFrame with sensor data
    """
    global _prisma_client
    
    try:
        # Always create a fresh event loop for each request to avoid conflicts
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        async def fetch_with_fresh_connection():
            # Disconnect old client if exists
            global _prisma_client
            if _prisma_client is not None:
                try:
                    await _prisma_client.disconnect()
                except:
                    pass
                _prisma_client = None
            
            # Fetch data (will create new connection)
            return await fetch_sensor_data_async(hours, greenhouse_id)
        
        result = loop.run_until_complete(fetch_with_fresh_connection())
        loop.close()
        
        return result
        
    except Exception as e:
        logger.error(f"❌ Erro na busca síncrona: {e}")
        raise

async def update_plant_health_async(sensor_id: str, health_score: float, predicted_moisture: Optional[List[float]] = None):
    """
    Update sensor record with AI predictions
    
    Args:
        sensor_id: GreenhouseSensorReading record ID
        health_score: Predicted plant health score (0-100)
        predicted_moisture: Optional array of 12h moisture predictions
    """
    try:
        prisma = await get_prisma_client()
        
        update_data = {
            'plantHealthScore': health_score
        }
        
        # Note: predictedMoisture not in GreenhouseSensorReading model
        # Health score is the main AI prediction stored
        
        await prisma.greenhousesensorreading.update(
            where={'id': sensor_id},
            data=update_data
        )
        
        logger.info(f"✅ Health score atualizado: {health_score:.2f} (sensor: {sensor_id[:8]}...)")
        
    except Exception as e:
        logger.error(f"❌ Erro ao atualizar health score: {e}")
        raise

def update_plant_health(sensor_id: str, health_score: float, predicted_moisture: Optional[List[float]] = None):
    """
    Synchronous wrapper for update_plant_health_async
    
    Args:
        sensor_id: Sensor record ID
        health_score: Predicted plant health score
        predicted_moisture: Optional moisture predictions
    """
    global _prisma_client
    
    try:
        # Always create a fresh event loop for each request
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        async def update_with_fresh_connection():
            # Disconnect old client if exists
            global _prisma_client
            if _prisma_client is not None:
                try:
                    await _prisma_client.disconnect()
                except:
                    pass
                _prisma_client = None
            
            # Update (will create new connection)
            return await update_plant_health_async(sensor_id, health_score, predicted_moisture)
        
        loop.run_until_complete(update_with_fresh_connection())
        loop.close()
        
    except Exception as e:
        logger.error(f"❌ Erro na atualização síncrona: {e}")
        raise
