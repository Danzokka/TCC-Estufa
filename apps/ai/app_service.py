"""
Flask API Service - IoT Greenhouse AI Platform
Serviço completo de IA com análise de saúde, previsões LSTM e irrigação inteligente

Run: python3 app_service.py
Endpoints:
  Health & Info:
  - GET  /health                     - Health check
  - GET  /models/info                - Model information  
  
  Analysis:
  - POST /analyze-sensors            - Análise completa de saúde da planta
  - POST /predict/moisture           - Predição específica de umidade  
  - POST /predict/health             - Predição específica de saúde
  
  Irrigation:
  - POST /irrigation/configure       - Configurar greenhouse para irrigação
  - GET  /irrigation/status          - Status do sistema de irrigação
  - POST /irrigation/analyze         - Analisar necessidade de irrigação
  - POST /irrigation/execute         - Executar irrigação
  - POST /irrigation/start-monitor   - Iniciar monitoramento automático
  - POST /irrigation/stop-monitor    - Parar monitoramento
  - GET  /irrigation/plants          - Listar tipos de plantas disponíveis
"""
import sys
import os
from pathlib import Path

# Add parent directory to Python path
sys.path.insert(0, str(Path(__file__).parent.parent))

from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
import pandas as pd
from datetime import datetime
from typing import Dict, List, Any, Optional
import numpy as np
import logging

from models.lstm_model import LSTMModel  # Use LSTMModel directly
from data_processing.preprocessor import DataPreprocessor
from db.database import fetch_sensor_data
from config.settings import MODELS_DIR
from services.irrigation_service import SmartIrrigationService, PlantKnowledgeBase

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)

# CORS - Allow NestJS backend, Next.js frontend and ESP32 devices
CORS(app, origins=[
    'http://localhost:5000',  # NestJS API  
    'http://localhost:3000',  # Next.js frontend
    'http://localhost:3001',  # Alternative port
    'http://192.168.*.*'      # ESP32 devices on local network
])

# Global storage for loaded models
loaded_models: Dict[str, Dict] = {}
preprocessor: Optional[DataPreprocessor] = None

# Smart Irrigation Service (initialized after models load)
irrigation_service: Optional[SmartIrrigationService] = None

def initialize_models() -> bool:
    """
    Load trained LSTM models on startup
    Returns True if at least one model loaded successfully
    """
    global loaded_models, preprocessor
    
    try:
        print("\n" + "=" * 70)
        print("🔄 INICIALIZANDO MODELOS AI/ML")
        print("=" * 70)
        
        # Initialize preprocessor
        preprocessor = DataPreprocessor()
        print("✅ Preprocessor inicializado")
        
        # Feature columns matching training
        feature_columns = ['airTemperature', 'airHumidity', 'soilMoisture', 'soilTemperature']
        
        # Load Soil Moisture Predictor
        soil_path = MODELS_DIR / 'soil_moisture_predictor' / 'soil_moisture_predictor_latest.pt'
        if soil_path.exists():
            print(f"\n📦 Carregando: Soil Moisture Predictor")
            print(f"   Path: {soil_path}")
            
            # Load checkpoint - it's the state_dict directly, not a dictionary
            state_dict = torch.load(soil_path, map_location='cpu')
            
            # Create model directly using LSTMModel
            model = LSTMModel(
                input_size=len(feature_columns),
                hidden_size=64,
                num_layers=2,
                output_size=12,  # 12 hours prediction
                dropout=0.2
            )
            model.load_state_dict(state_dict)
            model.eval()
            
            loaded_models['soil_moisture'] = {
                'model': model,
                'prediction_horizon': 12,  # 12 hours
                'window_size': 24,         # 24 hours historical
                'feature_columns': feature_columns
            }
            
            print(f"   ✅ Loaded successfully")
            print(f"   📊 Horizon: {loaded_models['soil_moisture']['prediction_horizon']}h")
            print(f"   📏 Window: {loaded_models['soil_moisture']['window_size']}h")
        else:
            print(f"\n⚠️  Soil Moisture Predictor NOT FOUND: {soil_path}")
        
        # Load Plant Health Predictor
        health_path = MODELS_DIR / 'plant_health_predictor' / 'plant_health_predictor_latest.pt'
        if health_path.exists():
            print(f"\n📦 Carregando: Plant Health Predictor")
            print(f"   Path: {health_path}")
            
            # Load checkpoint - it's the state_dict directly, not a dictionary
            state_dict = torch.load(health_path, map_location='cpu')
            
            # Create model directly using LSTMModel
            model = LSTMModel(
                input_size=len(feature_columns),
                hidden_size=64,
                num_layers=2,
                output_size=1,  # Single health score
                dropout=0.2
            )
            model.load_state_dict(state_dict)
            model.eval()
            
            loaded_models['plant_health'] = {
                'model': model,
                'prediction_horizon': 1,   # Current health score
                'window_size': 24,         # 24 hours historical
                'feature_columns': feature_columns
            }
            
            print(f"   ✅ Loaded successfully")
            print(f"   📊 Output: Health Score (0-100)")
            print(f"   📏 Window: {loaded_models['plant_health']['window_size']}h")
        else:
            print(f"\n⚠️  Plant Health Predictor NOT FOUND: {health_path}")
        
        print("\n" + "=" * 70)
        if loaded_models:
            print(f"✅ SUCCESS: {len(loaded_models)} modelos carregados")
            print(f"   Models: {list(loaded_models.keys())}")
            return True
        else:
            print("❌ ERROR: Nenhum modelo foi carregado")
            return False
            
    except Exception as e:
        print(f"\n❌ ERRO ao carregar modelos: {e}")
        import traceback
        traceback.print_exc()
        return False


def map_health_status(score: float) -> str:
    """Map numeric health score to categorical status"""
    if score >= 80:
        return "HEALTHY"
    elif score >= 50:
        return "MODERATE_STRESS"
    else:
        return "HIGH_STRESS"


def generate_recommendations(health_score: float, moisture_predictions: List[float]) -> List[str]:
    """Generate actionable recommendations"""
    recs = []
    
    # Health recommendations
    if health_score < 50:
        recs.append("⚠️ ALERTA CRÍTICO: Saúde da planta muito baixa! Ação imediata necessária")
        recs.append("🔍 Verificar: temperatura, umidade, iluminação e pragas")
    elif health_score < 70:
        recs.append("⚡ ATENÇÃO: Planta com sinais moderados de estresse")
        recs.append("📊 Monitorar de perto as próximas 24h")
    elif health_score < 90:
        recs.append("✅ Planta em boa condição, mas pode melhorar")
    else:
        recs.append("🌟 EXCELENTE: Planta em condição ideal!")
    
    # Moisture recommendations
    if moisture_predictions:
        avg_moisture = np.mean(moisture_predictions)
        min_moisture = np.min(moisture_predictions)
        max_moisture = np.max(moisture_predictions)
        
        if min_moisture < 15:
            recs.append("💧 CRÍTICO: Umidade cairá abaixo de 15% - irrigação urgente!")
        elif avg_moisture < 30:
            recs.append("💧 Umidade baixa prevista - considere irrigar nas próximas horas")
        elif avg_moisture > 75:
            recs.append("🌊 Umidade alta prevista - reduzir frequência de irrigação")
        elif 40 <= avg_moisture <= 60:
            recs.append("✅ Umidade ideal prevista - manter regime atual")
    
    return recs


@app.route('/health', methods=['GET'])
def health_check():
    """Service health check"""
    global irrigation_service
    
    irrigation_status = None
    if irrigation_service:
        irrigation_status = irrigation_service.get_status()
    
    return jsonify({
        'status': 'healthy',
        'service': 'IoT Greenhouse AI Service',
        'timestamp': datetime.now().isoformat(),
        'models_loaded': list(loaded_models.keys()),
        'models_count': len(loaded_models),
        'irrigation_service': irrigation_status,
        'version': '2.0.0'
    }), 200


@app.route('/models/info', methods=['GET'])
def models_info():
    """Get detailed information about loaded models"""
    info = {}
    
    for model_name, model_data in loaded_models.items():
        # Get device from model parameters
        device = next(model_data['model'].parameters()).device if hasattr(model_data['model'], 'parameters') else 'cpu'
        
        info[model_name] = {
            'name': model_name,
            'prediction_horizon': model_data['prediction_horizon'],
            'window_size': model_data['window_size'],
            'feature_columns': model_data['feature_columns'],
            'device': str(device),
            'architecture': {
                'input_size': len(model_data['feature_columns']),
                'hidden_size': 64,  # From training config
                'num_layers': 2,
                'output_size': model_data['prediction_horizon']
            }
        }
    
    return jsonify({
        'models': info,
        'total_models': len(info),
        'timestamp': datetime.now().isoformat()
    }), 200


@app.route('/analyze-sensors', methods=['POST'])
def analyze_sensors():
    """
    Main endpoint: Complete plant health analysis
    
    Request Body:
    {
        "greenhouseId": "uuid-string",
        "historical_hours": 24,        // Optional, default 24
        "include_predictions": true    // Optional, default true
    }
    
    Response:
    {
        "healthStatus": "HEALTHY" | "MODERATE_STRESS" | "HIGH_STRESS",
        "healthScore": 85.5,
        "confidence": 0.92,
        "predictedMoisture": [45.2, 44.8, 43.5, ...],  // 12 hours
        "recommendations": ["...", "..."],
        "timestamp": "2024-11-09T15:00:00Z",
        "metadata": {
            "model_version": "v1.0",
            "samples_used": 24,
            "prediction_window": "12h"
        }
    }
    """
    try:
        # Parse request
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Request body required'}), 400
        
        greenhouse_id = data.get('greenhouseId')
        if not greenhouse_id:
            return jsonify({'error': 'greenhouseId is required'}), 400
        
        historical_hours = data.get('historical_hours', 24)
        include_predictions = data.get('include_predictions', True)
        
        print(f"\n{'='*60}")
        print(f"📊 ANÁLISE SOLICITADA")
        print(f"{'='*60}")
        print(f"UserPlant ID: {greenhouse_id}")
        print(f"Historical Hours: {historical_hours}")
        print(f"Include Predictions: {include_predictions}")
        
        # Check models loaded
        if not loaded_models:
            return jsonify({
                'error': 'Models not available',
                'message': 'AI models failed to load. Check server logs.'
            }), 503
        
        # Fetch sensor data
        print(f"\n🔍 Buscando dados de sensores...")
        df = fetch_sensor_data(hours=historical_hours, greenhouse_id=greenhouse_id)
        
        if df is None or len(df) == 0:
            return jsonify({
                'error': 'No data available',
                'message': f'No sensor data found for greenhouseId {greenhouse_id}'
            }), 404
        
        print(f"✅ {len(df)} leituras encontradas")
        
        # Validate minimum data requirement
        if len(df) < 24:
            return jsonify({
                'error': 'Insufficient data',
                'message': f'Need at least 24 readings, found {len(df)}. Continue collecting data.'
            }), 422
        
        # Preprocess data
        print(f"\n🔧 Preprocessando dados...")
        
        # Clean
        df_clean = preprocessor.clean_data(df)
        print(f"   ✓ Cleaned: {len(df_clean)} records")
        
        # Add time features
        df_features = preprocessor.add_time_features(df_clean)
        print(f"   ✓ Time features added")
        
        # Select features matching training
        feature_columns = ['airTemperature', 'airHumidity', 'soilMoisture', 'soilTemperature']
        df_features = df_features[feature_columns].copy()
        
        # Normalize
        df_normalized = preprocessor.normalize_data(df_features)
        print(f"   ✓ Normalized: {len(df_normalized)} samples")
        
        # Prepare response
        results = {
            'timestamp': datetime.now().isoformat(),
            'greenhouseId': greenhouse_id,
            'metadata': {
                'samples_used': len(df_normalized),
                'historical_hours': historical_hours,
                'model_version': 'v1.0'
            }
        }
        
        # PLANT HEALTH PREDICTION
        if 'plant_health' in loaded_models and include_predictions:
            print(f"\n🧠 Predizendo saúde da planta...")
            
            health_model_data = loaded_models['plant_health']
            model = health_model_data['model']
            window_size = health_model_data['window_size']
            
            if len(df_normalized) >= window_size:
                # Get recent window
                recent_data = df_normalized.tail(window_size)
                
                # Get model device
                device = next(model.parameters()).device if hasattr(model, 'parameters') else torch.device('cpu')
                
                # Convert to tensor [batch=1, window_size, features] and move to model device
                input_tensor = torch.FloatTensor(recent_data.values).unsqueeze(0).to(device)
                
                # Predict - model is already the LSTMModel instance
                with torch.no_grad():
                    prediction = model(input_tensor)
                    health_score = float(prediction[0][0].item())
                
                # Map status
                health_status = map_health_status(health_score)
                
                results['healthScore'] = round(health_score, 2)
                results['healthStatus'] = health_status
                results['confidence'] = 0.85  # Could be calculated from model uncertainty
                
                print(f"   ✅ Health Score: {health_score:.2f} ({health_status})")
            else:
                print(f"   ⚠️  Insufficient data ({len(df_normalized)}/{window_size})")
        
        # SOIL MOISTURE PREDICTION
        if 'soil_moisture' in loaded_models and include_predictions:
            print(f"\n💧 Predizendo umidade do solo...")
            
            moisture_model_data = loaded_models['soil_moisture']
            model = moisture_model_data['model']
            window_size = moisture_model_data['window_size']
            horizon = moisture_model_data['prediction_horizon']
            
            if len(df_normalized) >= window_size:
                # Get recent window
                recent_data = df_normalized.tail(window_size)
                
                # Get model device
                device = next(model.parameters()).device if hasattr(model, 'parameters') else torch.device('cpu')
                
                # Convert to tensor [batch=1, window_size, features] and move to model device
                input_tensor = torch.FloatTensor(recent_data.values).unsqueeze(0).to(device)
                
                # Predict - model is already the LSTMModel instance
                with torch.no_grad():
                    prediction = model(input_tensor)
                    predicted_moisture_norm = prediction[0].tolist()  # [horizon]
                
                # Convert from normalized (0-1) to percentage (0-100)
                # Model output is normalized, scale to percentage
                predicted_moisture = [round(m * 100, 2) for m in predicted_moisture_norm[:horizon]]
                
                results['predictedMoisture'] = predicted_moisture
                results['metadata']['prediction_window'] = f"{horizon}h"
                
                print(f"   ✅ Próximas {horizon}h: {predicted_moisture[:4]}...")
            else:
                print(f"   ⚠️  Insufficient data ({len(df_normalized)}/{window_size})")
        
        # GENERATE RECOMMENDATIONS
        health_score = results.get('healthScore', 80)
        predicted_moisture = results.get('predictedMoisture', [])
        
        recommendations = generate_recommendations(health_score, predicted_moisture)
        results['recommendations'] = recommendations
        
        print(f"\n✅ ANÁLISE CONCLUÍDA")
        print(f"{'='*60}\n")
        
        return jsonify(results), 200
        
    except Exception as e:
        print(f"\n❌ ERRO na análise: {e}")
        import traceback
        traceback.print_exc()
        
        return jsonify({
            'error': 'Internal server error',
            'message': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500


@app.route('/predict/moisture', methods=['POST'])
def predict_moisture():
    """Endpoint específico para predição de umidade do solo"""
    try:
        data = request.get_json()
        greenhouse_id = data.get('greenhouseId')
        
        if not greenhouse_id:
            return jsonify({'error': 'greenhouseId is required'}), 400
        
        if 'soil_moisture' not in loaded_models:
            return jsonify({'error': 'Soil moisture model not loaded'}), 503
        
        # Fetch and process data (same as analyze_sensors)
        df = fetch_sensor_data(hours=24, greenhouse_id=greenhouse_id)
        
        if df is None or len(df) < 24:
            return jsonify({'error': 'Insufficient data (minimum 24 readings required)'}), 422
        
        # Preprocess
        df_clean = preprocessor.clean_data(df)
        df_features = preprocessor.add_time_features(df_clean)
        feature_columns = ['airTemperature', 'airHumidity', 'soilMoisture', 'soilTemperature']
        df_features = df_features[feature_columns].copy()
        df_normalized = preprocessor.normalize_data(df_features)
        
        # Predict
        model_data = loaded_models['soil_moisture']
        model = model_data['model']
        window_size = model_data['window_size']
        
        # Get model device
        device = next(model.parameters()).device if hasattr(model, 'parameters') else torch.device('cpu')
        
        recent_data = df_normalized.tail(window_size)
        input_tensor = torch.FloatTensor(recent_data.values).unsqueeze(0).to(device)
        
        with torch.no_grad():
            prediction = model(input_tensor)
            predicted_moisture = [round(m * 100, 2) for m in prediction[0].tolist()]
        
        return jsonify({
            'greenhouseId': greenhouse_id,
            'predictedMoisture': predicted_moisture,
            'predictionHorizon': len(predicted_moisture),
            'unit': 'percentage',
            'timestamp': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        print(f"❌ Erro: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/predict/health', methods=['POST'])
def predict_health():
    """Endpoint específico para predição de saúde da planta"""
    try:
        data = request.get_json()
        greenhouse_id = data.get('greenhouseId')
        
        if not greenhouse_id:
            return jsonify({'error': 'greenhouseId is required'}), 400
        
        if 'plant_health' not in loaded_models:
            return jsonify({'error': 'Plant health model not loaded'}), 503
        
        # Fetch and process data
        df = fetch_sensor_data(hours=24, greenhouse_id=greenhouse_id)
        
        if df is None or len(df) < 24:
            return jsonify({'error': 'Insufficient data (minimum 24 readings required)'}), 422
        
        # Preprocess
        df_clean = preprocessor.clean_data(df)
        df_features = preprocessor.add_time_features(df_clean)
        feature_columns = ['airTemperature', 'airHumidity', 'soilMoisture', 'soilTemperature']
        df_features = df_features[feature_columns].copy()
        df_normalized = preprocessor.normalize_data(df_features)
        
        # Predict
        model_data = loaded_models['plant_health']
        model = model_data['model']
        window_size = model_data['window_size']
        
        # Get model device
        device = next(model.parameters()).device if hasattr(model, 'parameters') else torch.device('cpu')
        
        recent_data = df_normalized.tail(window_size)
        input_tensor = torch.FloatTensor(recent_data.values).unsqueeze(0).to(device)
        
        with torch.no_grad():
            prediction = model(input_tensor)
            health_score = float(prediction[0][0].item())
        
        health_status = map_health_status(health_score)
        
        return jsonify({
            'greenhouseId': greenhouse_id,
            'healthScore': round(health_score, 2),
            'healthStatus': health_status,
            'confidence': 0.85,
            'timestamp': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        print(f"❌ Erro: {e}")
        return jsonify({'error': str(e)}), 500


# ============================================================
# IRRIGATION ENDPOINTS
# ============================================================

@app.route('/irrigation/plants', methods=['GET'])
def get_plant_types():
    """Lista tipos de plantas disponíveis e suas configurações de umidade"""
    plants = PlantKnowledgeBase.get_all_plants()
    return jsonify({
        'plants': plants,
        'count': len(plants),
        'timestamp': datetime.now().isoformat()
    }), 200


@app.route('/irrigation/configure', methods=['POST'])
def configure_irrigation():
    """
    Configura irrigação para uma greenhouse
    
    Body:
    {
        "greenhouseId": "uuid",
        "esp32Ip": "192.168.0.87",
        "esp32Port": 8080,
        "plantType": "tomato",
        "pulseDuration": 1.0,
        "pulseWait": 30,
        "maxPulses": 15,
        "autoIrrigate": false
    }
    """
    global irrigation_service
    
    try:
        data = request.get_json()
        
        greenhouse_id = data.get('greenhouseId')
        esp32_ip = data.get('esp32Ip')
        
        if not greenhouse_id or not esp32_ip:
            return jsonify({'error': 'greenhouseId and esp32Ip are required'}), 400
        
        config = irrigation_service.configure_greenhouse(
            greenhouse_id=greenhouse_id,
            esp32_ip=esp32_ip,
            esp32_port=data.get('esp32Port', 8080),
            plant_type=data.get('plantType', 'default'),
            pulse_duration=data.get('pulseDuration'),
            pulse_wait=data.get('pulseWait'),
            max_pulses=data.get('maxPulses'),
            auto_irrigate=data.get('autoIrrigate', False),
            check_interval=data.get('checkInterval'),
            target_moisture=data.get('targetMoisture')
        )
        
        return jsonify({
            'success': True,
            'message': f'Greenhouse {greenhouse_id} configurada',
            'config': config
        }), 200
        
    except Exception as e:
        logger.error(f"Erro ao configurar irrigação: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/irrigation/status', methods=['GET'])
def irrigation_status():
    """Status do sistema de irrigação"""
    global irrigation_service
    
    greenhouse_id = request.args.get('greenhouseId')
    status = irrigation_service.get_status(greenhouse_id)
    
    return jsonify({
        'success': True,
        'status': status,
        'timestamp': datetime.now().isoformat()
    }), 200


@app.route('/irrigation/analyze', methods=['POST'])
def analyze_irrigation():
    """
    Analisa necessidade de irrigação para uma greenhouse
    
    Body:
    {
        "greenhouseId": "uuid"
    }
    """
    global irrigation_service
    
    try:
        data = request.get_json()
        greenhouse_id = data.get('greenhouseId')
        
        if not greenhouse_id:
            return jsonify({'error': 'greenhouseId is required'}), 400
        
        # Verificar se está configurada
        if greenhouse_id not in irrigation_service.irrigation_config:
            return jsonify({
                'error': 'Greenhouse not configured',
                'message': 'Use /irrigation/configure first'
            }), 400
        
        decision = irrigation_service.analyze_irrigation_need(greenhouse_id)
        
        # Obter status da bomba
        pump_status = irrigation_service.get_pump_status(greenhouse_id)
        
        return jsonify({
            'success': True,
            'greenhouseId': greenhouse_id,
            'analysis': decision.to_dict(),
            'pumpStatus': pump_status,
            'timestamp': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Erro na análise: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/irrigation/execute', methods=['POST'])
def execute_irrigation():
    """
    Executa irrigação em uma greenhouse
    
    Body:
    {
        "greenhouseId": "uuid",
        "force": false  // Ignorar análise e forçar irrigação
    }
    """
    global irrigation_service
    
    try:
        data = request.get_json()
        greenhouse_id = data.get('greenhouseId')
        force = data.get('force', False)
        
        if not greenhouse_id:
            return jsonify({'error': 'greenhouseId is required'}), 400
        
        # Verificar se está configurada
        if greenhouse_id not in irrigation_service.irrigation_config:
            return jsonify({
                'error': 'Greenhouse not configured',
                'message': 'Use /irrigation/configure first'
            }), 400
        
        decision = None
        if not force:
            decision = irrigation_service.analyze_irrigation_need(greenhouse_id)
            if not decision.needs_irrigation:
                return jsonify({
                    'success': True,
                    'message': 'Irrigation not needed',
                    'analysis': decision.to_dict()
                }), 200
        
        result = irrigation_service.execute_irrigation(greenhouse_id, decision)
        
        return jsonify({
            'success': result.success,
            'result': result.to_dict(),
            'timestamp': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Erro na execução: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/irrigation/reload-config', methods=['POST'])
def reload_irrigation_config():
    """
    Reload irrigation configuration from backend
    Call this when the active plant changes
    
    Body:
    {
        "greenhouseId": "uuid"  // Optional, if not provided reloads first active
    }
    """
    global irrigation_service
    
    try:
        data = request.get_json() or {}
        greenhouse_id = data.get('greenhouseId')
        
        # Fetch new config from backend
        backend_config = fetch_irrigation_config_from_backend()
        
        if not backend_config:
            return jsonify({
                'success': False,
                'error': 'Could not fetch configuration from backend'
            }), 400
        
        # If specific greenhouse requested, verify it matches
        if greenhouse_id and backend_config.get('greenhouseId') != greenhouse_id:
            return jsonify({
                'success': False,
                'error': f'Requested greenhouse {greenhouse_id} not found or has no active plant'
            }), 404
        
        greenhouse_id = backend_config.get('greenhouseId')
        plant_type = backend_config.get('plantType', 'default')
        
        # Calculate target moisture from plant settings
        target_moisture = backend_config.get('soilMoistureIdeal')
        if target_moisture is None:
            moisture_min = backend_config.get('soilMoistureMin', 30)
            moisture_max = backend_config.get('soilMoistureMax', 70)
            target_moisture = (moisture_min + moisture_max) / 2
        
        # Check if greenhouse is already being monitored
        existing_config = irrigation_service.irrigation_config.get(greenhouse_id, {})
        esp32_ip = existing_config.get('esp32_url', '').replace('http://', '').split(':')[0]
        esp32_port = 8080
        
        if not esp32_ip:
            esp32_ip = os.getenv('ESP32_IP', '')
            esp32_port = int(os.getenv('ESP32_PORT', '8080'))
        
        if not esp32_ip:
            return jsonify({
                'success': False,
                'error': 'ESP32 IP not configured. Set ESP32_IP environment variable.'
            }), 400
        
        # Update configuration with new target moisture
        irrigation_service.configure_greenhouse(
            greenhouse_id=greenhouse_id,
            esp32_ip=esp32_ip,
            esp32_port=esp32_port,
            plant_type=plant_type,
            target_moisture=target_moisture,
            pulse_duration=existing_config.get('pulse_duration', float(os.getenv('PULSE_DURATION', '0.5'))),
            pulse_wait=existing_config.get('pulse_wait', int(os.getenv('PULSE_WAIT', '60'))),
            max_pulses=existing_config.get('max_pulses', int(os.getenv('MAX_PULSES', '20'))),
            auto_irrigate=True
        )
        
        logger.info(f"🔄 Configuration reloaded for {greenhouse_id}")
        logger.info(f"   Plant: {backend_config.get('plantName')} ({plant_type})")
        logger.info(f"   New Target Moisture: {target_moisture}%")
        
        return jsonify({
            'success': True,
            'message': f'Configuration reloaded for greenhouse {greenhouse_id}',
            'config': {
                'greenhouseId': greenhouse_id,
                'plantType': plant_type,
                'plantName': backend_config.get('plantName'),
                'targetMoisture': target_moisture,
                'moistureRange': {
                    'min': backend_config.get('soilMoistureMin'),
                    'max': backend_config.get('soilMoistureMax')
                }
            },
            'timestamp': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Erro ao recarregar config: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/irrigation/start-monitor', methods=['POST'])
def start_irrigation_monitor():
    """
    Inicia monitoramento automático de irrigação
    
    Body:
    {
        "greenhouseId": "uuid",
        "esp32Ip": "192.168.0.87",  // Opcional se já configurada
        "checkInterval": 60  // segundos entre verificações
    }
    """
    global irrigation_service
    
    try:
        data = request.get_json()
        greenhouse_id = data.get('greenhouseId')
        
        if not greenhouse_id:
            return jsonify({'error': 'greenhouseId is required'}), 400
        
        # Verificar se já está configurada
        existing_config = irrigation_service.irrigation_config.get(greenhouse_id)
        
        if existing_config:
            # Usar configuração existente
            esp32_url = existing_config.get('esp32_url', '')
            esp32_ip = esp32_url.replace('http://', '').split(':')[0] if esp32_url else data.get('esp32Ip')
            check_interval = data.get('checkInterval', existing_config.get('check_interval', 60))
        else:
            esp32_ip = data.get('esp32Ip')
            check_interval = data.get('checkInterval', 60)
            
            if not esp32_ip:
                return jsonify({'error': 'esp32Ip is required for first-time configuration'}), 400
        
        result = irrigation_service.start_monitoring(
            greenhouse_id=greenhouse_id,
            esp32_ip=esp32_ip,
            plant_type=data.get('plantType', existing_config.get('plant_type', 'default') if existing_config else 'default'),
            auto_irrigate=True,
            check_interval=check_interval,
            pulse_duration=existing_config.get('pulse_duration', 0.5) if existing_config else data.get('pulseDuration', 0.5),
            pulse_wait=existing_config.get('pulse_wait', 60) if existing_config else data.get('pulseWait', 60),
            max_pulses=existing_config.get('max_pulses', 20) if existing_config else data.get('maxPulses', 20),
            target_moisture=existing_config.get('target_moisture', 20) if existing_config else data.get('targetMoisture', 20)
        )
        
        return jsonify({
            'success': True,
            'result': result,
            'message': f'Monitoring started for {greenhouse_id}',
            'timestamp': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Erro ao iniciar monitor: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/irrigation/stop-monitor', methods=['POST'])
def stop_irrigation_monitor():
    """
    Para monitoramento de irrigação
    
    Body:
    {
        "greenhouseId": "uuid"  // Opcional, se vazio para todos
    }
    """
    global irrigation_service
    
    try:
        data = request.get_json() or {}
        greenhouse_id = data.get('greenhouseId')
        
        irrigation_service.stop_monitoring(greenhouse_id)
        
        message = f'Monitoring stopped for {greenhouse_id}' if greenhouse_id else 'All monitoring stopped'
        
        return jsonify({
            'success': True,
            'message': message,
            'timestamp': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Erro ao parar monitor: {e}")
        return jsonify({'error': str(e)}), 500


def initialize_irrigation_service():
    """Inicializa o serviço de irrigação após carregar modelos"""
    global irrigation_service, loaded_models, preprocessor
    
    # Read backend URL from environment
    backend_url = os.getenv('BACKEND_URL', 'http://localhost:5000')
    
    lstm_model = None
    if 'soil_moisture' in loaded_models:
        lstm_model = loaded_models['soil_moisture']['model']
    
    irrigation_service = SmartIrrigationService(
        backend_url=backend_url,
        lstm_model=lstm_model,
        preprocessor=preprocessor
    )
    
    logger.info(f"🚿 SmartIrrigationService inicializado (backend: {backend_url})")


def fetch_irrigation_config_from_backend() -> Optional[Dict[str, Any]]:
    """
    Fetch irrigation configuration from backend API
    Gets the first greenhouse with an active plant and its moisture settings
    
    Returns:
        Configuration dict or None if not found
    """
    import requests
    
    backend_url = os.getenv('BACKEND_URL', 'http://localhost:5000')
    config_url = f"{backend_url}/greenhouses/ai/irrigation-config"
    
    try:
        logger.info(f"🔍 Fetching irrigation config from {config_url}")
        
        response = requests.get(config_url, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            
            if data.get('success') and data.get('data'):
                config = data['data']
                logger.info(f"✅ Config received:")
                logger.info(f"   Greenhouse: {config.get('greenhouseId')}")
                logger.info(f"   Plant: {config.get('plantName')} ({config.get('plantType')})")
                logger.info(f"   Moisture Range: {config.get('soilMoistureMin')}% - {config.get('soilMoistureMax')}%")
                logger.info(f"   Ideal Moisture: {config.get('soilMoistureIdeal')}%")
                return config
            else:
                logger.warning(f"⚠️ No active greenhouse found: {data.get('error')}")
                return None
        else:
            logger.error(f"❌ Backend error: {response.status_code}")
            return None
            
    except requests.exceptions.ConnectionError:
        logger.warning(f"⚠️ Could not connect to backend at {backend_url}")
        return None
    except Exception as e:
        logger.error(f"❌ Error fetching config: {e}")
        return None


def auto_start_monitoring():
    """
    Auto-start monitoring from environment variables or backend API
    
    Priority:
    1. If FETCH_CONFIG_FROM_BACKEND=true, get config from backend
    2. Otherwise use environment variables
    """
    global irrigation_service
    
    auto_start = os.getenv('AUTO_START_MONITOR', 'false').lower() == 'true'
    fetch_from_backend = os.getenv('FETCH_CONFIG_FROM_BACKEND', 'true').lower() == 'true'
    
    if not auto_start:
        logger.info("📋 Auto-start monitoring: DISABLED (set AUTO_START_MONITOR=true to enable)")
        return
    
    # ESP32 IP is always required
    esp32_ip = os.getenv('ESP32_IP', '')
    esp32_port = int(os.getenv('ESP32_PORT', '8080'))
    
    if not esp32_ip:
        logger.warning("⚠️ AUTO_START_MONITOR=true but ESP32_IP not set")
        return
    
    greenhouse_id = None
    target_moisture = None
    plant_type = 'default'
    
    # Try to fetch config from backend
    if fetch_from_backend:
        logger.info("\n🔄 FETCHING CONFIGURATION FROM BACKEND...")
        backend_config = fetch_irrigation_config_from_backend()
        
        if backend_config:
            greenhouse_id = backend_config.get('greenhouseId')
            plant_type = backend_config.get('plantType', 'default')
            
            # Use the ideal moisture from plant configuration
            target_moisture = backend_config.get('soilMoistureIdeal')
            
            # If no ideal, calculate from min/max
            if target_moisture is None:
                moisture_min = backend_config.get('soilMoistureMin', 30)
                moisture_max = backend_config.get('soilMoistureMax', 70)
                target_moisture = (moisture_min + moisture_max) / 2
            
            logger.info(f"\n📊 USING BACKEND CONFIGURATION:")
            logger.info(f"   Greenhouse: {greenhouse_id}")
            logger.info(f"   Plant Type: {plant_type}")
            logger.info(f"   Target Moisture: {target_moisture}%")
    
    # Fallback to environment variables if backend config not available
    if not greenhouse_id:
        greenhouse_id = os.getenv('GREENHOUSE_ID', '')
        
        if not greenhouse_id:
            logger.warning("⚠️ No greenhouse configured (backend unavailable and GREENHOUSE_ID not set)")
            return
            
        logger.info(f"\n📋 USING ENVIRONMENT CONFIGURATION:")
        plant_type = os.getenv('PLANT_TYPE', 'default')
        target_moisture = float(os.getenv('TARGET_MOISTURE', '60'))
    
    # Read pulse configuration from environment (these are hardware-specific)
    pulse_duration = float(os.getenv('PULSE_DURATION', '0.5'))
    pulse_wait = int(os.getenv('PULSE_WAIT', '60'))
    max_pulses = int(os.getenv('MAX_PULSES', '20'))
    
    logger.info(f"\n🤖 AUTO-START MONITORING")
    logger.info(f"   Greenhouse: {greenhouse_id}")
    logger.info(f"   ESP32: {esp32_ip}:{esp32_port}")
    logger.info(f"   Plant: {plant_type}")
    logger.info(f"   Target Moisture: {target_moisture}%")
    logger.info(f"   Pulse: {pulse_duration}s every {pulse_wait}s")
    
    # Configure greenhouse
    irrigation_service.configure_greenhouse(
        greenhouse_id=greenhouse_id,
        esp32_ip=esp32_ip,
        esp32_port=esp32_port,
        plant_type=plant_type,
        target_moisture=target_moisture,
        pulse_duration=pulse_duration,
        pulse_wait=pulse_wait,
        max_pulses=max_pulses,
        auto_irrigate=True
    )
    
    # Start monitoring
    irrigation_service.start_monitoring(
        greenhouse_id=greenhouse_id,
        esp32_ip=esp32_ip,
        auto_irrigate=True,
        check_interval=pulse_wait
    )
    
    logger.info(f"✅ Auto-monitoring started for {greenhouse_id}")


if __name__ == '__main__':
    print("\n" + "=" * 70)
    print("🌱 IoT GREENHOUSE AI SERVICE - Starting...")
    print("=" * 70)
    
    # Initialize models
    success = initialize_models()
    
    # Initialize irrigation service
    initialize_irrigation_service()
    
    # Auto-start monitoring if configured via environment
    auto_start_monitoring()
    
    if not success:
        print("\n⚠️  WARNING: Some models failed to load. Service may have limited functionality.")
        print("   Check that model files exist in: apps/ai/models/saved/")
    
    # Start Flask server
    print("\n" + "=" * 70)
    print("🚀 STARTING FLASK SERVER")
    print("=" * 70)
    print("\n📍 Available Endpoints:")
    print("\n  📊 Health & Info:")
    print("   - GET  /health                     Health check & status")
    print("   - GET  /models/info                Model details & architecture")
    print("\n  🧠 AI Analysis:")
    print("   - POST /analyze-sensors            Complete plant analysis")
    print("   - POST /predict/moisture           Soil moisture prediction (12h)")
    print("   - POST /predict/health             Plant health prediction")
    print("\n  💧 Smart Irrigation:")
    print("   - GET  /irrigation/plants          List plant types & configs")
    print("   - POST /irrigation/configure       Configure greenhouse irrigation")
    print("   - GET  /irrigation/status          Get irrigation system status")
    print("   - POST /irrigation/analyze         Analyze irrigation need (AI)")
    print("   - POST /irrigation/execute         Execute smart irrigation")
    print("   - POST /irrigation/start-monitor   Start auto-monitoring (background)")
    print("   - POST /irrigation/stop-monitor    Stop monitoring")
    print("\n🌐 Server URL: http://localhost:5001")
    print("🔗 Allowed Origins:")
    print("   - http://localhost:5000    (NestJS API)")
    print("   - http://localhost:3000    (Next.js Frontend)")
    print("   - http://192.168.*.*       (ESP32 Devices)")
    print("\n" + "=" * 70 + "\n")
    
    app.run(
        host='0.0.0.0',
        port=5001,
        debug=False,  # Production-ready
        use_reloader=False  # Avoid double model loading
    )
