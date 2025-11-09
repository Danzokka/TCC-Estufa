"""
Script para inspecionar conteúdo dos checkpoints
"""
import torch

print("\n📦 Inspecionando checkpoints...")

# Modelo de umidade
print("\n1. Soil Moisture Predictor")
print("-" * 70)
ckpt = torch.load("./models/saved/soil_moisture_predictor/soil_moisture_predictor_latest.pt", map_location='cpu')
print(f"Chaves disponíveis: {list(ckpt.keys())}")

for key, value in ckpt.items():
    if key != 'model_state_dict':
        print(f"{key}: {value}")

# Modelo de saúde
print("\n2. Plant Health Predictor")
print("-" * 70)
ckpt = torch.load("./models/saved/plant_health_predictor/plant_health_predictor_latest.pt", map_location='cpu')
print(f"Chaves disponíveis: {list(ckpt.keys())}")

for key, value in ckpt.items():
    if key != 'model_state_dict':
        print(f"{key}: {value}")
