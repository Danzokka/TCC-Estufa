"""
Serviço de Irrigação Inteligente com LSTM
Gerencia decisões de irrigação baseadas em previsões do modelo

Uso interno pelo serviço Flask principal
"""

import logging
import time
import requests
import numpy as np
import torch
import threading
from datetime import datetime, timedelta
from typing import Optional, Dict, List, Tuple
from dataclasses import dataclass, asdict
from enum import Enum

logger = logging.getLogger(__name__)


class IrrigationStatus(Enum):
    """Status do sistema de irrigação"""
    IDLE = "idle"
    ANALYZING = "analyzing"
    IRRIGATING = "irrigating"
    WAITING = "waiting"
    ERROR = "error"


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
            timestamp=datetime.fromisoformat(
                reading.get('timestamp', datetime.now().isoformat()).replace('Z', '+00:00')
            )
        )
    
    def to_dict(self) -> dict:
        return {
            'air_temperature': self.air_temperature,
            'air_humidity': self.air_humidity,
            'soil_moisture': self.soil_moisture,
            'soil_temperature': self.soil_temperature,
            'timestamp': self.timestamp.isoformat()
        }


@dataclass
class IrrigationDecision:
    """Decisão de irrigação baseada na IA"""
    needs_irrigation: bool
    current_moisture: float
    target_moisture: float
    predicted_moisture: Optional[float]
    confidence: float
    recommendation: str
    urgency: str  # low, medium, high, critical
    pulse_count: int
    pulse_duration: float
    
    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class IrrigationResult:
    """Resultado de uma operação de irrigação"""
    success: bool
    pulses_executed: int
    total_duration: float
    moisture_before: float
    moisture_after: float
    message: str
    timestamp: datetime
    
    def to_dict(self) -> dict:
        result = asdict(self)
        result['timestamp'] = self.timestamp.isoformat()
        return result


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
        Calcula a umidade alvo considerando múltiplos fatores
        """
        ideal = cls.get_ideal_moisture(plant_type)
        base_target = ideal["ideal"]
        
        # Ajuste baseado na hora do dia (menos água à noite)
        if 6 <= time_of_day <= 18:
            time_factor = 1.0
        else:
            time_factor = 0.9
        
        # Ajuste baseado na temperatura (mais água em dias quentes)
        if temperature > 30:
            temp_factor = 1.1
        elif temperature < 20:
            temp_factor = 0.9
        else:
            temp_factor = 1.0
        
        target = base_target * time_factor * temp_factor
        
        # Garantir que o alvo está dentro dos limites
        return max(ideal["min"], min(ideal["max"], target))
    
    @classmethod
    def get_all_plants(cls) -> Dict[str, Dict]:
        """Retorna informações de todas as plantas"""
        return cls.PLANT_IDEAL_MOISTURE.copy()


class SmartIrrigationService:
    """
    Serviço de Irrigação Inteligente
    Gerencia decisões e execução de irrigação usando LSTM
    """
    
    # Configurações padrão
    DEFAULT_PULSE_DURATION = 1.0      # 1 segundo por pulso
    DEFAULT_PULSE_WAIT = 30           # 30 segundos de espera
    DEFAULT_MAX_PULSES = 15           # Máximo de pulsos
    DEFAULT_CHECK_INTERVAL = 300      # 5 minutos entre verificações
    
    def __init__(
        self,
        backend_url: str = "http://localhost:5000",
        lstm_model = None,
        preprocessor = None
    ):
        self.backend_url = backend_url
        self.lstm_model = lstm_model
        self.preprocessor = preprocessor
        self.knowledge_base = PlantKnowledgeBase()
        
        # Estado do serviço
        self.status = IrrigationStatus.IDLE
        self.reading_history: Dict[str, List[SensorReading]] = {}  # por greenhouse
        self.last_irrigation: Dict[str, datetime] = {}
        self.irrigation_config: Dict[str, dict] = {}  # configurações por greenhouse
        
        # Thread de monitoramento
        self._monitor_thread: Optional[threading.Thread] = None
        self._stop_event = threading.Event()
        self._monitored_greenhouses: Dict[str, dict] = {}
        
        logger.info("🌱 SmartIrrigationService inicializado")
    
    def configure_greenhouse(
        self,
        greenhouse_id: str,
        esp32_ip: str,
        esp32_port: int = 8080,
        plant_type: str = "default",
        pulse_duration: float = None,
        pulse_wait: int = None,
        max_pulses: int = None,
        auto_irrigate: bool = False,
        check_interval: int = None,
        target_moisture: float = None
    ) -> dict:
        """Configura parâmetros de irrigação para uma greenhouse"""
        
        # Se target_moisture não especificado, usar o ideal da planta
        if target_moisture is None:
            ideal = self.knowledge_base.get_ideal_moisture(plant_type)
            target_moisture = ideal["ideal"]
        
        config = {
            'esp32_url': f"http://{esp32_ip}:{esp32_port}",
            'plant_type': plant_type,
            'pulse_duration': pulse_duration or self.DEFAULT_PULSE_DURATION,
            'pulse_wait': pulse_wait or self.DEFAULT_PULSE_WAIT,
            'max_pulses': max_pulses or self.DEFAULT_MAX_PULSES,
            'auto_irrigate': auto_irrigate,
            'check_interval': check_interval or self.DEFAULT_CHECK_INTERVAL,
            'target_moisture': target_moisture,
            'configured_at': datetime.now().isoformat()
        }
        
        self.irrigation_config[greenhouse_id] = config
        
        # Inicializar histórico
        if greenhouse_id not in self.reading_history:
            self.reading_history[greenhouse_id] = []
            self._load_historical_data(greenhouse_id)
        
        logger.info(f"✅ Greenhouse {greenhouse_id} configurada: {plant_type}, pulso={config['pulse_duration']}s")
        
        return config
    
    def _load_historical_data(self, greenhouse_id: str):
        """Carrega dados históricos do backend"""
        try:
            url = f"{self.backend_url}/sensor/greenhouse/{greenhouse_id}/history"
            response = requests.get(url, params={"hours": 48, "limit": 100}, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and data.get('data'):
                    for reading_data in data['data']:
                        reading = SensorReading(
                            air_temperature=float(reading_data.get('airTemperature', 0)),
                            air_humidity=float(reading_data.get('airHumidity', 0)),
                            soil_moisture=float(reading_data.get('soilMoisture', 0)),
                            soil_temperature=float(reading_data.get('soilTemperature', 0)),
                            timestamp=datetime.fromisoformat(
                                reading_data.get('timestamp', datetime.now().isoformat()).replace('Z', '+00:00')
                            )
                        )
                        self.reading_history[greenhouse_id].append(reading)
                    
                    logger.info(f"📚 Carregadas {len(self.reading_history[greenhouse_id])} leituras para {greenhouse_id}")
        except Exception as e:
            logger.warning(f"⚠️ Não foi possível carregar histórico de {greenhouse_id}: {e}")
    
    def get_current_reading(self, greenhouse_id: str) -> Optional[SensorReading]:
        """Obtém leitura atual dos sensores via backend"""
        try:
            url = f"{self.backend_url}/sensor/greenhouse/{greenhouse_id}/latest"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and data.get('data'):
                    reading = SensorReading.from_api_response(data['data'])
                    
                    # Adicionar ao histórico
                    if greenhouse_id not in self.reading_history:
                        self.reading_history[greenhouse_id] = []
                    self.reading_history[greenhouse_id].append(reading)
                    
                    # Manter apenas últimas 100 leituras
                    if len(self.reading_history[greenhouse_id]) > 100:
                        self.reading_history[greenhouse_id] = self.reading_history[greenhouse_id][-100:]
                    
                    return reading
            
            return None
            
        except Exception as e:
            logger.error(f"❌ Erro ao obter leitura de {greenhouse_id}: {e}")
            return None
    
    def predict_moisture(self, greenhouse_id: str) -> Optional[List[float]]:
        """Usa o LSTM para prever umidade futura"""
        if self.lstm_model is None:
            return None
        
        history = self.reading_history.get(greenhouse_id, [])
        if len(history) < 24:
            return None
        
        try:
            # Preparar dados para LSTM (últimas 24 leituras, 4 features)
            recent = history[-24:]
            sequence = np.array([
                [r.air_temperature, r.air_humidity, r.soil_moisture, r.soil_temperature]
                for r in recent
            ])
            
            # Normalizar se preprocessor disponível
            if self.preprocessor:
                # Criar DataFrame temporário para normalização
                import pandas as pd
                df = pd.DataFrame(sequence, columns=['airTemperature', 'airHumidity', 'soilMoisture', 'soilTemperature'])
                df_norm = self.preprocessor.normalize_data(df)
                sequence = df_norm.values
            
            # Fazer previsão
            input_tensor = torch.FloatTensor(sequence).unsqueeze(0)
            
            with torch.no_grad():
                prediction = self.lstm_model(input_tensor)
                predicted_values = prediction[0].tolist()
            
            # Desnormalizar (modelo retorna valores normalizados 0-1, converter para %)
            predicted_moisture = [round(m * 100, 2) for m in predicted_values]
            
            return predicted_moisture
            
        except Exception as e:
            logger.error(f"Erro na previsão LSTM: {e}")
            return None
    
    def analyze_irrigation_need(self, greenhouse_id: str) -> IrrigationDecision:
        """Analisa se a greenhouse precisa de irrigação"""
        
        config = self.irrigation_config.get(greenhouse_id, {})
        plant_type = config.get('plant_type', 'default')
        
        # Obter leitura atual
        reading = self.get_current_reading(greenhouse_id)
        if not reading:
            return IrrigationDecision(
                needs_irrigation=False,
                current_moisture=0,
                target_moisture=0,
                predicted_moisture=None,
                confidence=0,
                recommendation="Erro: não foi possível obter leitura dos sensores",
                urgency="low",
                pulse_count=0,
                pulse_duration=0
            )
        
        current_moisture = reading.soil_moisture
        
        # Usar target_moisture configurado pelo usuário, ou calcular baseado na planta
        target_moisture = config.get('target_moisture')
        if target_moisture is None:
            target_moisture = self.knowledge_base.calculate_target_moisture(
                current_moisture,
                plant_type,
                time_of_day=datetime.now().hour,
                temperature=reading.air_temperature
            )
        
        # Obter previsão LSTM
        predictions = self.predict_moisture(greenhouse_id)
        predicted_avg = np.mean(predictions[:6]) if predictions else None
        
        # Determinar necessidade de irrigação baseado no target configurado
        needs_irrigation = False
        urgency = "low"
        recommendation = ""
        confidence = 0.85
        pulse_duration = config.get('pulse_duration', self.DEFAULT_PULSE_DURATION)
        
        # Lógica simplificada: irrigar se abaixo do target
        moisture_deficit = target_moisture - current_moisture
        
        if moisture_deficit > 0:
            needs_irrigation = True
            
            if moisture_deficit > 30:
                urgency = "critical"
                recommendation = f"CRÍTICO: {current_moisture}% → alvo {target_moisture}% (déficit: {moisture_deficit:.1f}%)"
                confidence = 0.95
            elif moisture_deficit > 15:
                urgency = "high"
                recommendation = f"URGENTE: {current_moisture}% → alvo {target_moisture}% (déficit: {moisture_deficit:.1f}%)"
                confidence = 0.90
            elif moisture_deficit > 5:
                urgency = "medium"
                recommendation = f"Recomendado: {current_moisture}% → alvo {target_moisture}%"
                confidence = 0.85
            else:
                urgency = "low"
                recommendation = f"Ajuste fino: {current_moisture}% → alvo {target_moisture}%"
                confidence = 0.80
        else:
            recommendation = f"OK: Umidade atual ({current_moisture}%) >= alvo ({target_moisture}%)"
        
        # Usar previsão LSTM para confirmar decisão
        if predictions and needs_irrigation:
            predicted_in_1h = predictions[0] if predictions else None
            if predicted_in_1h:
                recommendation += f" | LSTM prevê {predicted_in_1h:.1f}% em 1h"
        
        # Calcular pulsos necessários
        pulse_count = 0
        
        if needs_irrigation:
            # Estimar: cada pulso de 0.5s aumenta ~1-2% de umidade (conservador)
            effect_per_pulse = 1.5 * pulse_duration  # ~1.5% por segundo de pulso
            pulses_needed = int(moisture_deficit / effect_per_pulse) + 1
            pulse_count = max(1, min(pulses_needed, config.get('max_pulses', self.DEFAULT_MAX_PULSES)))
        
        return IrrigationDecision(
            needs_irrigation=needs_irrigation,
            current_moisture=current_moisture,
            target_moisture=target_moisture,
            predicted_moisture=predicted_avg,
            confidence=confidence,
            recommendation=recommendation,
            urgency=urgency,
            pulse_count=pulse_count,
            pulse_duration=pulse_duration
        )
    
    def execute_irrigation(self, greenhouse_id: str, decision: IrrigationDecision = None) -> IrrigationResult:
        """Executa irrigação gradual baseada na decisão"""
        
        config = self.irrigation_config.get(greenhouse_id, {})
        esp32_url = config.get('esp32_url')
        
        if not esp32_url:
            return IrrigationResult(
                success=False,
                pulses_executed=0,
                total_duration=0,
                moisture_before=0,
                moisture_after=0,
                message="Erro: ESP32 não configurado para esta greenhouse",
                timestamp=datetime.now()
            )
        
        # Obter leitura inicial
        reading = self.get_current_reading(greenhouse_id)
        moisture_before = reading.soil_moisture if reading else 0
        
        # Se não passou decisão, analisar
        if decision is None:
            decision = self.analyze_irrigation_need(greenhouse_id)
        
        if not decision.needs_irrigation:
            return IrrigationResult(
                success=True,
                pulses_executed=0,
                total_duration=0,
                moisture_before=moisture_before,
                moisture_after=moisture_before,
                message="Irrigação não necessária",
                timestamp=datetime.now()
            )
        
        self.status = IrrigationStatus.IRRIGATING
        
        pulse_duration = decision.pulse_duration
        pulse_wait = config.get('pulse_wait', self.DEFAULT_PULSE_WAIT)
        pulses_executed = 0
        total_duration = 0
        
        logger.info(f"🚿 Iniciando irrigação: {decision.pulse_count} pulsos de {pulse_duration}s")
        
        try:
            for i in range(decision.pulse_count):
                # Ativar bomba
                response = requests.post(
                    f"{esp32_url}/pump/activate",
                    json={"duration": int(pulse_duration * 1000)},  # ms
                    timeout=10
                )
                
                if response.status_code == 200:
                    pulses_executed += 1
                    total_duration += pulse_duration
                    logger.info(f"💦 Pulso {i+1}/{decision.pulse_count} executado")
                else:
                    logger.warning(f"⚠️ Falha no pulso {i+1}")
                
                # Esperar absorção
                if i < decision.pulse_count - 1:
                    self.status = IrrigationStatus.WAITING
                    time.sleep(pulse_wait)
                    
                    # Verificar umidade atual
                    reading = self.get_current_reading(greenhouse_id)
                    if reading and reading.soil_moisture >= decision.target_moisture:
                        logger.info(f"✅ Umidade alvo atingida: {reading.soil_moisture}%")
                        break
            
            # Obter leitura final
            time.sleep(5)  # Esperar estabilização
            reading = self.get_current_reading(greenhouse_id)
            moisture_after = reading.soil_moisture if reading else moisture_before
            
            self.last_irrigation[greenhouse_id] = datetime.now()
            self.status = IrrigationStatus.IDLE
            
            # Report success to backend
            self._report_irrigation_to_backend(
                greenhouse_id=greenhouse_id,
                status='success',
                duration_ms=int(total_duration * 1000),
                pulse_count=pulses_executed,
                moisture_before=moisture_before,
                moisture_after=moisture_after,
                target_moisture=decision.target_moisture,
                plant_type=config.get('plant_type'),
                esp32_ip=esp32_url.replace('http://', '').split(':')[0] if esp32_url else None
            )
            
            return IrrigationResult(
                success=True,
                pulses_executed=pulses_executed,
                total_duration=total_duration,
                moisture_before=moisture_before,
                moisture_after=moisture_after,
                message=f"Irrigação completa: {moisture_before}% → {moisture_after}%",
                timestamp=datetime.now()
            )
            
        except Exception as e:
            self.status = IrrigationStatus.ERROR
            logger.error(f"❌ Erro na irrigação: {e}")
            
            # Report failure to backend
            self._report_irrigation_to_backend(
                greenhouse_id=greenhouse_id,
                status='failed',
                duration_ms=int(total_duration * 1000),
                pulse_count=pulses_executed,
                moisture_before=moisture_before,
                target_moisture=decision.target_moisture if decision else None,
                plant_type=config.get('plant_type'),
                esp32_ip=esp32_url.replace('http://', '').split(':')[0] if esp32_url else None,
                error_message=str(e)
            )
            
            return IrrigationResult(
                success=False,
                pulses_executed=pulses_executed,
                total_duration=total_duration,
                moisture_before=moisture_before,
                moisture_after=moisture_before,
                message=f"Erro: {str(e)}",
                timestamp=datetime.now()
            )
    
    def get_pump_status(self, greenhouse_id: str) -> Optional[dict]:
        """Obtém status da bomba do ESP32"""
        config = self.irrigation_config.get(greenhouse_id, {})
        esp32_url = config.get('esp32_url')
        
        if not esp32_url:
            return None
        
        try:
            response = requests.get(f"{esp32_url}/pump/status", timeout=5)
            if response.status_code == 200:
                return response.json()
        except:
            pass
        
        return None
    
    def start_monitoring(self, greenhouse_id: str, esp32_ip: str, **kwargs):
        """Inicia monitoramento contínuo de uma greenhouse"""
        
        # Configurar greenhouse se ainda não foi
        if greenhouse_id not in self.irrigation_config:
            self.configure_greenhouse(greenhouse_id, esp32_ip, **kwargs)
        
        config = self.irrigation_config[greenhouse_id]
        
        # Atualizar auto_irrigate se foi passado explicitamente
        if 'auto_irrigate' in kwargs:
            config['auto_irrigate'] = kwargs['auto_irrigate']
        else:
            # Garantir que auto_irrigate está True para monitoramento
            config['auto_irrigate'] = True
        
        self._monitored_greenhouses[greenhouse_id] = {
            'esp32_ip': esp32_ip,
            'config': config,
            'started_at': datetime.now()
        }
        
        # Iniciar thread de monitoramento se ainda não está rodando
        if self._monitor_thread is None or not self._monitor_thread.is_alive():
            self._stop_event.clear()
            self._monitor_thread = threading.Thread(target=self._monitoring_loop, daemon=True)
            self._monitor_thread.start()
            logger.info("🔄 Thread de monitoramento iniciada")
        
        logger.info(f"👁️ Monitoramento iniciado para {greenhouse_id}")
        return {"status": "monitoring_started", "greenhouse_id": greenhouse_id}
    
    def stop_monitoring(self, greenhouse_id: str = None):
        """Para monitoramento de uma ou todas as greenhouses"""
        if greenhouse_id:
            if greenhouse_id in self._monitored_greenhouses:
                del self._monitored_greenhouses[greenhouse_id]
                logger.info(f"⏹️ Monitoramento parado para {greenhouse_id}")
        else:
            self._stop_event.set()
            self._monitored_greenhouses.clear()
            logger.info("⏹️ Todos os monitoramentos parados")
    
    def _monitoring_loop(self):
        """Loop de monitoramento em background"""
        print("🔄 MONITORING LOOP STARTED!")
        logger.info("🔄 Loop de monitoramento iniciado")
        
        # Track last prediction notification per greenhouse (avoid spam)
        last_prediction_time = {}
        PREDICTION_COOLDOWN = 7200  # 2 hours in seconds
        
        while not self._stop_event.is_set():
            print(f"🔄 Checking {len(self._monitored_greenhouses)} greenhouses...")
            
            for greenhouse_id, info in list(self._monitored_greenhouses.items()):
                try:
                    config = info['config']
                    pulse_wait = config.get('pulse_wait', self.DEFAULT_PULSE_WAIT)
                    
                    print(f"📊 Analyzing {greenhouse_id[:8]}... auto_irrigate={config.get('auto_irrigate')}")
                    
                    # Analisar necessidade de irrigação
                    decision = self.analyze_irrigation_need(greenhouse_id)
                    
                    print(f"📊 [{greenhouse_id[:8]}] Umidade={decision.current_moisture}% → Alvo={decision.target_moisture}%, Precisa={decision.needs_irrigation}")
                    logger.info(f"📊 [{greenhouse_id[:8]}] Umidade={decision.current_moisture}% → Alvo={decision.target_moisture}%, "
                              f"Precisa irrigar={decision.needs_irrigation}")
                    
                    # Check LSTM predictions and send notification if needed
                    current_time = time.time()
                    last_notif = last_prediction_time.get(greenhouse_id, 0)
                    
                    if current_time - last_notif > PREDICTION_COOLDOWN:
                        prediction_sent = self._check_and_send_prediction(
                            greenhouse_id, config, decision
                        )
                        if prediction_sent:
                            last_prediction_time[greenhouse_id] = current_time
                    
                    # Irrigar automaticamente se configurado e precisar
                    if decision.needs_irrigation and config.get('auto_irrigate', False):
                        print(f"💧 Executing pulse for {greenhouse_id[:8]}...")
                        # Executar um único pulso
                        result = self._execute_single_pulse(greenhouse_id, config)
                        
                        if result:
                            print(f"💧 [{greenhouse_id[:8]}] Pulso OK! Aguardando {pulse_wait}s...")
                            logger.info(f"💧 [{greenhouse_id[:8]}] Pulso executado! Aguardando {pulse_wait}s para próxima leitura...")
                        else:
                            print(f"⚠️ [{greenhouse_id[:8]}] Falha no pulso!")
                            logger.warning(f"⚠️ [{greenhouse_id[:8]}] Falha ao executar pulso")
                    
                    elif not decision.needs_irrigation:
                        print(f"✅ [{greenhouse_id[:8]}] Meta atingida!")
                        logger.info(f"✅ [{greenhouse_id[:8]}] Meta atingida! Umidade {decision.current_moisture}% >= Alvo {decision.target_moisture}%")
                    
                except Exception as e:
                    print(f"❌ Error: {e}")
                    logger.error(f"❌ Erro no monitoramento de {greenhouse_id[:8]}: {e}")
            
            # Aguardar próxima verificação (usa pulse_wait como intervalo)
            check_interval = min(
                info.get('config', {}).get('pulse_wait', self.DEFAULT_PULSE_WAIT)
                for info in self._monitored_greenhouses.values()
            ) if self._monitored_greenhouses else self.DEFAULT_CHECK_INTERVAL
            
            print(f"⏳ Waiting {check_interval}s for next check...")
            self._stop_event.wait(check_interval)
        
        logger.info("🔄 Loop de monitoramento encerrado")
    
    def _execute_single_pulse(self, greenhouse_id: str, config: dict) -> bool:
        """Executa um único pulso de irrigação"""
        esp32_url = config.get('esp32_url')
        pulse_duration = config.get('pulse_duration', self.DEFAULT_PULSE_DURATION)
        
        if not esp32_url:
            return False
        
        try:
            # Obter leitura antes da irrigação
            reading = self.get_current_reading(greenhouse_id)
            moisture_before = reading.soil_moisture if reading else 0
            target_moisture = config.get('target_moisture', 50)
            plant_type = config.get('plant_type', 'default')
            
            # Ativar bomba via POST
            activate_url = f"{esp32_url}/pump/activate"
            
            # ESP32 aceita duration_ms em milissegundos diretamente
            duration_ms = int(pulse_duration * 1000)
            payload = {"duration_ms": duration_ms}
            
            logger.info(f"🔌 Enviando para {activate_url}: {payload}")
            response = requests.post(activate_url, json=payload, timeout=10)
            
            if response.status_code == 200:
                self.last_irrigation[greenhouse_id] = datetime.now()
                logger.info(f"💧 Bomba ativada por {pulse_duration}s ({duration_ms}ms)")
                
                # Reportar sucesso ao backend
                self._report_irrigation_to_backend(
                    greenhouse_id=greenhouse_id,
                    status='success',
                    duration_ms=duration_ms,
                    pulse_count=1,
                    moisture_before=moisture_before,
                    target_moisture=target_moisture,
                    plant_type=plant_type,
                    esp32_ip=esp32_url.replace('http://', '').split(':')[0]
                )
                
                return True
            else:
                logger.warning(f"ESP32 retornou {response.status_code}: {response.text}")
                
                # Reportar falha ao backend
                self._report_irrigation_to_backend(
                    greenhouse_id=greenhouse_id,
                    status='failed',
                    duration_ms=0,
                    pulse_count=0,
                    moisture_before=moisture_before,
                    target_moisture=target_moisture,
                    plant_type=plant_type,
                    esp32_ip=esp32_url.replace('http://', '').split(':')[0],
                    error_message=f"ESP32 returned {response.status_code}: {response.text}"
                )
                
                return False
                
        except Exception as e:
            logger.error(f"Erro ao ativar bomba: {e}")
            
            # Reportar falha ao backend
            self._report_irrigation_to_backend(
                greenhouse_id=greenhouse_id,
                status='failed',
                duration_ms=0,
                pulse_count=0,
                moisture_before=moisture_before if 'moisture_before' in dir() else 0,
                target_moisture=config.get('target_moisture', 50),
                plant_type=config.get('plant_type', 'default'),
                esp32_ip=esp32_url.replace('http://', '').split(':')[0] if esp32_url else 'unknown',
                error_message=str(e)
            )
            
            return False
    
    def _check_and_send_prediction(self, greenhouse_id: str, config: dict, decision) -> bool:
        """
        Check LSTM predictions and send notification if soil is predicted to dry
        Returns True if a notification was sent
        """
        try:
            # Get LSTM predictions
            predictions = self.predict_moisture(greenhouse_id)
            if not predictions or len(predictions) < 6:
                return False
            
            # Get current reading
            reading = self.get_current_reading(greenhouse_id)
            if not reading:
                return False
            
            current_moisture = reading.soil_moisture
            target_moisture = config.get('target_moisture', 50)
            plant_type = config.get('plant_type', 'default')
            
            # Analyze predictions for next 6 hours
            predicted_6h = predictions[5] if len(predictions) > 5 else predictions[-1]
            predicted_3h = predictions[2] if len(predictions) > 2 else predictions[-1]
            
            # Calculate moisture drop
            moisture_drop_6h = current_moisture - predicted_6h
            
            # Determine if we should send a notification
            prediction_type = None
            recommendation = None
            hours_ahead = 6
            
            # Check for significant moisture drop (> 15% drop predicted)
            if moisture_drop_6h > 15 and predicted_6h < target_moisture:
                prediction_type = 'moisture_drop'
                recommendation = f"Irrigação preventiva recomendada. A umidade pode cair {moisture_drop_6h:.0f}% nas próximas horas."
                hours_ahead = 6
            
            # Check for temperature-driven drying
            elif reading.air_temperature > 30 and moisture_drop_6h > 10:
                prediction_type = 'temperature_rise'
                recommendation = f"Com a temperatura alta ({reading.air_temperature:.0f}°C), a evaporação será mais rápida. Considere irrigar."
                hours_ahead = 6
            
            # Check for humidity drop impact
            elif reading.air_humidity < 40 and moisture_drop_6h > 8:
                prediction_type = 'humidity_drop'
                recommendation = f"O ar seco ({reading.air_humidity:.0f}%) acelera a perda de água. Monitore a umidade do solo."
                hours_ahead = 6
            
            # If conditions are good, maybe send positive notification occasionally
            elif current_moisture >= target_moisture and moisture_drop_6h < 5 and decision.current_moisture > target_moisture * 0.9:
                # Only send "optimal" notifications very rarely (let the normal flow handle it)
                return False
            
            if prediction_type is None:
                return False
            
            # Send prediction notification to backend
            logger.info(f"🔮 Sending {prediction_type} prediction for {greenhouse_id[:8]}")
            
            payload = {
                'greenhouseId': greenhouse_id,
                'predictionType': prediction_type,
                'currentMoisture': current_moisture,
                'predictedMoisture': predicted_6h,
                'confidence': 75 + min(20, len(self.reading_history.get(greenhouse_id, [])) // 5),  # 75-95%
                'hoursAhead': hours_ahead,
                'plantType': plant_type,
                'currentTemperature': reading.air_temperature,
                'predictedTemperature': reading.air_temperature + 2,  # Estimate slight increase
                'currentHumidity': reading.air_humidity,
                'predictedHumidity': reading.air_humidity - 5,  # Estimate slight decrease
                'recommendation': recommendation
            }
            
            prediction_url = f"{self.backend_url}/irrigation/ai/prediction"
            response = requests.post(prediction_url, json=payload, timeout=5)
            
            if response.status_code == 201:
                result = response.json()
                if result.get('success') and not result.get('skipped'):
                    logger.info(f"🔮 Prediction notification sent: {result.get('notificationId')}")
                    return True
                elif result.get('skipped'):
                    logger.debug(f"🔮 Prediction notification skipped: {result.get('reason')}")
            else:
                logger.warning(f"⚠️ Prediction notification failed: {response.status_code}")
            
            return False
            
        except Exception as e:
            logger.error(f"❌ Error checking predictions: {e}")
            return False

    def _report_irrigation_to_backend(
        self,
        greenhouse_id: str,
        status: str,
        duration_ms: int,
        pulse_count: int = 1,
        moisture_before: float = None,
        moisture_after: float = None,
        target_moisture: float = None,
        plant_type: str = None,
        esp32_ip: str = None,
        error_message: str = None
    ):
        """Report irrigation event to backend for logging and notifications"""
        try:
            report_url = f"{self.backend_url}/irrigation/ai/report"
            payload = {
                'greenhouseId': greenhouse_id,
                'status': status,
                'durationMs': duration_ms,
                'pulseCount': pulse_count,
                'moistureBefore': moisture_before,
                'moistureAfter': moisture_after,
                'targetMoisture': target_moisture,
                'plantType': plant_type,
                'esp32Ip': esp32_ip,
                'errorMessage': error_message
            }
            
            # Remove None values
            payload = {k: v for k, v in payload.items() if v is not None}
            
            logger.info(f"📤 Reporting irrigation to backend: {status}")
            response = requests.post(report_url, json=payload, timeout=5)
            
            if response.status_code == 201:
                result = response.json()
                logger.info(f"✅ Backend reported: irrigationId={result.get('irrigationId')}")
            else:
                logger.warning(f"⚠️ Backend report failed: {response.status_code} - {response.text}")
                
        except Exception as e:
            logger.error(f"❌ Failed to report to backend: {e}")
    
    def get_status(self, greenhouse_id: str = None) -> dict:
        """Retorna status do serviço de irrigação"""
        
        if greenhouse_id:
            config = self.irrigation_config.get(greenhouse_id, {})
            history = self.reading_history.get(greenhouse_id, [])
            monitored = greenhouse_id in self._monitored_greenhouses
            
            status = {
                'greenhouse_id': greenhouse_id,
                'configured': greenhouse_id in self.irrigation_config,
                'monitoring': monitored,
                'history_count': len(history),
                'last_irrigation': self.last_irrigation.get(greenhouse_id, None),
                'config': config
            }
            
            # Adicionar análise atual
            if history:
                decision = self.analyze_irrigation_need(greenhouse_id)
                status['current_analysis'] = decision.to_dict()
            
            return status
        
        return {
            'service_status': self.status.value,
            'configured_greenhouses': list(self.irrigation_config.keys()),
            'monitored_greenhouses': list(self._monitored_greenhouses.keys()),
            'monitoring_active': self._monitor_thread is not None and self._monitor_thread.is_alive()
        }
