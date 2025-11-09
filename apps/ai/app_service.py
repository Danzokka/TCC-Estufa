"""
Flask API Service - Real-time Plant Health Analysis
Usa os modelos LSTM treinados para predições em tempo real

Run: python3 app_service.py
Endpoints:
  - GET  /health                - Health check
  - GET  /models/info           - Model information  
  - POST /analyze-sensors       - Análise completa de saúde da planta
  - POST /predict/moisture      - Predição específica de umidade  
  - POST /predict/health        - Predição específica de saúde
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

from models.lstm_model import LSTMModel  # Use LSTMModel directly
from data_processing.preprocessor import DataPreprocessor
from db.database import fetch_sensor_data
from config.settings import MODELS_DIR

# Initialize Flask app
app = Flask(__name__)

# CORS - Allow NestJS backend and Next.js frontend
CORS(app, origins=[
    'http://localhost:5000',  # NestJS API  
    'http://localhost:3000',  # Next.js frontend
    'http://localhost:3001'   # Alternative port
])

# Global storage for loaded models
loaded_models: Dict[str, Dict] = {}
preprocessor: Optional[DataPreprocessor] = None

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
    return jsonify({
        'status': 'healthy',
        'service': 'IoT Greenhouse AI Service',
        'timestamp': datetime.now().isoformat(),
        'models_loaded': list(loaded_models.keys()),
        'models_count': len(loaded_models),
        'version': '1.0.0'
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


if __name__ == '__main__':
    print("\n" + "=" * 70)
    print("🌱 IoT GREENHOUSE AI SERVICE - Starting...")
    print("=" * 70)
    
    # Initialize models
    success = initialize_models()
    
    if not success:
        print("\n⚠️  WARNING: Some models failed to load. Service may have limited functionality.")
        print("   Check that model files exist in: apps/ai/models/saved/")
    
    # Start Flask server
    print("\n" + "=" * 70)
    print("🚀 STARTING FLASK SERVER")
    print("=" * 70)
    print("\n📍 Available Endpoints:")
    print("   - GET  /health              Health check & status")
    print("   - GET  /models/info         Model details & architecture")
    print("   - POST /analyze-sensors     Complete plant analysis")
    print("   - POST /predict/moisture    Soil moisture prediction")
    print("   - POST /predict/health      Plant health prediction")
    print("\n🌐 Server URL: http://localhost:5001")
    print("🔗 Allowed Origins:")
    print("   - http://localhost:5000    (NestJS API)")
    print("   - http://localhost:3000    (Next.js Frontend)")
    print("\n" + "=" * 70 + "\n")
    
    app.run(
        host='0.0.0.0',
        port=5001,
        debug=True,
        use_reloader=False  # Avoid double model loading
    )
