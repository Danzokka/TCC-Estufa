import requests
import json
import time
import sys

class ESP32PumpTester:
    def __init__(self, esp32_ip):
        self.base_url = f"http://{esp32_ip}:8080"
        self.session = requests.Session()
        
    def test_connection(self):
        """Testa se o ESP32 está respondendo"""
        try:
            response = self.get_status()
            print("✅ Conexão com ESP32 estabelecida!")
            return True
        except Exception as e:
            print(f"❌ Erro de conexão: {e}")
            return False
    
    def get_status(self):
        """Obtém status atual da bomba"""
        response = self.session.get(f"{self.base_url}/pump/status")
        response.raise_for_status()
        return response.json()
    
    def activate_pump_duration(self, duration_seconds):
        """Ativa bomba por tempo específico"""
        data = {"duration": duration_seconds}
        response = self.session.post(
            f"{self.base_url}/pump/activate",
            headers={"Content-Type": "application/json"},
            data=json.dumps(data)
        )
        response.raise_for_status()
        return response.json()
    
    def activate_pump_volume(self, volume_liters):
        """Ativa bomba por volume específico"""
        data = {"volume": volume_liters}
        response = self.session.post(
            f"{self.base_url}/pump/activate",
            headers={"Content-Type": "application/json"},
            data=json.dumps(data)
        )
        response.raise_for_status()
        return response.json()
    
    def activate_pump_manual(self):
        """Ativa bomba em modo manual"""
        response = self.session.post(
            f"{self.base_url}/pump/activate",
            headers={"Content-Type": "application/json"},
            data=json.dumps({})
        )
        response.raise_for_status()
        return response.json()
    
    def deactivate_pump(self):
        """Desativa bomba"""
        response = self.session.post(
            f"{self.base_url}/pump/deactivate",
            headers={"Content-Type": "application/json"},
            data=json.dumps({})
        )
        response.raise_for_status()
        return response.json()
    
    def emergency_stop(self):
        """Parada de emergência"""
        response = self.session.post(
            f"{self.base_url}/pump/emergency-stop",
            headers={"Content-Type": "application/json"},
            data=json.dumps({})
        )
        response.raise_for_status()
        return response.json()
    
    def print_status(self, status_data):
        """Imprime status formatado"""
        print("\n📊 STATUS DA BOMBA:")
        print(f"   Estado: {status_data.get('status', 'unknown')}")
        print(f"   Habilitada: {status_data.get('enabled', False)}")
        print(f"   Modo: {status_data.get('mode', 'unknown')}")
        
        if status_data.get('status') == 'on':
            runtime = status_data.get('runtime_seconds', 0)
            print(f"   Tempo execução: {runtime}s")
            
            if 'remaining_seconds' in status_data:
                print(f"   Tempo restante: {status_data['remaining_seconds']}s")
                
            if 'current_volume' in status_data:
                current = status_data['current_volume']
                target = status_data['target_volume']
                print(f"   Volume: {current:.1f}/{target:.1f}L")
    
    def run_test_sequence(self):
        """Executa sequência completa de testes"""
        print("🚀 INICIANDO TESTES DO SISTEMA DE BOMBA ESP32")
        print("=" * 50)
        
        # Teste 1: Verificar conexão
        print("\n1️⃣ Testando conexão...")
        if not self.test_connection():
            return
        
        # Teste 2: Status inicial
        print("\n2️⃣ Verificando status inicial...")
        initial_status = self.get_status()
        self.print_status(initial_status)
        
        # Teste 3: Ativação por duração
        print("\n3️⃣ Testando ativação por duração (5 segundos)...")
        try:
            result = self.activate_pump_duration(5)
            print(f"   Resposta: {result}")
            print("   🔍 Verifique se o LED interno acendeu!")
            
            # Monitorar por alguns segundos
            for i in range(6):
                time.sleep(1)
                status = self.get_status()
                remaining = status.get('remaining_seconds', 0)
                print(f"   ⏱️  Segundo {i+1}: {remaining}s restantes")
                
        except Exception as e:
            print(f"   ❌ Erro: {e}")
        
        # Teste 4: Status após completar
        print("\n4️⃣ Status após completar duração...")
        final_status = self.get_status()
        self.print_status(final_status)
        print("   🔍 Verifique se o LED interno apagou!")
        
        # Teste 5: Ativação manual
        print("\n5️⃣ Testando ativação manual...")
        try:
            result = self.activate_pump_manual()
            print(f"   Resposta: {result}")
            print("   🔍 LED deve estar aceso (modo manual)")
            
            time.sleep(2)
            
            # Desativar manualmente
            print("   Desativando bomba manual...")
            deactivate_result = self.deactivate_pump()
            print(f"   Resposta: {deactivate_result}")
            print("   🔍 LED deve ter apagado")
            
        except Exception as e:
            print(f"   ❌ Erro: {e}")
        
        # Teste 6: Teste de volume (simulado)
        print("\n6️⃣ Testando ativação por volume (0.5L)...")
        try:
            result = self.activate_pump_volume(0.5)
            print(f"   Resposta: {result}")
            print("   ℹ️  Volume simulado - LED aceso até desativar")
            
            time.sleep(3)
            
            # Como não temos sensor real, desativar manualmente
            deactivate_result = self.deactivate_pump()
            print(f"   Desativação: {deactivate_result}")
            
        except Exception as e:
            print(f"   ❌ Erro: {e}")
        
        # Teste 7: Parada de emergência
        print("\n7️⃣ Testando parada de emergência...")
        try:
            # Primeiro ativar
            self.activate_pump_manual()
            print("   Bomba ativada, testando parada de emergência...")
            time.sleep(1)
            
            # Parada de emergência
            emergency_result = self.emergency_stop()
            print(f"   Resposta emergência: {emergency_result}")
            print("   🔍 LED deve ter apagado imediatamente!")
            
        except Exception as e:
            print(f"   ❌ Erro: {e}")
        
        # Status final
        print("\n8️⃣ Status final do sistema...")
        final_status = self.get_status()
        self.print_status(final_status)
        
        print("\n" + "=" * 50)
        print("✅ TESTES CONCLUÍDOS!")
        print("\n📋 VERIFICAÇÕES VISUAIS:")
        print("   • LED interno (GPIO 2) acende/apaga conforme status")
        print("   • Display OLED mostra status da bomba (switch LOW)")
        print("   • Serial Monitor mostra logs detalhados")
        print("   • Respostas HTTP adequadas para cada operação")

def main():
    if len(sys.argv) != 2:
        print("Uso: python test_pump.py <IP_DO_ESP32>")
        print("Exemplo: python test_pump.py 192.168.1.100")
        return
    
    esp32_ip = sys.argv[1]
    tester = ESP32PumpTester(esp32_ip)
    tester.run_test_sequence()

if __name__ == "__main__":
    main()
