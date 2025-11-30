#!/usr/bin/env python3
"""
Script de Irrigação Automática para Estufa Inteligente
Monitora a umidade do solo via Backend NestJS e ativa a bomba no ESP32

Uso:
    python auto_irrigation.py --esp32-ip 192.168.0.87 --greenhouse-id f9f09e4e-f18a-40f0-939d-d682edf6af5e
    python auto_irrigation.py --esp32-ip 192.168.0.87 --greenhouse-id f9f09e4e-f18a-40f0-939d-d682edf6af5e --threshold 30 --duration 3
    python auto_irrigation.py --esp32-ip 192.168.0.87 --greenhouse-id f9f09e4e-f18a-40f0-939d-d682edf6af5e --monitor
"""

import argparse
import logging
import time
import requests
from datetime import datetime
from typing import Optional
import os

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # dotenv é opcional

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Configurações padrão
DEFAULT_THRESHOLD_LOW = 30    # Abaixo disso, ativa irrigação
DEFAULT_THRESHOLD_IDEAL = 50  # Valor ideal de umidade
DEFAULT_PUMP_DURATION = 3     # Segundos de irrigação
DEFAULT_ESP32_PORT = 8080
DEFAULT_BACKEND_URL = "http://localhost:5000"


class AutoIrrigationController:
    """Controlador de irrigação automática baseado em umidade do solo"""
    
    def __init__(
        self, 
        esp32_ip: str,
        greenhouse_id: str,
        backend_url: str = DEFAULT_BACKEND_URL,
        threshold_low: int = DEFAULT_THRESHOLD_LOW,
        threshold_ideal: int = DEFAULT_THRESHOLD_IDEAL,
        pump_duration: int = DEFAULT_PUMP_DURATION,
        esp32_port: int = DEFAULT_ESP32_PORT
    ):
        self.esp32_ip = esp32_ip
        self.esp32_port = esp32_port
        self.esp32_url = f"http://{esp32_ip}:{esp32_port}"
        self.backend_url = backend_url
        self.greenhouse_id = greenhouse_id
        self.threshold_low = threshold_low
        self.threshold_ideal = threshold_ideal
        self.pump_duration = pump_duration
        
        logger.info(f"🌱 Controlador de Irrigação Automática inicializado")
        logger.info(f"   Backend: {self.backend_url}")
        logger.info(f"   ESP32: {self.esp32_url}")
        logger.info(f"   Greenhouse: {self.greenhouse_id}")
        logger.info(f"   Threshold baixo: {threshold_low}%")
        logger.info(f"   Threshold ideal: {threshold_ideal}%")
        logger.info(f"   Duração bomba: {pump_duration}s")
    
    def get_sensor_data_from_backend(self) -> Optional[dict]:
        """Busca dados atuais dos sensores via Backend NestJS"""
        try:
            url = f"{self.backend_url}/sensor/greenhouse/{self.greenhouse_id}/latest"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and data.get('data'):
                    logger.info(f"📊 Dados recebidos do backend")
                    return data['data']
                else:
                    logger.warning(f"⚠️  Resposta sem dados: {data}")
                    return None
            else:
                logger.error(f"❌ Erro ao buscar dados: {response.status_code}")
                return None
                
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ Erro de comunicação com backend: {e}")
            return None
    
    def check_irrigation_from_backend(self) -> Optional[dict]:
        """Verifica necessidade de irrigação via Backend"""
        try:
            url = f"{self.backend_url}/sensor/greenhouse/{self.greenhouse_id}/irrigation-check"
            params = {"threshold": self.threshold_low}
            response = requests.get(url, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and data.get('data'):
                    return data['data']
            return None
                
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ Erro ao verificar irrigação: {e}")
            return None
    
    def get_soil_moisture(self) -> Optional[float]:
        """Obtém a umidade do solo via Backend"""
        data = self.get_sensor_data_from_backend()
        
        if data and data.get('latestReading'):
            reading = data['latestReading']
            moisture = reading.get('soilMoisture')
            
            if moisture is not None:
                logger.info(f"💧 Umidade do solo: {moisture}%")
                return float(moisture)
        
        # Fallback: tentar valores atuais da greenhouse
        if data and data.get('currentValues'):
            moisture = data['currentValues'].get('soilMoisture')
            if moisture is not None:
                logger.info(f"💧 Umidade do solo (cache): {moisture}%")
                return float(moisture)
        
        logger.warning("⚠️  Não foi possível obter umidade do solo")
        return None
    
    def activate_pump(self, duration: int = None) -> bool:
        """Ativa a bomba por um determinado tempo via ESP32"""
        duration = duration or self.pump_duration
        
        try:
            logger.info(f"💦 Ativando bomba por {duration} segundos...")
            
            response = requests.post(
                f"{self.esp32_url}/pump/activate",
                json={"duration": duration},
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code == 200:
                logger.info(f"✅ Bomba ativada com sucesso!")
                try:
                    logger.info(f"   Resposta: {response.json()}")
                except:
                    logger.info(f"   Resposta: {response.text}")
                return True
            else:
                logger.error(f"❌ Falha ao ativar bomba: {response.status_code}")
                logger.error(f"   Resposta: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ Erro de comunicação com ESP32: {e}")
            return False
    
    def deactivate_pump(self) -> bool:
        """Desativa a bomba via ESP32"""
        try:
            logger.info("🛑 Desativando bomba...")
            
            response = requests.post(
                f"{self.esp32_url}/pump/deactivate",
                json={},
                headers={"Content-Type": "application/json"},
                timeout=5
            )
            
            if response.status_code == 200:
                logger.info("✅ Bomba desativada")
                return True
            else:
                logger.warning(f"⚠️  Resposta inesperada: {response.status_code}")
                return False
                
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ Erro ao desativar bomba: {e}")
            return False
    
    def get_pump_status(self) -> Optional[dict]:
        """Obtém o status atual da bomba via ESP32"""
        try:
            response = requests.get(f"{self.esp32_url}/pump/status", timeout=5)
            if response.status_code == 200:
                status = response.json()
                logger.info(f"🔧 Status da bomba: {status}")
                return status
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ Erro ao obter status da bomba: {e}")
        return None
    
    def check_and_irrigate(self) -> dict:
        """
        Verifica a umidade e irriga se necessário
        
        Retorna:
            dict com resultado da operação
        """
        result = {
            "timestamp": datetime.now().isoformat(),
            "action": "none",
            "initial_moisture": None,
            "final_moisture": None,
            "irrigated": False,
            "message": ""
        }
        
        # 1. Verificar via backend se precisa irrigar
        irrigation_check = self.check_irrigation_from_backend()
        
        if irrigation_check:
            result["initial_moisture"] = irrigation_check.get('soilMoisture')
            recommendation = irrigation_check.get('recommendation')
            reason = irrigation_check.get('reason', '')
            
            logger.info(f"📋 Recomendação: {recommendation}")
            logger.info(f"   Motivo: {reason}")
            
            if recommendation == 'WAIT':
                result["action"] = "wait"
                result["message"] = f"Sensor pode estar desconectado. {reason}"
                logger.warning(f"⏸️  {result['message']}")
                return result
            
            if recommendation == 'OK':
                result["action"] = "skip"
                result["message"] = reason
                logger.info(f"✅ {result['message']}")
                return result
            
            if recommendation == 'MONITOR':
                result["action"] = "monitor"
                result["message"] = reason
                logger.info(f"ℹ️  {result['message']}")
                return result
            
            if recommendation == 'IRRIGATE':
                result["action"] = "irrigate"
                logger.warning(f"⚠️  {reason}")
                
                # 2. Ativar bomba
                if self.activate_pump():
                    result["irrigated"] = True
                    
                    # 3. Aguardar irrigação + tempo para leitura
                    wait_time = self.pump_duration + 5
                    logger.info(f"⏳ Aguardando {wait_time}s para nova leitura...")
                    time.sleep(wait_time)
                    
                    # 4. Verificar nova umidade
                    final_moisture = self.get_soil_moisture()
                    
                    if final_moisture is not None:
                        result["final_moisture"] = final_moisture
                        initial = result["initial_moisture"] or 0
                        increase = final_moisture - initial
                        
                        if final_moisture >= self.threshold_ideal:
                            result["message"] = f"✅ Irrigação bem sucedida! {initial}% → {final_moisture}% (+{increase:.1f}%)"
                        elif final_moisture > initial:
                            result["message"] = f"⚠️  Umidade aumentou: {initial}% → {final_moisture}% (+{increase:.1f}%)"
                        else:
                            result["message"] = f"❌ Umidade não aumentou: {initial}% → {final_moisture}%"
                        
                        logger.info(result["message"])
                    else:
                        result["message"] = "Não foi possível verificar umidade após irrigação"
                        logger.warning(result["message"])
                else:
                    result["message"] = "Falha ao ativar a bomba"
                    logger.error(result["message"])
        else:
            # Fallback: tentar método direto
            initial_moisture = self.get_soil_moisture()
            
            if initial_moisture is None:
                result["message"] = "Não foi possível ler a umidade do solo"
                logger.warning(result["message"])
                return result
            
            result["initial_moisture"] = initial_moisture
            
            if initial_moisture >= self.threshold_ideal:
                result["action"] = "skip"
                result["message"] = f"Umidade OK ({initial_moisture}% >= {self.threshold_ideal}%)"
                logger.info(f"✅ {result['message']}")
            elif initial_moisture < self.threshold_low:
                result["action"] = "irrigate"
                
                if self.activate_pump():
                    result["irrigated"] = True
                    time.sleep(self.pump_duration + 5)
                    
                    final_moisture = self.get_soil_moisture()
                    if final_moisture:
                        result["final_moisture"] = final_moisture
                        result["message"] = f"Irrigação: {initial_moisture}% → {final_moisture}%"
                    else:
                        result["message"] = "Irrigação realizada, aguardando leitura"
                    
                    logger.info(result["message"])
        
        return result
    
    def irrigate_until_ideal(self, max_cycles: int = 5) -> dict:
        """
        Irriga em ciclos até atingir umidade ideal
        """
        result = {
            "timestamp": datetime.now().isoformat(),
            "cycles": 0,
            "initial_moisture": None,
            "final_moisture": None,
            "target_reached": False,
            "history": []
        }
        
        initial = self.get_soil_moisture()
        if initial is None:
            result["message"] = "Não foi possível ler umidade inicial"
            return result
        
        result["initial_moisture"] = initial
        current_moisture = initial
        
        logger.info(f"🎯 Objetivo: elevar umidade de {initial}% para {self.threshold_ideal}%")
        
        for cycle in range(1, max_cycles + 1):
            if current_moisture >= self.threshold_ideal:
                result["target_reached"] = True
                break
            
            logger.info(f"\n--- Ciclo {cycle}/{max_cycles} ---")
            
            cycle_result = self.check_and_irrigate()
            result["history"].append(cycle_result)
            result["cycles"] = cycle
            
            if cycle_result["final_moisture"] is not None:
                current_moisture = cycle_result["final_moisture"]
            
            if not cycle_result["irrigated"]:
                break
            
            if cycle < max_cycles and current_moisture < self.threshold_ideal:
                logger.info("⏳ Aguardando 10s antes do próximo ciclo...")
                time.sleep(10)
        
        result["final_moisture"] = current_moisture
        
        if result["target_reached"]:
            logger.info(f"\n✅ Meta atingida! Umidade: {initial}% → {current_moisture}%")
        else:
            logger.warning(f"\n⚠️  Meta não atingida após {result['cycles']} ciclos. Umidade: {current_moisture}%")
        
        return result
    
    def monitor_loop(self, interval: int = 60):
        """Loop de monitoramento contínuo"""
        logger.info(f"🔄 Iniciando monitoramento contínuo (intervalo: {interval}s)")
        logger.info("   Pressione Ctrl+C para parar\n")
        
        try:
            while True:
                logger.info(f"\n--- Verificação: {datetime.now().strftime('%H:%M:%S')} ---")
                
                result = self.check_and_irrigate()
                
                logger.info(f"Próxima verificação em {interval}s...")
                time.sleep(interval)
                
        except KeyboardInterrupt:
            logger.info("\n🛑 Monitoramento interrompido pelo usuário")


def main():
    parser = argparse.ArgumentParser(
        description='Sistema de Irrigação Automática para Estufa',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Exemplos:
  # Verificação única
  python auto_irrigation.py --esp32-ip 192.168.0.87 --greenhouse-id f9f09e4e-f18a-40f0-939d-d682edf6af5e
  
  # Com threshold customizado e duração
  python auto_irrigation.py --esp32-ip 192.168.0.87 --greenhouse-id f9f09e4e-f18a-40f0-939d-d682edf6af5e --threshold 25 --duration 5
  
  # Irrigar até atingir umidade ideal
  python auto_irrigation.py --esp32-ip 192.168.0.87 --greenhouse-id f9f09e4e-f18a-40f0-939d-d682edf6af5e --until-ideal
  
  # Modo de monitoramento contínuo
  python auto_irrigation.py --esp32-ip 192.168.0.87 --greenhouse-id f9f09e4e-f18a-40f0-939d-d682edf6af5e --monitor --interval 30
  
  # Forçar ativação da bomba
  python auto_irrigation.py --esp32-ip 192.168.0.87 --greenhouse-id f9f09e4e-f18a-40f0-939d-d682edf6af5e --activate --duration 3
"""
    )
    
    parser.add_argument('--esp32-ip', required=True, help='IP do ESP32')
    parser.add_argument('--greenhouse-id', required=True, help='ID da greenhouse no backend')
    parser.add_argument('--backend-url', default='http://localhost:5000', help='URL do backend (default: http://localhost:5000)')
    parser.add_argument('--port', type=int, default=8080, help='Porta do ESP32 (default: 8080)')
    parser.add_argument('--threshold', type=int, default=30, help='Threshold baixo de umidade %% (default: 30)')
    parser.add_argument('--ideal', type=int, default=50, help='Umidade ideal %% (default: 50)')
    parser.add_argument('--duration', type=int, default=3, help='Duração da irrigação em segundos (default: 3)')
    parser.add_argument('--until-ideal', action='store_true', help='Irrigar em ciclos até atingir umidade ideal')
    parser.add_argument('--max-cycles', type=int, default=5, help='Máximo de ciclos de irrigação (default: 5)')
    parser.add_argument('--monitor', action='store_true', help='Modo de monitoramento contínuo')
    parser.add_argument('--interval', type=int, default=60, help='Intervalo do monitoramento em segundos (default: 60)')
    parser.add_argument('--status-only', action='store_true', help='Apenas mostrar status atual')
    parser.add_argument('--activate', action='store_true', help='Forçar ativação da bomba')
    
    args = parser.parse_args()
    
    # Criar controlador
    controller = AutoIrrigationController(
        esp32_ip=args.esp32_ip,
        greenhouse_id=args.greenhouse_id,
        backend_url=args.backend_url,
        threshold_low=args.threshold,
        threshold_ideal=args.ideal,
        pump_duration=args.duration,
        esp32_port=args.port
    )
    
    print("\n" + "="*60)
    print("🌱 SISTEMA DE IRRIGAÇÃO AUTOMÁTICA - ESTUFA INTELIGENTE")
    print("="*60 + "\n")
    
    if args.status_only:
        # Apenas mostrar status
        logger.info("📊 Verificando status do sistema...\n")
        
        # Dados do backend
        data = controller.get_sensor_data_from_backend()
        if data:
            print(f"🏠 Greenhouse: {data.get('greenhouse', {}).get('name', 'N/A')}")
            print(f"   Online: {'✅' if data.get('greenhouse', {}).get('isOnline') else '❌'}")
            
            if data.get('latestReading'):
                reading = data['latestReading']
                print(f"\n📊 Última Leitura:")
                print(f"   🌡️  Temperatura: {reading.get('airTemperature')}°C")
                print(f"   💧 Umidade Ar: {reading.get('airHumidity')}%")
                print(f"   🌱 Umidade Solo: {reading.get('soilMoisture')}%")
                print(f"   🌡️  Temp. Solo: {reading.get('soilTemperature')}°C")
                print(f"   ⏰ Timestamp: {reading.get('timestamp')}")
        
        # Status da bomba
        pump_status = controller.get_pump_status()
        if pump_status:
            print(f"\n💦 Status da Bomba:")
            print(f"   {pump_status}")
        
    elif args.activate:
        # Forçar ativação
        logger.info(f"🚿 Forçando ativação da bomba por {args.duration}s...")
        controller.activate_pump(args.duration)
        
    elif args.until_ideal:
        # Irrigar até atingir ideal
        result = controller.irrigate_until_ideal(max_cycles=args.max_cycles)
        print(f"\n📋 Resultado Final:")
        print(f"   Ciclos executados: {result['cycles']}")
        print(f"   Umidade inicial: {result['initial_moisture']}%")
        print(f"   Umidade final: {result['final_moisture']}%")
        print(f"   Meta atingida: {'✅ Sim' if result['target_reached'] else '❌ Não'}")
        
    elif args.monitor:
        # Modo de monitoramento contínuo
        controller.monitor_loop(interval=args.interval)
        
    else:
        # Verificação única
        result = controller.check_and_irrigate()
        print(f"\n📋 Resultado:")
        print(f"   Ação: {result['action']}")
        print(f"   Umidade inicial: {result['initial_moisture']}%")
        if result['final_moisture']:
            print(f"   Umidade final: {result['final_moisture']}%")
        print(f"   Irrigou: {'✅ Sim' if result['irrigated'] else '❌ Não'}")
        print(f"   Mensagem: {result['message']}")


if __name__ == "__main__":
    main()
