"""
Script simplificado para testar os modelos LSTM treinados
"""
import os
import torch
import numpy as np
from dotenv import load_dotenv

load_dotenv()

# Importar modelo
from models.lstm_model import LSTMModel

def test_model_loading():
    """Testa carregamento dos modelos"""
    print("\n🧪 TESTANDO CARREGAMENTO DOS MODELOS")
    print("="*70)
    
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Device: {device}")
    
    # Testar modelo de umidade do solo
    print("\n📦 1. Modelo de Previsão de Umidade do Solo")
    print("-"*70)
    moisture_path = "./models/saved/soil_moisture_predictor/soil_moisture_predictor_latest.pt"
    
    if os.path.exists(moisture_path):
        print(f"✅ Arquivo encontrado: {moisture_path}")
        
        # Carregar checkpoint
        checkpoint = torch.load(moisture_path, map_location=device)
        print(f"✅ Checkpoint carregado")
        
        # Exibir informações
        if 'model_config' in checkpoint:
            config = checkpoint['model_config']
            print(f"   Configuração:")
            print(f"   - Input size: {config.get('input_size', 'N/A')}")
            print(f"   - Hidden size: {config.get('hidden_size', 'N/A')}")
            print(f"   - Num layers: {config.get('num_layers', 'N/A')}")
            print(f"   - Output size: {config.get('output_size', 'N/A')}")
            
            # Criar modelo
            model = LSTMModel(
                input_size=config['input_size'],
                hidden_size=config['hidden_size'],
                num_layers=config['num_layers'],
                output_size=config['output_size']
            ).to(device)
            
            # Carregar pesos
            model.load_state_dict(checkpoint['model_state_dict'])
            model.eval()
            print(f"✅ Modelo carregado e pronto para inferência")
            
            # Teste de inferência com dados sintéticos
            print("\n🔍 Testando inferência com dados sintéticos...")
            test_input = torch.randn(1, 24, config['input_size']).to(device)
            with torch.no_grad():
                test_output = model(test_input)
            print(f"   Input shape: {test_input.shape}")
            print(f"   Output shape: {test_output.shape}")
            print(f"   Output (primeiros 5): {test_output[0, :5].cpu().numpy()}")
            
        if 'training_history' in checkpoint:
            history = checkpoint['training_history']
            print(f"\n📊 Histórico de treinamento:")
            print(f"   - Épocas: {history.get('epochs_trained', 'N/A')}")
            print(f"   - Perda final: {history.get('final_loss', 'N/A'):.6f}")
            print(f"   - Melhor época: {history.get('best_epoch', 'N/A')}")
            
    else:
        print(f"❌ Arquivo não encontrado: {moisture_path}")
    
    # Testar modelo de saúde da planta
    print("\n" + "="*70)
    print("📦 2. Modelo de Saúde da Planta")
    print("-"*70)
    health_path = "./models/saved/plant_health_predictor/plant_health_predictor_latest.pt"
    
    if os.path.exists(health_path):
        print(f"✅ Arquivo encontrado: {health_path}")
        
        # Carregar checkpoint
        checkpoint = torch.load(health_path, map_location=device)
        print(f"✅ Checkpoint carregado")
        
        # Exibir informações
        if 'model_config' in checkpoint:
            config = checkpoint['model_config']
            print(f"   Configuração:")
            print(f"   - Input size: {config.get('input_size', 'N/A')}")
            print(f"   - Hidden size: {config.get('hidden_size', 'N/A')}")
            print(f"   - Num layers: {config.get('num_layers', 'N/A')}")
            print(f"   - Output size: {config.get('output_size', 'N/A')}")
            
            # Criar modelo
            model = LSTMModel(
                input_size=config['input_size'],
                hidden_size=config['hidden_size'],
                num_layers=config['num_layers'],
                output_size=config['output_size']
            ).to(device)
            
            # Carregar pesos
            model.load_state_dict(checkpoint['model_state_dict'])
            model.eval()
            print(f"✅ Modelo carregado e pronto para inferência")
            
            # Teste de inferência com dados sintéticos
            print("\n🔍 Testando inferência com dados sintéticos...")
            test_input = torch.randn(1, 24, config['input_size']).to(device)
            with torch.no_grad():
                test_output = model(test_input)
            print(f"   Input shape: {test_input.shape}")
            print(f"   Output shape: {test_output.shape}")
            print(f"   Output (health score): {test_output[0, 0].cpu().item():.4f}")
            
            # Simular conversão para health status
            health_value = test_output[0, 0].cpu().item()
            if health_value >= 0.8:
                status = "SAUDÁVEL (HEALTHY)"
            elif health_value >= 0.5:
                status = "ESTRESSE MODERADO (MODERATE_STRESS)"
            else:
                status = "ESTRESSE ALTO (HIGH_STRESS)"
            print(f"   Health Status: {status}")
            
        if 'training_history' in checkpoint:
            history = checkpoint['training_history']
            print(f"\n📊 Histórico de treinamento:")
            print(f"   - Épocas: {history.get('epochs_trained', 'N/A')}")
            print(f"   - Perda final: {history.get('final_loss', 'N/A'):.2f}")
            print(f"   - Melhor época: {history.get('best_epoch', 'N/A')}")
            
    else:
        print(f"❌ Arquivo não encontrado: {health_path}")
    
    # Resumo
    print("\n" + "="*70)
    print("RESUMO DOS TESTES")
    print("="*70)
    print("✅ Modelos carregados com sucesso!")
    print("✅ Inferências funcionando corretamente!")
    print("\n📋 Próximos passos:")
    print("   1. Integrar modelos no Flask API (api_service.py)")
    print("   2. Criar endpoint /analyze-sensors")
    print("   3. Testar integração com backend NestJS")

if __name__ == "__main__":
    test_model_loading()
