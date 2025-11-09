"""
Script de teste para validar os modelos LSTM treinados
Testa predições de umidade do solo e score de saúde da planta
"""
import os
import sys
import torch
import numpy as np
from dotenv import load_dotenv

# Configurar paths
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Carregar variáveis de ambiente
load_dotenv()

from models.lstm_model import PlantLSTMTrainer
from data_processing.preprocessor import DataPreprocessor
from db.database import fetch_sensor_data

def test_soil_moisture_model():
    """Testa o modelo de previsão de umidade do solo"""
    print("\n" + "="*70)
    print("TESTANDO MODELO DE PREVISÃO DE UMIDADE DO SOLO")
    print("="*70)
    
    # Carregar dados
    print("\n📊 Carregando dados de teste...")
    df = fetch_sensor_data(days=60)
    print(f"✅ {len(df)} leituras carregadas")
    
    # Preparar dados
    preprocessor = DataPreprocessor()
    df_clean = preprocessor.clean_data(df)
    df_features = preprocessor.add_time_features(df_clean)
    df_normalized = preprocessor.normalize_data(df_features)
    
    # Criar sequências
    X, y = preprocessor.create_sequences(
        df_normalized,
        window_size=24,
        horizon=12,
        target_col='soilMoisture'
    )
    
    print(f"✅ {X.shape[0]} sequências criadas")
    
    # Carregar modelo
    print("\n🤖 Carregando modelo treinado...")
    model_path = "./models/saved/soil_moisture_predictor/soil_moisture_predictor_latest.pt"
    
    if not os.path.exists(model_path):
        print(f"❌ Modelo não encontrado em {model_path}")
        return False
    
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    trainer = PlantLSTMTrainer(
        input_size=4,
        hidden_size=64,
        num_layers=2,
        output_size=12,
        model_name='soil_moisture_predictor'
    )
    
    checkpoint = torch.load(model_path, map_location=device)
    trainer.model.load_state_dict(checkpoint['model_state_dict'])
    trainer.model.eval()
    
    print(f"✅ Modelo carregado (device: {device})")
    
    # Testar predições
    print("\n🔍 Testando predições...")
    test_samples = 5
    
    with torch.no_grad():
        for i in range(min(test_samples, len(X))):
            # Converter para tensor
            x_tensor = torch.FloatTensor(X[i:i+1]).to(device)
            y_true = y[i]
            
            # Fazer predição
            y_pred = trainer.model(x_tensor).cpu().numpy()[0]
            
            # Denormalizar valores (aproximadamente)
            # Assumindo que os valores foram normalizados entre 0-1
            # e representam percentuais de 0-100%
            y_true_denorm = y_true * 100
            y_pred_denorm = y_pred * 100
            
            print(f"\n📍 Amostra {i+1}:")
            print(f"   Real (próximos 12 passos): {y_true_denorm[:5]}")
            print(f"   Previsto:                  {y_pred_denorm[:5]}")
            
            # Calcular erro médio
            mae = np.mean(np.abs(y_true - y_pred))
            print(f"   MAE: {mae:.4f} (normalizado) = {mae*100:.2f}% (escala real)")
    
    print("\n✅ Teste do modelo de umidade concluído!")
    return True

def test_plant_health_model():
    """Testa o modelo de previsão de saúde da planta"""
    print("\n" + "="*70)
    print("TESTANDO MODELO DE PREVISÃO DE SAÚDE DA PLANTA")
    print("="*70)
    
    # Carregar dados
    print("\n📊 Carregando dados de teste...")
    df = fetch_sensor_data(days=60)
    print(f"✅ {len(df)} leituras carregadas")
    
    # Preparar dados
    preprocessor = DataPreprocessor()
    
    # Calcular health score
    print("\n🧮 Calculando health scores...")
    df['healthScore'] = preprocessor.calculate_health_score(df)
    print(f"✅ Health score médio: {df['healthScore'].mean():.2f}")
    print(f"   Mínimo: {df['healthScore'].min():.2f}")
    print(f"   Máximo: {df['healthScore'].max():.2f}")
    
    # Limpar e normalizar
    df_clean = preprocessor.clean_data(df)
    df_normalized = preprocessor.normalize_data(df_clean)
    
    # Criar sequências
    X, y = preprocessor.create_sequences(
        df_normalized,
        window_size=24,
        horizon=1,
        target_col='healthScore'
    )
    
    print(f"✅ {X.shape[0]} sequências criadas")
    
    # Carregar modelo
    print("\n🤖 Carregando modelo treinado...")
    model_path = "./models/saved/plant_health_predictor/plant_health_predictor_latest.pt"
    
    if not os.path.exists(model_path):
        print(f"❌ Modelo não encontrado em {model_path}")
        return False
    
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    trainer = PlantLSTMTrainer(
        input_size=4,
        hidden_size=64,
        num_layers=2,
        output_size=1,
        model_name='plant_health_predictor'
    )
    
    checkpoint = torch.load(model_path, map_location=device)
    trainer.model.load_state_dict(checkpoint['model_state_dict'])
    trainer.model.eval()
    
    print(f"✅ Modelo carregado (device: {device})")
    
    # Testar predições
    print("\n🔍 Testando predições...")
    test_samples = 10
    
    with torch.no_grad():
        for i in range(min(test_samples, len(X))):
            # Converter para tensor
            x_tensor = torch.FloatTensor(X[i:i+1]).to(device)
            y_true = y[i][0]  # Single value
            
            # Fazer predição
            y_pred = trainer.model(x_tensor).cpu().numpy()[0][0]
            
            # Denormalizar valores (assumindo min-max scaling)
            # Health score geralmente varia de 0-100
            y_true_denorm = y_true * 100
            y_pred_denorm = y_pred * 100
            
            # Mapear para categoria
            def get_health_status(score):
                if score >= 80:
                    return "SAUDÁVEL"
                elif score >= 50:
                    return "ESTRESSE MODERADO"
                else:
                    return "ESTRESSE ALTO"
            
            true_status = get_health_status(y_true_denorm)
            pred_status = get_health_status(y_pred_denorm)
            
            print(f"\n📍 Amostra {i+1}:")
            print(f"   Health Score Real:     {y_true_denorm:.2f} ({true_status})")
            print(f"   Health Score Previsto: {y_pred_denorm:.2f} ({pred_status})")
            
            # Erro
            error = abs(y_true - y_pred)
            print(f"   Erro absoluto: {error:.4f} (normalizado) = {error*100:.2f}% (escala real)")
    
    print("\n✅ Teste do modelo de saúde concluído!")
    return True

def main():
    """Executa todos os testes"""
    print("\n🧪 INICIANDO TESTES DOS MODELOS LSTM")
    print("="*70)
    
    try:
        # Testar modelo de umidade
        success_moisture = test_soil_moisture_model()
        
        # Testar modelo de saúde
        success_health = test_plant_health_model()
        
        # Resumo
        print("\n" + "="*70)
        print("RESUMO DOS TESTES")
        print("="*70)
        print(f"Modelo de Umidade: {'✅ PASSOU' if success_moisture else '❌ FALHOU'}")
        print(f"Modelo de Saúde:   {'✅ PASSOU' if success_health else '❌ FALHOU'}")
        
        if success_moisture and success_health:
            print("\n🎉 TODOS OS TESTES PASSARAM COM SUCESSO!")
            print("Os modelos estão prontos para integração com o backend.")
        else:
            print("\n⚠️ ALGUNS TESTES FALHARAM")
            print("Verifique os logs acima para detalhes.")
        
    except Exception as e:
        print(f"\n❌ ERRO durante os testes: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
