import pandas as pd
import numpy as np
import logging
from datetime import datetime, timedelta
import json
import sys
import os

# Adicionar o diretório pai ao path para imports absolutos
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config.settings import THRESHOLDS

# Configuração de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class InsightsGenerator:
    """Classe para geração de insights e alertas baseados nos dados e previsões"""
    
    def __init__(self, custom_thresholds=None):
        """
        Inicializa o gerador de insights
        
        Args:
            custom_thresholds: Dicionário opcional com limites personalizados
        """
        self.thresholds = THRESHOLDS.copy()
        
        if custom_thresholds:
            # Atualizar thresholds padrão com valores personalizados
            for plant_type, values in custom_thresholds.items():
                if plant_type in self.thresholds:
                    self.thresholds[plant_type].update(values)
                else:
                    self.thresholds[plant_type] = values
                    
        logger.info("Gerador de insights inicializado")
    
    def get_plant_thresholds(self, plant_name):
        """
        Obtém os limites para uma planta específica
        
        Args:
            plant_name: Nome da planta
            
        Returns:
            Dicionário com limites para cada variável
        """
        if plant_name in self.thresholds:
            return self.thresholds[plant_name]
        return self.thresholds["default"]
    
    def analyze_current_conditions(self, sensor_data, plant_metadata=None):
        """
        Analisa as condições atuais e gera insights
        
        Args:
            sensor_data: DataFrame com dados de sensores
            plant_metadata: DataFrame com metadados das plantas
            
        Returns:
            DataFrame com alertas e recomendações
        """
        logger.info("Analisando condições atuais...")
        
        if len(sensor_data) == 0:
            logger.warning("Nenhum dado de sensor para análise")
            return pd.DataFrame()
            
        # Pegar apenas os dados mais recentes para cada planta
        latest_data = (
            sensor_data.sort_values('timestamp')
            .groupby('greenhouse_id')
            .last()
            .reset_index()
        )
        
        alerts = []
        
        for _, row in latest_data.iterrows():
            plant_name = row.get('plant_name', 'default')
            plant_nickname = row.get('plant_nickname', 'Planta')
            thresholds = self.get_plant_thresholds(plant_name)
            
            user_plant_id = row['greenhouse_id']
            timestamp = row['timestamp']
            
            # Verificar cada variável monitorada
            for var, limits in thresholds.items():
                if var in row:
                    value = row[var]
                    min_val = limits["min"]
                    max_val = limits["max"]
                    
                    # Verificar limites
                    if value < min_val:
                        severity = "high" if value < min_val * 0.8 else "medium"
                        alerts.append({
                            "greenhouse_id": user_plant_id,
                            "plant_name": plant_name,
                            "plant_nickname": plant_nickname,
                            "timestamp": timestamp,
                            "variable": var,
                            "value": value,
                            "threshold": min_val,
                            "type": "below_min",
                            "severity": severity,
                            "message": f"{self._format_variable_name(var)} muito baixo(a). Atual: {value:.1f}, Mínimo recomendado: {min_val}",
                            "recommendation": self._get_recommendation(var, "low")
                        })
                    elif value > max_val:
                        severity = "high" if value > max_val * 1.2 else "medium"
                        alerts.append({
                            "greenhouse_id": user_plant_id,
                            "plant_name": plant_name,
                            "plant_nickname": plant_nickname,
                            "timestamp": timestamp,
                            "variable": var,
                            "value": value,
                            "threshold": max_val,
                            "type": "above_max",
                            "severity": severity,
                            "message": f"{self._format_variable_name(var)} muito alto(a). Atual: {value:.1f}, Máximo recomendado: {max_val}",
                            "recommendation": self._get_recommendation(var, "high")
                        })
        
        if len(alerts) == 0:
            logger.info("Nenhum alerta gerado, condições normais")
        else:
            logger.info(f"Gerados {len(alerts)} alertas")
            
        return pd.DataFrame(alerts)
    
    def analyze_predictions(self, predictions_df, plant_metadata=None):
        """
        Analisa previsões para detectar futuros problemas
        
        Args:
            predictions_df: DataFrame com previsões
            plant_metadata: DataFrame com metadados das plantas
            
        Returns:
            DataFrame com alertas preventivos
        """
        logger.info("Analisando previsões para alertas preventivos...")
        
        if len(predictions_df) == 0:
            logger.warning("Nenhuma previsão para análise")
            return pd.DataFrame()
        
        preventive_alerts = []
        
        for user_plant_id in predictions_df['greenhouse_id'].unique():
            plant_data = predictions_df[predictions_df['greenhouse_id'] == user_plant_id]
            plant_name = plant_data['plant_name'].iloc[0] if 'plant_name' in plant_data.columns else 'default'
            plant_nickname = plant_data['plant_nickname'].iloc[0] if 'plant_nickname' in plant_data.columns else 'Planta'
            thresholds = self.get_plant_thresholds(plant_name)
            
            # Para cada variável prevista
            for var in [col for col in plant_data.columns if col in thresholds]:
                # Pegar valores previstos ordenados por tempo
                time_series = plant_data.sort_values('timestamp')
                values = time_series[var].values
                timestamps = time_series['timestamp'].values
                
                min_val = thresholds[var]["min"]
                max_val = thresholds[var]["max"]
                
                # Verificar tendências que ultrapassarão limites
                for i, (value, timestamp) in enumerate(zip(values, timestamps)):
                    hours_ahead = i + 1  # Presumindo que as previsões são horarias
                    
                    if value < min_val:
                        preventive_alerts.append({
                            "greenhouse_id": user_plant_id,
                            "plant_name": plant_name,
                            "plant_nickname": plant_nickname,
                            "timestamp": timestamp,
                            "variable": var,
                            "predicted_value": value,
                            "threshold": min_val,
                            "hours_ahead": hours_ahead,
                            "type": "predicted_below_min",
                            "severity": "medium" if hours_ahead <= 6 else "low",
                            "message": f"{self._format_variable_name(var)} previsto(a) abaixo do mínimo em {hours_ahead} horas. Previsto: {value:.1f}, Mínimo: {min_val}",
                            "recommendation": self._get_recommendation(var, "low", preventive=True)
                        })
                    elif value > max_val:
                        preventive_alerts.append({
                            "greenhouse_id": user_plant_id,
                            "plant_name": plant_name,
                            "plant_nickname": plant_nickname,
                            "timestamp": timestamp,
                            "variable": var,
                            "predicted_value": value,
                            "threshold": max_val,
                            "hours_ahead": hours_ahead,
                            "type": "predicted_above_max",
                            "severity": "medium" if hours_ahead <= 6 else "low",
                            "message": f"{self._format_variable_name(var)} previsto(a) acima do máximo em {hours_ahead} horas. Previsto: {value:.1f}, Máximo: {max_val}",
                            "recommendation": self._get_recommendation(var, "high", preventive=True)
                        })
        
        if len(preventive_alerts) == 0:
            logger.info("Nenhum alerta preventivo gerado")
        else:
            logger.info(f"Gerados {len(preventive_alerts)} alertas preventivos")
            
        return pd.DataFrame(preventive_alerts)
    
    def generate_growth_insights(self, historical_data, plant_metadata):
        """
        Gera insights sobre o crescimento e desenvolvimento das plantas
        
        Args:
            historical_data: DataFrame com dados históricos
            plant_metadata: DataFrame com metadados das plantas
            
        Returns:
            DataFrame com insights de crescimento
        """
        logger.info("Gerando insights de crescimento...")
        
        insights = []
        
        # Agrupar por planta do usuário
        for user_plant_id in historical_data['greenhouse_id'].unique():
            plant_data = historical_data[historical_data['greenhouse_id'] == user_plant_id].copy()
            
            if len(plant_data) < 24:  # Precisa de pelo menos 24 horas de dados
                continue
                
            plant_data['timestamp'] = pd.to_datetime(plant_data['timestamp'])
            plant_data = plant_data.sort_values('timestamp')
            
            # Calcular duração do monitoramento
            start_date = plant_data['timestamp'].min()
            end_date = plant_data['timestamp'].max()
            days_monitored = (end_date - start_date).days
            
            if days_monitored < 1:
                continue
                
            plant_name = plant_data['plant_name'].iloc[0] if 'plant_name' in plant_data.columns else 'default'
            plant_nickname = plant_data['plant_nickname'].iloc[0] if 'plant_nickname' in plant_data.columns else 'Planta'
            
            # Calcular médias semanais
            plant_data['week'] = (plant_data['timestamp'] - start_date).dt.days // 7
            weekly_stats = plant_data.groupby('week').agg({
                'airTemperature': 'mean',
                'airHumidity': 'mean',
                'soilMoisture': 'mean',
                'soilTemperature': 'mean'
            }).reset_index()
            
            if len(weekly_stats) > 1:
                # Identificar tendências
                trends = {}
                for var in weekly_stats.columns:
                    if var != 'week':
                        first_val = weekly_stats[var].iloc[0]
                        last_val = weekly_stats[var].iloc[-1]
                        change = ((last_val - first_val) / first_val) * 100 if first_val != 0 else 0
                        
                        if abs(change) > 10:  # Mudança significativa (>10%)
                            trends[var] = {
                                'initial': first_val,
                                'current': last_val,
                                'change': change,
                                'trend': 'increasing' if change > 0 else 'decreasing'
                            }
                
                # Gerar insights baseados nas tendências
                for var, trend_data in trends.items():
                    insights.append({
                        "greenhouse_id": user_plant_id,
                        "plant_name": plant_name,
                        "plant_nickname": plant_nickname,
                        "days_monitored": days_monitored,
                        "variable": var,
                        "initial_value": trend_data['initial'],
                        "current_value": trend_data['current'],
                        "change_percent": trend_data['change'],
                        "trend": trend_data['trend'],
                        "message": self._generate_trend_message(var, trend_data)
                    })
            
        if len(insights) == 0:
            logger.info("Nenhum insight de crescimento gerado")
        else:
            logger.info(f"Gerados {len(insights)} insights de crescimento")
            
        return pd.DataFrame(insights)
    
    def _format_variable_name(self, var_name):
        """Formata o nome da variável para exibição"""
        name_map = {
            'airTemperature': 'Temperatura do ar',
            'airHumidity': 'Umidade do ar',
            'soilMoisture': 'Umidade do solo',
            'soilTemperature': 'Temperatura do solo',
            'water_level': 'Nível da água',
            'water_reserve': 'Reserva de água'
        }
        return name_map.get(var_name, var_name)
    
    def _get_recommendation(self, variable, condition, preventive=False):
        """
        Retorna uma recomendação baseada na variável e condição
        
        Args:
            variable: Nome da variável do sensor
            condition: 'high' ou 'low'
            preventive: Se o alerta é preventivo
        
        Returns:
            String com recomendação
        """
        action = "Prepare-se para " if preventive else ""
        
        if variable == 'airTemperature':
            if condition == 'high':
                return f"{action}Aumentar a ventilação ou usar sombreamento para reduzir a temperatura."
            else:
                return f"{action}Reduzir a ventilação ou adicionar aquecimento para aumentar a temperatura."
                
        elif variable == 'airHumidity':
            if condition == 'high':
                return f"{action}Aumentar a ventilação para reduzir a umidade do ar."
            else:
                return f"{action}Usar um umidificador ou borrifar água nas folhas para aumentar a umidade."
                
        elif variable == 'soilMoisture':
            if condition == 'high':
                return f"{action}Reduzir a irrigação e verificar a drenagem do solo."
            else:
                return f"{action}Aumentar a frequência de irrigação."
                
        elif variable == 'soilTemperature':
            if condition == 'high':
                return f"{action}Aumentar a sombra para reduzir a temperatura do solo."
            else:
                return f"{action}Considerar uma cobertura para o solo para aumentar a temperatura."
                
        elif variable == 'water_level':
            if condition == 'high':
                return f"{action}Verificar o sistema de drenagem."
            else:
                return f"{action}Reabastecer o reservatório de água."
                
        elif variable == 'water_reserve':
            if condition == 'high':
                return f"{action}Verificar se há vazamento no sistema."
            else:
                return f"{action}Reabastecer o reservatório de água."
                
        return "Verificar condições da planta."
    
    def _generate_trend_message(self, variable, trend_data):
        """
        Gera uma mensagem descritiva para uma tendência
        
        Args:
            variable: Nome da variável
            trend_data: Dados da tendência
        
        Returns:
            String com mensagem descritiva
        """
        var_name = self._format_variable_name(variable)
        change = abs(trend_data['change'])
        direction = "aumentou" if trend_data['trend'] == 'increasing' else "diminuiu"
        
        if change > 30:
            magnitude = "significativamente"
        elif change > 15:
            magnitude = "moderadamente"
        else:
            magnitude = "ligeiramente"
        
        return f"{var_name} {direction} {magnitude} ({change:.1f}%) desde o início do monitoramento. Valor inicial: {trend_data['initial']:.1f}, Valor atual: {trend_data['current']:.1f}"