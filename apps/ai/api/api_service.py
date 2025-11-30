from flask import Flask, request, jsonify
import pandas as pd
import logging
import json
import threading
import time
import requests
from datetime import datetime

from ..config.settings import API_HOST, API_PORT
from ..db.database import fetch_sensor_data, fetch_plant_metadata, fetch_user_plants
from ..data_processing.preprocessor import DataPreprocessor
from ..models.lstm_model import PlantLSTMTrainer
from ..analysis.insights_generator import InsightsGenerator
from ..analysis.report_generator import ReportGenerator

# Configuração de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Instanciar componentes do sistema
data_processor = DataPreprocessor()
feature_columns = [
    'air_temperature', 'air_humidity', 
    'soil_moisture', 'soil_temperature', 
    'water_level', 'water_reserve'
]
model_trainer = PlantLSTMTrainer(feature_columns)
insights_generator = InsightsGenerator()
report_generator = ReportGenerator()

# Cache para armazenar dados processados e previsões
cache = {
    'last_fetch': None,
    'sensor_data': None,
    'predictions': {},
    'alerts': [],
    'insights': []
}

# Intervalo de atualização em segundos
UPDATE_INTERVAL = 3600  # 1 hora


@app.route('/health', methods=['GET'])
def health_check():
    """Verificação de saúde da API"""
    return jsonify({
        'status': 'online',
        'timestamp': datetime.now().isoformat(),
        'cache_status': {
            'last_fetch': cache['last_fetch'].isoformat() if cache['last_fetch'] else None,
            'sensor_data_count': len(cache['sensor_data']) if cache['sensor_data'] is not None else 0,
            'predictions_count': sum(len(v) for v in cache['predictions'].values()),
            'alerts_count': len(cache['alerts']),
            'insights_count': len(cache['insights'])
        }
    })


@app.route('/data/current', methods=['GET'])
def get_current_data():
    """Retorna os dados atuais dos sensores"""
    user_plant_id = request.args.get('user_plant_id')
    
    if cache['sensor_data'] is None or cache['last_fetch'] is None:
        update_sensor_data()
    
    if user_plant_id:
        filtered_data = cache['sensor_data'][cache['sensor_data']['userPlantId'] == user_plant_id]
        return jsonify(filtered_data.to_dict(orient='records'))
    
    return jsonify(cache['sensor_data'].to_dict(orient='records'))


@app.route('/predictions', methods=['GET'])
def get_predictions():
    """Retorna previsões para uma planta específica"""
    user_plant_id = request.args.get('user_plant_id')
    variable = request.args.get('variable', 'soil_moisture')
    
    if not user_plant_id:
        return jsonify({'error': 'user_plant_id é obrigatório'}), 400
    
    # Gerar previsões se não existirem ou se houver novos dados
    if user_plant_id not in cache['predictions'] or cache['predictions'][user_plant_id] is None:
        generate_predictions(user_plant_id, variable)
    
    if user_plant_id in cache['predictions']:
        return jsonify(cache['predictions'][user_plant_id].to_dict(orient='records'))
    else:
        return jsonify({'error': 'Não foi possível gerar previsões para esta planta'}), 404


@app.route('/insights', methods=['GET'])
def get_insights():
    """Retorna insights e alertas para uma planta específica"""
    user_plant_id = request.args.get('user_plant_id')
    
    # Garantir que os dados e insights estejam atualizados
    if cache['sensor_data'] is None or cache['last_fetch'] is None:
        update_sensor_data()
        generate_all_insights()
    
    alerts = cache['alerts']
    insights = cache['insights']
    
    if user_plant_id:
        alerts = [a for a in alerts if a['userPlantId'] == user_plant_id]
        insights = [i for i in insights if i['userPlantId'] == user_plant_id]
    
    return jsonify({
        'alerts': alerts,
        'insights': insights
    })


@app.route('/api/generate-insights', methods=['POST'])
def generate_insights():
    """Gera insights detalhados para um relatório"""
    try:
        data = request.json
        
        if not data:
            return jsonify({'error': 'Dados são obrigatórios'}), 400
        
        # Validar dados obrigatórios
        required_fields = ['user_plant_id', 'period_type', 'start_date', 'end_date']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Campo {field} é obrigatório'}), 400
        
        logger.info(f"Gerando insights para planta {data['user_plant_id']}")
        
        # Gerar insights usando o ReportGenerator
        insights = report_generator.generate_insights(data)
        
        return jsonify(insights)
        
    except Exception as e:
        logger.error(f"Erro ao gerar insights: {str(e)}")
        return jsonify({'error': f'Erro interno: {str(e)}'}), 500


@app.route('/train', methods=['POST'])
def train_model():
    """Treina um modelo para uma planta específica"""
    data = request.json
    
    if not data or 'user_plant_id' not in data:
        return jsonify({'error': 'user_plant_id é obrigatório'}), 400
    
    user_plant_id = data['user_plant_id']
    variable = data.get('variable', 'soil_moisture')
    days = data.get('days', 30)
    
    # Iniciar treinamento em thread separada para não bloquear a API
    threading.Thread(target=train_plant_model, 
                     args=(user_plant_id, variable, days)).start()
    
    return jsonify({'status': 'Treinamento iniciado', 'user_plant_id': user_plant_id})


def update_sensor_data():
    """Atualiza cache com dados recentes de sensores"""
    try:
        logger.info("Buscando dados recentes de sensores...")
        
        # Buscar dados do banco de dados
        sensor_data = fetch_sensor_data(days=30)
        
        if len(sensor_data) > 0:
            # Processar e limpar dados
            clean_data = data_processor.clean_data(sensor_data)
            
            # Atualizar cache
            cache['sensor_data'] = clean_data
            cache['last_fetch'] = datetime.now()
            
            logger.info(f"Cache atualizado com {len(clean_data)} registros de sensores")
        else:
            logger.warning("Nenhum dado de sensor encontrado")
    
    except Exception as e:
        logger.error(f"Erro ao atualizar dados de sensores: {e}")


def generate_predictions(user_plant_id, target_variable='soil_moisture'):
    """Gera previsões para uma planta específica"""
    try:
        if cache['sensor_data'] is None:
            update_sensor_data()
        
        # Filtrar dados para a planta específica
        plant_data = cache['sensor_data'][cache['sensor_data']['userPlantId'] == user_plant_id].copy()
        
        if len(plant_data) < 24:  # Precisa de pelo menos 24 registros
            logger.warning(f"Dados insuficientes para gerar previsões para planta {user_plant_id}")
            return
        
        # Normalizar dados
        normalized_data = data_processor.normalize_data(plant_data)
        
        # Adicionar características de tempo
        enhanced_data = data_processor.add_time_features(normalized_data)
        
        # Criar sequências para o modelo
        X, _ = data_processor.create_sequences(
            enhanced_data, 
            window_size=24, 
            horizon=12, 
            target_col=target_variable
        )
        
        if X is None or len(X) == 0:
            logger.warning(f"Não foi possível criar sequências para previsão da planta {user_plant_id}")
            return
        
        # Gerar nome do modelo
        plant_name = plant_data['plant_name'].iloc[0] if 'plant_name' in plant_data.columns else 'default'
        model_name = f"{plant_name}_{target_variable}"
        
        # Fazer previsão
        predictions = model_trainer.predict(X[-1:], model_name)
        
        if predictions is None:
            logger.warning(f"Nenhum modelo treinado encontrado para {model_name}, tentando modelo default")
            model_name = f"default_{target_variable}"
            predictions = model_trainer.predict(X[-1:], model_name)
        
        if predictions is not None:
            # Criar DataFrame com previsões
            last_timestamp = pd.to_datetime(plant_data['timecreated'].max())
            
            pred_df = pd.DataFrame({
                'userPlantId': user_plant_id,
                'plant_name': plant_name,
                'plant_nickname': plant_data['plant_nickname'].iloc[0] if 'plant_nickname' in plant_data.columns else 'Planta',
                'variable': target_variable,
                'timestamp': [last_timestamp + pd.Timedelta(hours=i+1) for i in range(len(predictions[0]))],
                target_variable: predictions[0]
            })
            
            # Denormalizar valores previstos
            for col in [target_variable]:
                if col in data_processor.scalers:
                    pred_df[col] = data_processor.scalers[col].inverse_transform(
                        pred_df[[col]]
                    )
            
            # Armazenar no cache
            cache['predictions'][user_plant_id] = pred_df
            logger.info(f"Geradas {len(pred_df)} previsões para planta {user_plant_id}")
        else:
            logger.warning(f"Não foi possível gerar previsões para planta {user_plant_id}")
    
    except Exception as e:
        logger.error(f"Erro ao gerar previsões para planta {user_plant_id}: {e}")


def generate_all_insights():
    """Gera insights e alertas para todas as plantas"""
    try:
        if cache['sensor_data'] is None:
            update_sensor_data()
        
        # Buscar metadados das plantas
        plant_metadata = fetch_plant_metadata()
        
        # Analisar condições atuais
        alerts_df = insights_generator.analyze_current_conditions(cache['sensor_data'], plant_metadata)
        
        # Analisar previsões
        all_predictions = pd.concat([df for df in cache['predictions'].values()]) if cache['predictions'] else pd.DataFrame()
        preventive_alerts_df = insights_generator.analyze_predictions(all_predictions, plant_metadata)
        
        # Gerar insights de crescimento
        growth_insights_df = insights_generator.generate_growth_insights(cache['sensor_data'], plant_metadata)
        
        # Atualizar cache
        cache['alerts'] = alerts_df.to_dict(orient='records') + preventive_alerts_df.to_dict(orient='records')
        cache['insights'] = growth_insights_df.to_dict(orient='records')
        
        logger.info(f"Gerados {len(cache['alerts'])} alertas e {len(cache['insights'])} insights")
    
    except Exception as e:
        logger.error(f"Erro ao gerar insights: {e}")


def train_plant_model(user_plant_id, target_variable='soil_moisture', days=30):
    """Treina um modelo para uma planta específica"""
    try:
        logger.info(f"Iniciando treinamento de modelo para planta {user_plant_id}, variável {target_variable}")
        
        # Buscar dados históricos para treinamento
        plant_data = fetch_sensor_data(user_plant_id=user_plant_id, days=days)
        
        if len(plant_data) < 48:  # Mínimo de 48 registros para treinar
            logger.warning(f"Dados insuficientes para treinar modelo para planta {user_plant_id}")
            return
        
        # Processar e limpar dados
        clean_data = data_processor.clean_data(plant_data)
        
        # Normalizar dados
        normalized_data = data_processor.normalize_data(clean_data, fit=True)
        
        # Adicionar características de tempo
        enhanced_data = data_processor.add_time_features(normalized_data)
        
        # Criar sequências para treinamento
        X, y = data_processor.create_sequences(
            enhanced_data, 
            window_size=24, 
            horizon=12, 
            target_col=target_variable
        )
        
        if X is None or y is None or len(X) == 0:
            logger.warning(f"Não foi possível criar sequências para treino da planta {user_plant_id}")
            return
        
        # Gerar nome do modelo
        plant_name = plant_data['plant_name'].iloc[0] if 'plant_name' in plant_data.columns else 'default'
        model_name = f"{plant_name}_{target_variable}"
        
        # Treinar modelo
        model, losses = model_trainer.train_model(
            X_train=X,
            y_train=y,
            model_name=model_name,
            epochs=100,
            batch_size=32
        )
        
        logger.info(f"Treinamento concluído para {model_name}. Perda final: {losses[-1]:.4f}")
        
        # Gerar novas previsões após o treinamento
        generate_predictions(user_plant_id, target_variable)
        
    except Exception as e:
        logger.error(f"Erro no treinamento para planta {user_plant_id}: {e}")


def update_loop():
    """Loop de atualização periódica de dados e insights"""
    while True:
        try:
            update_sensor_data()
            
            # Atualizar previsões para todas as plantas
            if cache['sensor_data'] is not None:
                user_plants = cache['sensor_data']['userPlantId'].unique()
                for user_plant_id in user_plants:
                    generate_predictions(user_plant_id)
            
            # Gerar insights com dados atualizados
            generate_all_insights()
            
            logger.info("Atualização periódica concluída")
            
        except Exception as e:
            logger.error(f"Erro na atualização periódica: {e}")
        
        # Esperar pelo próximo ciclo
        time.sleep(UPDATE_INTERVAL)


def start_api():
    """Inicia o servidor API e o loop de atualização de dados"""
    # Iniciar loop de atualização em thread separada
    update_thread = threading.Thread(target=update_loop, daemon=True)
    update_thread.start()
    
    # Iniciar servidor API
    logger.info(f"Iniciando servidor API em {API_HOST}:{API_PORT}")
    app.run(host=API_HOST, port=API_PORT)


if __name__ == '__main__':
    start_api()