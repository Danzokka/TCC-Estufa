import os
import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np
import logging
import joblib
from datetime import datetime

from ..config.settings import MODEL_PATH, WINDOW_SIZE, PREDICTION_HORIZON

# Configuração de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Verificar se existe GPU disponível
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

class LSTMModel(nn.Module):
    """Modelo LSTM para previsão de séries temporais"""
    
    def __init__(self, input_size, hidden_size=64, num_layers=2, output_size=12, dropout=0.2):
        """
        Inicializa o modelo LSTM
        
        Args:
            input_size: Número de variáveis de entrada
            hidden_size: Tamanho da camada oculta
            num_layers: Número de camadas LSTM
            output_size: Tamanho da saída (horizonte de previsão)
            dropout: Taxa de dropout para regularização
        """
        super(LSTMModel, self).__init__()
        
        self.input_size = input_size
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        self.output_size = output_size
        
        # Camadas LSTM
        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0
        )
        
        # Camada de saída
        self.fc = nn.Linear(hidden_size, output_size)
        
        # Mover o modelo para GPU se disponível
        self.to(device)
        
        logger.info(f"Modelo LSTM criado com {input_size} entradas, {hidden_size} neurônios ocultos, "
                   f"{num_layers} camadas e {output_size} saídas")
        
    def forward(self, x):
        """
        Propagação para frente no modelo
        
        Args:
            x: Tensor de entrada (batch_size, seq_len, input_size)
            
        Returns:
            Tensor de saída (batch_size, output_size)
        """
        # Mover dados para GPU se disponível
        x = x.to(device)
        
        # Dimensões iniciais do tensor: (batch_size, seq_len, input_size)
        batch_size = x.size(0)
        
        # Saída da LSTM: output, (h_n, c_n)
        lstm_out, _ = self.lstm(x)
        
        # Usar apenas a última saída da sequência
        lstm_out = lstm_out[:, -1, :]
        
        # Passar pela camada totalmente conectada
        output = self.fc(lstm_out)
        
        return output

class PlantLSTMTrainer:
    """Classe para treinar, salvar e carregar modelos LSTM para cada tipo de planta"""
    
    def __init__(self, feature_columns):
        """
        Inicializa o treinador de modelos LSTM para plantas
        
        Args:
            feature_columns: Lista de colunas de características
        """
        self.feature_columns = feature_columns
        self.input_size = len(feature_columns)
        self.models = {}  # Dicionário para armazenar modelos por planta/sensor
        
        # Criar diretório para salvar modelos se não existir
        os.makedirs(MODEL_PATH, exist_ok=True)
        
    def train_model(self, X_train, y_train, model_name, epochs=100, batch_size=32, lr=0.001):
        """
        Treina um modelo LSTM
        
        Args:
            X_train: Array de sequências de entrada
            y_train: Array de valores alvo
            model_name: Nome para salvar o modelo
            epochs: Número de épocas de treinamento
            batch_size: Tamanho do lote para treinamento
            lr: Taxa de aprendizado
            
        Returns:
            O modelo treinado e histórico de perda
        """
        logger.info(f"Iniciando treinamento do modelo {model_name}")
        
        # Converter para tensores PyTorch
        X_train_tensor = torch.FloatTensor(X_train)
        y_train_tensor = torch.FloatTensor(y_train)
        
        # Criar conjunto de dados
        train_dataset = torch.utils.data.TensorDataset(X_train_tensor, y_train_tensor)
        train_loader = torch.utils.data.DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
        
        # Inicializar modelo
        model = LSTMModel(
            input_size=self.input_size,
            hidden_size=64,
            num_layers=2,
            output_size=y_train.shape[1]
        )
        
        # Definir função de perda e otimizador
        criterion = nn.MSELoss()
        optimizer = optim.Adam(model.parameters(), lr=lr)
        
        # Treinamento
        model.train()
        losses = []
        
        for epoch in range(epochs):
            epoch_loss = 0
            for X_batch, y_batch in train_loader:
                # Zerar gradientes
                optimizer.zero_grad()
                
                # Forward pass
                outputs = model(X_batch)
                
                # Calcular perda
                loss = criterion(outputs, y_batch)
                
                # Backward pass e otimização
                loss.backward()
                optimizer.step()
                
                epoch_loss += loss.item()
            
            avg_loss = epoch_loss / len(train_loader)
            losses.append(avg_loss)
            
            if (epoch+1) % 10 == 0:
                logger.info(f"Época {epoch+1}/{epochs}, Perda: {avg_loss:.4f}")
        
        # Salvar modelo
        self.models[model_name] = model
        self._save_model(model, model_name)
        
        logger.info(f"Treinamento do modelo {model_name} concluído")
        return model, losses
    
    def predict(self, X, model_name):
        """
        Faz previsão usando modelo treinado
        
        Args:
            X: Array de sequências de entrada
            model_name: Nome do modelo a usar
            
        Returns:
            Array com previsões
        """
        # Carregar o modelo se não estiver em memória
        if model_name not in self.models:
            self._load_model(model_name)
        
        if model_name not in self.models:
            logger.error(f"Modelo {model_name} não encontrado")
            return None
        
        model = self.models[model_name]
        model.eval()
        
        # Converter para tensor PyTorch
        X_tensor = torch.FloatTensor(X).to(device)
        
        # Fazer previsão
        with torch.no_grad():
            y_pred = model(X_tensor)
        
        return y_pred.cpu().numpy()
    
    def _save_model(self, model, model_name):
        """
        Salva o modelo treinado
        
        Args:
            model: Modelo PyTorch
            model_name: Nome para salvar o modelo
        """
        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            model_dir = os.path.join(MODEL_PATH, model_name)
            os.makedirs(model_dir, exist_ok=True)
            
            # Salvar estado do modelo
            model_path = os.path.join(model_dir, f"{model_name}_{timestamp}.pt")
            torch.save(model.state_dict(), model_path)
            
            # Salvar também versão mais recente sem timestamp
            latest_path = os.path.join(model_dir, f"{model_name}_latest.pt")
            torch.save(model.state_dict(), latest_path)
            
            logger.info(f"Modelo {model_name} salvo em {model_path}")
        except Exception as e:
            logger.error(f"Erro ao salvar modelo {model_name}: {e}")
    
    def _load_model(self, model_name):
        """
        Carrega um modelo salvo
        
        Args:
            model_name: Nome do modelo a carregar
        
        Returns:
            True se o modelo foi carregado com sucesso, False caso contrário
        """
        try:
            model_dir = os.path.join(MODEL_PATH, model_name)
            model_path = os.path.join(model_dir, f"{model_name}_latest.pt")
            
            if not os.path.exists(model_path):
                logger.error(f"Arquivo do modelo {model_path} não encontrado")
                return False
            
            # Criar modelo com arquitetura padrão
            model = LSTMModel(
                input_size=self.input_size,
                hidden_size=64,
                num_layers=2,
                output_size=PREDICTION_HORIZON
            )
            
            # Carregar pesos
            model.load_state_dict(torch.load(model_path))
            model.eval()
            
            # Armazenar na memória
            self.models[model_name] = model
            logger.info(f"Modelo {model_name} carregado com sucesso")
            return True
        
        except Exception as e:
            logger.error(f"Erro ao carregar modelo {model_name}: {e}")
            return False