#!/usr/bin/env python3
"""
Sistema de Irrigação Inteligente com IA/LSTM
Usa modelo LSTM para prever umidade ideal e irrigar gradualmente

Uso:
    python smart_irrigation.py --esp32-ip 192.168.0.87 --greenhouse-id f9f09e4e-f18a-40f0-939d-d682edf6af5e
    python smart_irrigation.py --esp32-ip 192.168.0.87 --greenhouse-id f9f09e4e-f18a-40f0-939d-d682edf6af5e --monitor
"""

import argparse
import logging
import time
import requests
import numpy as np
import torch
import os
import sys
from datetime import datetime, timedelta
from typing import Optional, Dict, List, Tuple
from dataclasses import dataclass

# Adicionar diretório pai ao path para importar módulos locais
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

# Configurações padrão
DEFAULT_ESP32_PORT = 8080
DEFAULT_BACKEND_URL = "http://localhost:5000"
DEFAULT_AI_SERVICE_URL = "http://localhost:8080"

# Parâmetros de irrigação gradual - CONSERVADOR
DEFAULT_PUMP_PULSE_DURATION = 1      # 1 segundo por pulso (pouca água)
DEFAULT_PULSE_WAIT_TIME = 30         # 30 segundos de espera (absorção)
DEFAULT_MAX_PULSES = 15              # Mais pulsos, mas menor volume cada
DEFAULT_MOISTURE_TOLERANCE = 5       # % de tolerância do valor ideal


@dataclass
class SensorReading:
    """Dados de leitura dos sensores"""
    air_temperature: float
    air_humidity: float
    soil_moisture: float
    soil_temperature: float
    timestamp: datetime
    
    @classmethod
    def from_api_response(cls, data: dict) -> 'SensorReading':
        """Cria SensorReading a partir de resposta da API"""
        reading = data.get('latestReading', data)
        return cls(
            air_temperature=float(reading.get('airTemperature', 0)),
            air_humidity=float(reading.get('airHumidity', 0)),
            soil_moisture=float(reading.get('soilMoisture', 0)),
            soil_temperature=float(reading.get('soilTemperature', 0)),
            timestamp=datetime.fromisoformat(reading.get('timestamp', datetime.now().isoformat()).replace('Z', '+00:00'))
        )


@dataclass
class IrrigationDecision:
    """Decisão de irrigação baseada na IA"""
    needs_irrigation: bool
    current_moisture: float
    target_moisture: float
    predicted_moisture: float
    confidence: float
    recommendation: str
    pulse_count: int
    pulse_duration: float


class LSTMPredictor:
    """Wrapper para usar o modelo LSTM treinado"""
    
    def __init__(self, model_path: str = None):
        self.model = None
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model_path = model_path or os.path.join(
            os.path.dirname(__file__), 
            "models", "saved", "soil_moisture_predictor", 
            "soil_moisture_predictor_latest.pt"
        )
        self._load_model()
    
    def _load_model(self):
        """Carrega o modelo LSTM treinado"""
        try:
            if os.path.exists(self.model_path):
                from models.lstm_model import LSTMModel
                
                # Criar modelo com arquitetura do modelo treinado
                # O modelo foi treinado com 4 features: 
                # [air_temperature, air_humidity, soil_moisture, soil_temperature]
                self.model = LSTMModel(
                    input_size=4,      # 4 features de entrada (conforme treinado)
                    hidden_size=64,
                    num_layers=2,
                    output_size=12     # 12 horas de previsão
                )
                
                # Carregar pesos
                self.model.load_state_dict(torch.load(self.model_path, map_location=self.device))
                self.model.eval()
                logger.info(f"✅ Modelo LSTM carregado de {self.model_path}")
            else:
                logger.warning(f"⚠️  Modelo não encontrado em {self.model_path}")
                self.model = None
        except Exception as e:
            logger.error(f"❌ Erro ao carregar modelo: {e}")
            self.model = None
    
    def predict(self, sequence: np.ndarray) -> Optional[np.ndarray]:
        """
        Faz previsão usando o modelo LSTM
        
        Args:
            sequence: Array de forma (window_size, 4) com features:
                      [air_temperature, air_humidity, soil_moisture, soil_temperature]
            
        Returns:
            Array com previsões para as próximas 12 horas
        """
        if self.model is None:
            return None
        
        try:
            # Garantir que temos apenas 4 features
            if sequence.shape[1] != 4:
                logger.warning(f"Esperado 4 features, recebido {sequence.shape[1]}")
                # Tentar usar apenas as 4 primeiras colunas
                sequence = sequence[:, :4]
            
            # Preparar input
            X = torch.FloatTensor(sequence).unsqueeze(0).to(self.device)
            
            with torch.no_grad():
                prediction = self.model(X)
            
            return prediction.cpu().numpy()[0]
        except Exception as e:
            logger.error(f"Erro na previsão: {e}")
            return None


class PlantKnowledgeBase:
    """Base de conhecimento sobre plantas e suas necessidades"""
    
    # Valores ideais de umidade do solo por tipo de planta
    PLANT_IDEAL_MOISTURE = {
        "default": {"min": 40, "ideal": 60, "max": 80},
        "tomato": {"min": 50, "ideal": 70, "max": 85},
        "lettuce": {"min": 60, "ideal": 75, "max": 90},
        "pepper": {"min": 45, "ideal": 65, "max": 80},
        "basil": {"min": 40, "ideal": 60, "max": 75},
        "strawberry": {"min": 55, "ideal": 70, "max": 85},
        "cucumber": {"min": 60, "ideal": 75, "max": 90},
        "herbs": {"min": 35, "ideal": 55, "max": 70},
    }
    
    @classmethod
    def get_ideal_moisture(cls, plant_type: str = "default") -> Dict[str, float]:
        """Retorna os valores ideais de umidade para o tipo de planta"""
        plant_key = plant_type.lower() if plant_type else "default"
        return cls.PLANT_IDEAL_MOISTURE.get(plant_key, cls.PLANT_IDEAL_MOISTURE["default"])
    
    @classmethod
    def calculate_target_moisture(
        cls, 
        current_moisture: float, 
        plant_type: str = "default",
        time_of_day: int = 12,
        temperature: float = 25.0
    ) -> float:
        """
        Calcula a umidade alvo considerando fatores ambientais
        
        Args:
            current_moisture: Umidade atual do solo
            plant_type: Tipo de planta
            time_of_day: Hora do dia (0-23)
            temperature: Temperatura ambiente
            
        Returns:
            Umidade alvo calculada
        """
        ideal = cls.get_ideal_moisture(plant_type)
        base_target = ideal["ideal"]
        
        # Ajuste por temperatura (em dias quentes, manter mais úmido)
        if temperature > 30:
            base_target += 5
        elif temperature > 35:
            base_target += 10
        elif temperature < 15:
            base_target -= 5
        
        # Ajuste por hora do dia (de manhã, preparar para o dia)
        if 6 <= time_of_day <= 10:
            base_target += 5  # Irrigar um pouco mais de manhã
        elif 14 <= time_of_day <= 17:
            base_target -= 5  # Evitar irrigação no pico de calor
        
        # Limitar aos valores min/max
        return max(ideal["min"], min(ideal["max"], base_target))


class SmartIrrigationController:
    """Controlador de irrigação inteligente com IA"""
    
    def __init__(
        self,
        esp32_ip: str,
        greenhouse_id: str,
        backend_url: str = DEFAULT_BACKEND_URL,
        esp32_port: int = DEFAULT_ESP32_PORT,
        pulse_duration: float = DEFAULT_PUMP_PULSE_DURATION,
        pulse_wait: float = DEFAULT_PULSE_WAIT_TIME,
        max_pulses: int = DEFAULT_MAX_PULSES,
        plant_type: str = "default"
    ):
        self.esp32_url = f"http://{esp32_ip}:{esp32_port}"
        self.backend_url = backend_url
        self.greenhouse_id = greenhouse_id
        self.pulse_duration = pulse_duration
        self.pulse_wait = pulse_wait
        self.max_pulses = max_pulses
        self.plant_type = plant_type
        
        # Inicializar componentes
        self.lstm_predictor = LSTMPredictor()
        self.knowledge_base = PlantKnowledgeBase()
        
        # Histórico de leituras para o modelo LSTM
        self.reading_history: List[SensorReading] = []
        
        # Carregar histórico do backend se disponível
        self._load_historical_data()
        
        logger.info(f"🌱 Sistema de Irrigação Inteligente inicializado")
        logger.info(f"   Backend: {self.backend_url}")
        logger.info(f"   ESP32: {self.esp32_url}")
        logger.info(f"   Greenhouse: {self.greenhouse_id}")
        logger.info(f"   Tipo de planta: {self.plant_type}")
        logger.info(f"   Pulso: {pulse_duration}s, Espera: {pulse_wait}s, Max: {max_pulses}")
        if len(self.reading_history) >= 24:
            logger.info(f"   📊 Histórico LSTM: {len(self.reading_history)} leituras carregadas")
        else:
            logger.info(f"   ⚠️  Histórico LSTM: {len(self.reading_history)}/24 leituras (acumulando...)")
    
    def _load_historical_data(self):
        """Carrega dados históricos do backend para o LSTM"""
        try:
            historical = self.get_historical_readings(hours=48)
            if historical:
                for reading_data in historical:
                    reading = SensorReading(
                        air_temperature=float(reading_data.get('airTemperature', 0)),
                        air_humidity=float(reading_data.get('airHumidity', 0)),
                        soil_moisture=float(reading_data.get('soilMoisture', 0)),
                        soil_temperature=float(reading_data.get('soilTemperature', 0)),
                        timestamp=datetime.fromisoformat(
                            reading_data.get('timestamp', datetime.now().isoformat()).replace('Z', '+00:00')
                        )
                    )
                    self.reading_history.append(reading)
                
                logger.info(f"📚 Carregadas {len(self.reading_history)} leituras históricas do backend")
        except Exception as e:
            logger.warning(f"⚠️  Não foi possível carregar histórico: {e}")
    
    def get_current_reading(self) -> Optional[SensorReading]:
        """Obtém leitura atual dos sensores via backend"""
        try:
            url = f"{self.backend_url}/sensor/greenhouse/{self.greenhouse_id}/latest"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and data.get('data'):
                    reading = SensorReading.from_api_response(data['data'])
                    logger.info(f"📊 Leitura: Umidade={reading.soil_moisture}%, Temp={reading.air_temperature}°C")
                    return reading
            
            logger.warning("⚠️  Não foi possível obter leitura")
            return None
            
        except Exception as e:
            logger.error(f"❌ Erro ao obter leitura: {e}")
            return None
    
    def get_historical_readings(self, hours: int = 24) -> List[Dict]:
        """Obtém leituras históricas para alimentar o LSTM"""
        try:
            # Tentar buscar do backend
            url = f"{self.backend_url}/sensor/greenhouse/{self.greenhouse_id}/history"
            params = {"hours": hours}
            response = requests.get(url, params=params, timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and data.get('data'):
                    return data['data']
            
            return []
            
        except Exception as e:
            logger.warning(f"⚠️  Histórico não disponível: {e}")
            return []
    
    def prepare_lstm_input(self, readings: List[SensorReading]) -> Optional[np.ndarray]:
        """
        Prepara os dados para o modelo LSTM
        
        O modelo espera: (window_size, 4_features)
        Features: air_temperature, air_humidity, soil_moisture, soil_temperature
        """
        if len(readings) < 24:  # Precisa de pelo menos 24 leituras
            return None
        
        # Usar as últimas 24 leituras
        recent = readings[-24:]
        
        # Criar array de features (apenas 4 como o modelo foi treinado)
        sequence = np.array([
            [
                r.air_temperature,
                r.air_humidity,
                r.soil_moisture,
                r.soil_temperature
            ]
            for r in recent
        ])
        
        return sequence
    
    def predict_with_lstm(self, current_reading: SensorReading) -> Optional[float]:
        """
        Usa o LSTM para prever umidade futura
        
        Returns:
            Previsão de umidade para as próximas horas, ou None se não disponível
        """
        # Adicionar leitura atual ao histórico
        self.reading_history.append(current_reading)
        
        # Manter apenas últimas 48 leituras
        if len(self.reading_history) > 48:
            self.reading_history = self.reading_history[-48:]
        
        # Preparar input
        sequence = self.prepare_lstm_input(self.reading_history)
        
        if sequence is None:
            logger.info("ℹ️  Dados insuficientes para previsão LSTM (precisa de 24 leituras)")
            return None
        
        # Fazer previsão
        predictions = self.lstm_predictor.predict(sequence)
        
        if predictions is not None:
            # Retornar média das próximas 6 horas
            avg_prediction = float(np.mean(predictions[:6]))
            logger.info(f"🔮 Previsão LSTM: {avg_prediction:.1f}% (média 6h)")
            return avg_prediction
        
        return None
    
    def calculate_irrigation_decision(self, reading: SensorReading) -> IrrigationDecision:
        """
        Calcula se deve irrigar e quanto, usando IA
        """
        current_moisture = reading.soil_moisture
        current_hour = datetime.now().hour
        
        # Obter valores ideais para a planta
        ideal_values = self.knowledge_base.get_ideal_moisture(self.plant_type)
        
        # Calcular target considerando condições
        target_moisture = self.knowledge_base.calculate_target_moisture(
            current_moisture=current_moisture,
            plant_type=self.plant_type,
            time_of_day=current_hour,
            temperature=reading.air_temperature
        )
        
        # Tentar usar LSTM para previsão
        predicted_moisture = self.predict_with_lstm(reading)
        
        # Se não tiver previsão LSTM, usar valor atual
        if predicted_moisture is None:
            predicted_moisture = current_moisture
        
        # Lógica de decisão
        needs_irrigation = False
        recommendation = ""
        pulse_count = 0
        confidence = 0.7  # Confiança base
        
        # Verificar se sensor pode estar desconectado
        if current_moisture <= 0:
            recommendation = "SENSOR_ERROR: Sensor de umidade pode estar desconectado"
            return IrrigationDecision(
                needs_irrigation=False,
                current_moisture=current_moisture,
                target_moisture=target_moisture,
                predicted_moisture=predicted_moisture,
                confidence=0.0,
                recommendation=recommendation,
                pulse_count=0,
                pulse_duration=0
            )
        
        # Calcular diferença para o ideal
        moisture_deficit = target_moisture - current_moisture
        
        if current_moisture >= ideal_values["max"]:
            recommendation = f"OK: Solo bem úmido ({current_moisture}% >= máximo {ideal_values['max']}%)"
        elif current_moisture >= target_moisture:
            recommendation = f"OK: Umidade adequada ({current_moisture}% >= alvo {target_moisture}%)"
        elif current_moisture < ideal_values["min"]:
            # Umidade crítica - irrigação urgente
            needs_irrigation = True
            confidence = 0.95
            pulse_count = min(self.max_pulses, max(3, int(moisture_deficit / 10)))
            recommendation = f"URGENTE: Umidade crítica ({current_moisture}% < mínimo {ideal_values['min']}%)"
        elif moisture_deficit > DEFAULT_MOISTURE_TOLERANCE:
            # Precisa irrigar gradualmente
            needs_irrigation = True
            confidence = 0.8
            pulse_count = min(self.max_pulses, max(1, int(moisture_deficit / 15)))
            recommendation = f"IRRIGAR: Déficit de {moisture_deficit:.1f}% (atual {current_moisture}% < alvo {target_moisture}%)"
        else:
            recommendation = f"MONITORAR: Umidade próxima ao ideal ({current_moisture}%, alvo {target_moisture}%)"
        
        # Ajustar confiança se LSTM estiver funcionando
        if self.lstm_predictor.model is not None and len(self.reading_history) >= 24:
            confidence += 0.1
        
        return IrrigationDecision(
            needs_irrigation=needs_irrigation,
            current_moisture=current_moisture,
            target_moisture=target_moisture,
            predicted_moisture=predicted_moisture,
            confidence=min(1.0, confidence),
            recommendation=recommendation,
            pulse_count=pulse_count,
            pulse_duration=self.pulse_duration
        )
    
    def activate_pump(self, duration: float) -> bool:
        """Ativa a bomba por um tempo específico"""
        try:
            response = requests.post(
                f"{self.esp32_url}/pump/activate",
                json={"duration": duration},
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code == 200:
                logger.info(f"💦 Bomba ativada por {duration}s")
                return True
            else:
                logger.error(f"❌ Falha ao ativar bomba: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Erro de comunicação: {e}")
            return False
    
    def get_pump_status(self) -> Optional[Dict]:
        """Obtém status da bomba"""
        try:
            response = requests.get(f"{self.esp32_url}/pump/status", timeout=5)
            if response.status_code == 200:
                return response.json()
        except:
            pass
        return None
    
    def irrigate_gradually(self, decision: IrrigationDecision) -> Dict:
        """
        Executa irrigação gradual em pulsos
        
        Returns:
            Resultado da irrigação
        """
        result = {
            "started_at": datetime.now().isoformat(),
            "initial_moisture": decision.current_moisture,
            "target_moisture": decision.target_moisture,
            "pulses_planned": decision.pulse_count,
            "pulses_executed": 0,
            "final_moisture": decision.current_moisture,
            "success": False,
            "history": []
        }
        
        if not decision.needs_irrigation:
            result["message"] = "Irrigação não necessária"
            return result
        
        logger.info(f"\n{'='*60}")
        logger.info(f"🚿 INICIANDO IRRIGAÇÃO GRADUAL")
        logger.info(f"   Umidade atual: {decision.current_moisture}%")
        logger.info(f"   Umidade alvo: {decision.target_moisture}%")
        logger.info(f"   Pulsos planejados: {decision.pulse_count}")
        logger.info(f"   Duração por pulso: {decision.pulse_duration}s")
        logger.info(f"{'='*60}\n")
        
        current_moisture = decision.current_moisture
        
        for pulse in range(1, decision.pulse_count + 1):
            # Verificar se já atingiu o alvo
            if current_moisture >= decision.target_moisture:
                logger.info(f"✅ Meta atingida! ({current_moisture}% >= {decision.target_moisture}%)")
                result["success"] = True
                break
            
            logger.info(f"\n--- Pulso {pulse}/{decision.pulse_count} ---")
            
            # Ativar bomba
            if self.activate_pump(decision.pulse_duration):
                result["pulses_executed"] = pulse
                
                # Aguardar um pouco para a água ser absorvida
                logger.info(f"⏳ Aguardando {self.pulse_wait}s para absorção...")
                time.sleep(self.pulse_wait)
                
                # Ler nova umidade
                new_reading = self.get_current_reading()
                
                if new_reading:
                    new_moisture = new_reading.soil_moisture
                    increase = new_moisture - current_moisture
                    
                    pulse_result = {
                        "pulse": pulse,
                        "before": current_moisture,
                        "after": new_moisture,
                        "increase": increase
                    }
                    result["history"].append(pulse_result)
                    
                    if increase > 0:
                        logger.info(f"📈 Umidade: {current_moisture}% → {new_moisture}% (+{increase:.1f}%)")
                    else:
                        logger.info(f"📊 Umidade: {current_moisture}% → {new_moisture}%")
                    
                    current_moisture = new_moisture
                    
                    # Adicionar ao histórico para LSTM
                    self.reading_history.append(new_reading)
                else:
                    logger.warning("⚠️  Não foi possível ler nova umidade")
            else:
                logger.error("❌ Falha no pulso de irrigação")
                break
            
            # Pequena pausa entre pulsos se não for o último
            if pulse < decision.pulse_count and current_moisture < decision.target_moisture:
                logger.info(f"⏳ Aguardando antes do próximo pulso...")
                time.sleep(3)
        
        result["final_moisture"] = current_moisture
        result["finished_at"] = datetime.now().isoformat()
        
        if current_moisture >= decision.target_moisture:
            result["success"] = True
            result["message"] = f"Meta atingida: {result['initial_moisture']}% → {current_moisture}%"
        else:
            result["message"] = f"Irrigação parcial: {result['initial_moisture']}% → {current_moisture}% (alvo: {decision.target_moisture}%)"
        
        logger.info(f"\n{'='*60}")
        logger.info(f"📋 RESULTADO DA IRRIGAÇÃO")
        logger.info(f"   Umidade inicial: {result['initial_moisture']}%")
        logger.info(f"   Umidade final: {result['final_moisture']}%")
        logger.info(f"   Pulsos executados: {result['pulses_executed']}/{decision.pulse_count}")
        logger.info(f"   Status: {'✅ Sucesso' if result['success'] else '⚠️  Parcial'}")
        logger.info(f"{'='*60}\n")
        
        return result
    
    def run_check(self) -> Dict:
        """
        Executa uma verificação completa e irriga se necessário
        """
        result = {
            "timestamp": datetime.now().isoformat(),
            "action": "none",
            "decision": None,
            "irrigation_result": None
        }
        
        # 1. Obter leitura atual
        reading = self.get_current_reading()
        
        if not reading:
            result["error"] = "Não foi possível obter leitura dos sensores"
            return result
        
        # 2. Calcular decisão usando IA
        decision = self.calculate_irrigation_decision(reading)
        
        result["decision"] = {
            "needs_irrigation": decision.needs_irrigation,
            "current_moisture": decision.current_moisture,
            "target_moisture": decision.target_moisture,
            "predicted_moisture": decision.predicted_moisture,
            "confidence": decision.confidence,
            "recommendation": decision.recommendation,
            "pulse_count": decision.pulse_count
        }
        
        logger.info(f"\n📋 DECISÃO DA IA:")
        logger.info(f"   {decision.recommendation}")
        logger.info(f"   Confiança: {decision.confidence*100:.0f}%")
        
        # 3. Executar irrigação se necessário
        if decision.needs_irrigation:
            result["action"] = "irrigate"
            result["irrigation_result"] = self.irrigate_gradually(decision)
        else:
            result["action"] = "skip"
            logger.info(f"   Ação: Nenhuma irrigação necessária")
        
        return result
    
    def monitor_loop(self, interval: int = 300):
        """
        Loop de monitoramento contínuo
        
        Args:
            interval: Intervalo entre verificações em segundos (default: 5 min)
        """
        logger.info(f"\n🔄 Iniciando monitoramento contínuo (intervalo: {interval}s)")
        logger.info("   Pressione Ctrl+C para parar\n")
        
        try:
            while True:
                logger.info(f"\n{'='*60}")
                logger.info(f"⏰ Verificação: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
                logger.info(f"{'='*60}")
                
                result = self.run_check()
                
                logger.info(f"\n⏳ Próxima verificação em {interval}s...")
                time.sleep(interval)
                
        except KeyboardInterrupt:
            logger.info("\n🛑 Monitoramento interrompido pelo usuário")


def main():
    parser = argparse.ArgumentParser(
        description='Sistema de Irrigação Inteligente com IA/LSTM',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Exemplos:
  # Verificação única com IA
  python smart_irrigation.py --esp32-ip 192.168.0.87 --greenhouse-id f9f09e4e-f18a-40f0-939d-d682edf6af5e
  
  # Especificar tipo de planta
  python smart_irrigation.py --esp32-ip 192.168.0.87 --greenhouse-id f9f09e4e-f18a-40f0-939d-d682edf6af5e --plant-type tomato
  
  # Monitoramento contínuo
  python smart_irrigation.py --esp32-ip 192.168.0.87 --greenhouse-id f9f09e4e-f18a-40f0-939d-d682edf6af5e --monitor
  
  # Com parâmetros customizados de irrigação
  python smart_irrigation.py --esp32-ip 192.168.0.87 --greenhouse-id f9f09e4e-f18a-40f0-939d-d682edf6af5e --pulse-duration 3 --max-pulses 5
"""
    )
    
    parser.add_argument('--esp32-ip', required=True, help='IP do ESP32')
    parser.add_argument('--greenhouse-id', required=True, help='ID da greenhouse no backend')
    parser.add_argument('--backend-url', default=DEFAULT_BACKEND_URL, help=f'URL do backend (default: {DEFAULT_BACKEND_URL})')
    parser.add_argument('--port', type=int, default=DEFAULT_ESP32_PORT, help=f'Porta do ESP32 (default: {DEFAULT_ESP32_PORT})')
    parser.add_argument('--plant-type', default='default', help='Tipo de planta (default, tomato, lettuce, pepper, etc.)')
    parser.add_argument('--pulse-duration', type=float, default=DEFAULT_PUMP_PULSE_DURATION, help=f'Duração de cada pulso em segundos (default: {DEFAULT_PUMP_PULSE_DURATION})')
    parser.add_argument('--pulse-wait', type=float, default=DEFAULT_PULSE_WAIT_TIME, help=f'Tempo de espera entre pulsos (default: {DEFAULT_PULSE_WAIT_TIME})')
    parser.add_argument('--max-pulses', type=int, default=DEFAULT_MAX_PULSES, help=f'Máximo de pulsos por ciclo (default: {DEFAULT_MAX_PULSES})')
    parser.add_argument('--monitor', action='store_true', help='Modo de monitoramento contínuo')
    parser.add_argument('--interval', type=int, default=300, help='Intervalo do monitoramento em segundos (default: 300)')
    parser.add_argument('--status', action='store_true', help='Apenas mostrar status atual')
    
    args = parser.parse_args()
    
    # Criar controlador
    controller = SmartIrrigationController(
        esp32_ip=args.esp32_ip,
        greenhouse_id=args.greenhouse_id,
        backend_url=args.backend_url,
        esp32_port=args.port,
        pulse_duration=args.pulse_duration,
        pulse_wait=args.pulse_wait,
        max_pulses=args.max_pulses,
        plant_type=args.plant_type
    )
    
    print("\n" + "="*60)
    print("🌱 SISTEMA DE IRRIGAÇÃO INTELIGENTE COM IA")
    print("="*60 + "\n")
    
    if args.status:
        # Apenas mostrar status
        reading = controller.get_current_reading()
        if reading:
            print(f"📊 Leitura Atual:")
            print(f"   🌡️  Temperatura Ar: {reading.air_temperature}°C")
            print(f"   💧 Umidade Ar: {reading.air_humidity}%")
            print(f"   🌱 Umidade Solo: {reading.soil_moisture}%")
            print(f"   🌡️  Temperatura Solo: {reading.soil_temperature}°C")
            
            # Mostrar decisão da IA
            decision = controller.calculate_irrigation_decision(reading)
            print(f"\n🤖 Análise da IA:")
            print(f"   Umidade alvo: {decision.target_moisture}%")
            print(f"   Recomendação: {decision.recommendation}")
            print(f"   Precisa irrigar: {'Sim' if decision.needs_irrigation else 'Não'}")
            if decision.needs_irrigation:
                print(f"   Pulsos sugeridos: {decision.pulse_count}")
        
        pump_status = controller.get_pump_status()
        if pump_status:
            print(f"\n💦 Status da Bomba: {pump_status}")
            
    elif args.monitor:
        # Modo de monitoramento contínuo
        controller.monitor_loop(interval=args.interval)
        
    else:
        # Verificação única
        result = controller.run_check()
        
        if result.get("error"):
            print(f"\n❌ Erro: {result['error']}")
        else:
            print(f"\n📋 Resultado Final:")
            print(f"   Ação: {result['action']}")
            
            if result['decision']:
                print(f"   Umidade atual: {result['decision']['current_moisture']}%")
                print(f"   Umidade alvo: {result['decision']['target_moisture']}%")
                print(f"   Recomendação: {result['decision']['recommendation']}")
            
            if result.get('irrigation_result'):
                ir = result['irrigation_result']
                print(f"\n💦 Irrigação:")
                print(f"   Pulsos: {ir['pulses_executed']}/{ir['pulses_planned']}")
                print(f"   Umidade: {ir['initial_moisture']}% → {ir['final_moisture']}%")
                print(f"   Status: {'✅ Sucesso' if ir['success'] else '⚠️  Parcial'}")


if __name__ == "__main__":
    main()
