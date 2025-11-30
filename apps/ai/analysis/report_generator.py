"""
Gerador de insights e relatórios para análise de plantas
Este módulo processa dados de sensores, clima e irrigação para gerar insights inteligentes
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import logging
from scipy import stats
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ReportGenerator:
    """Gerador de relatórios e insights para análise de plantas"""
    
    def __init__(self):
        self.scaler = StandardScaler()
        self.anomaly_detector = IsolationForest(contamination=0.1, random_state=42)
    
    def generate_insights(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Gera insights completos baseados nos dados fornecidos
        
        Args:
            data: Dicionário com dados da planta, sensores, clima e irrigação
            
        Returns:
            Dicionário com insights, recomendações e anomalias
        """
        try:
            logger.info(f"Gerando insights para planta {data.get('user_plant_id', 'unknown')}")
            
            # Processar dados
            sensor_df = self._process_sensor_data(data.get('sensor_data', []))
            weather_df = self._process_weather_data(data.get('weather_data', []))
            irrigation_data = data.get('irrigation_data', [])
            ideal_values = data.get('plant_ideal_values', {})
            metrics = data.get('metrics', {})
            
            # Gerar análises
            summary = self._generate_summary(metrics, sensor_df, weather_df, irrigation_data)
            insights = self._generate_detailed_insights(sensor_df, weather_df, ideal_values)
            recommendations = self._generate_recommendations(sensor_df, weather_df, ideal_values, metrics)
            anomalies = self._detect_anomalies(sensor_df, weather_df)
            
            return {
                'summary': summary,
                'insights': insights,
                'recommendations': recommendations,
                'anomalies': anomalies
            }
            
        except Exception as e:
            logger.error(f"Erro ao gerar insights: {str(e)}")
            return self._get_fallback_insights(data)
    
    def _process_sensor_data(self, sensor_data: List[Dict]) -> pd.DataFrame:
        """Processa dados dos sensores em DataFrame"""
        if not sensor_data:
            return pd.DataFrame()
        
        df = pd.DataFrame(sensor_data)
        
        # Converter timestamp se necessário
        if 'timecreated' in df.columns:
            df['timecreated'] = pd.to_datetime(df['timecreated'])
            df = df.sort_values('timecreated')
        
        return df
    
    def _process_weather_data(self, weather_data: List[Dict]) -> pd.DataFrame:
        """Processa dados climáticos em DataFrame"""
        if not weather_data:
            return pd.DataFrame()
        
        df = pd.DataFrame(weather_data)
        
        # Converter data se necessário
        if 'date' in df.columns:
            df['date'] = pd.to_datetime(df['date'])
            df = df.sort_values('date')
        
        return df
    
    def _generate_summary(self, metrics: Dict, sensor_df: pd.DataFrame, 
                         weather_df: pd.DataFrame, irrigation_data: List) -> str:
        """Gera resumo geral do período"""
        period_type = metrics.get('period_type', 'período')
        total_readings = len(sensor_df)
        total_irrigations = len(irrigation_data)
        
        # Análise de estabilidade
        stability_score = self._calculate_stability_score(sensor_df)
        
        # Análise de crescimento
        growth_analysis = self._analyze_growth_trend(sensor_df)
        
        summary = f"Relatório {period_type} com {total_readings} medições e {total_irrigations} irrigações. "
        
        if stability_score > 0.8:
            summary += "Condições ambientais estáveis. "
        elif stability_score > 0.6:
            summary += "Condições ambientais moderadamente estáveis. "
        else:
            summary += "Condições ambientais instáveis - atenção necessária. "
        
        if growth_analysis['trend'] == 'positive':
            summary += "Tendência de crescimento positiva observada."
        elif growth_analysis['trend'] == 'negative':
            summary += "Tendência de crescimento negativa - investigação recomendada."
        else:
            summary += "Crescimento estável no período."
        
        return summary
    
    def _generate_detailed_insights(self, sensor_df: pd.DataFrame, 
                                   weather_df: pd.DataFrame, ideal_values: Dict) -> Dict[str, str]:
        """Gera insights detalhados por categoria"""
        insights = {}
        
        # Análise de temperatura
        if not sensor_df.empty and 'air_temperature' in sensor_df.columns:
            temp_analysis = self._analyze_temperature(sensor_df, ideal_values)
            insights['temperature'] = temp_analysis
        
        # Análise de umidade
        if not sensor_df.empty and 'air_humidity' in sensor_df.columns:
            humidity_analysis = self._analyze_humidity(sensor_df, ideal_values)
            insights['humidity'] = humidity_analysis
        
        # Análise de umidade do solo
        if not sensor_df.empty and 'soil_moisture' in sensor_df.columns:
            soil_analysis = self._analyze_soil_moisture(sensor_df, ideal_values)
            insights['soil_moisture'] = soil_analysis
        
        # Análise de irrigação
        irrigation_analysis = self._analyze_irrigation_pattern(sensor_df)
        insights['irrigation'] = irrigation_analysis
        
        # Análise de impacto climático
        weather_analysis = self._analyze_weather_impact(sensor_df, weather_df)
        insights['weather_impact'] = weather_analysis
        
        return insights
    
    def _analyze_temperature(self, df: pd.DataFrame, ideal_values: Dict) -> str:
        """Analisa padrões de temperatura"""
        temp_col = 'air_temperature'
        if temp_col not in df.columns:
            return "Dados de temperatura não disponíveis."
        
        temps = df[temp_col].dropna()
        if temps.empty:
            return "Dados de temperatura insuficientes."
        
        avg_temp = temps.mean()
        temp_std = temps.std()
        ideal_temp = (ideal_values.get('air_temperature_initial', 0) + 
                     ideal_values.get('air_temperature_final', 0)) / 2
        
        deviation = avg_temp - ideal_temp
        
        analysis = f"Temperatura média: {avg_temp:.1f}°C"
        
        if abs(deviation) < 2:
            analysis += ". Dentro da faixa ideal."
        elif deviation > 0:
            analysis += f". {deviation:.1f}°C acima do ideal."
        else:
            analysis += f". {abs(deviation):.1f}°C abaixo do ideal."
        
        if temp_std > 3:
            analysis += " Alta variabilidade observada."
        elif temp_std < 1:
            analysis += " Temperatura muito estável."
        
        return analysis
    
    def _analyze_humidity(self, df: pd.DataFrame, ideal_values: Dict) -> str:
        """Analisa padrões de umidade"""
        humidity_col = 'air_humidity'
        if humidity_col not in df.columns:
            return "Dados de umidade não disponíveis."
        
        humidities = df[humidity_col].dropna()
        if humidities.empty:
            return "Dados de umidade insuficientes."
        
        avg_humidity = humidities.mean()
        humidity_std = humidities.std()
        ideal_humidity = (ideal_values.get('air_humidity_initial', 0) + 
                          ideal_values.get('air_humidity_final', 0)) / 2
        
        deviation = avg_humidity - ideal_humidity
        
        analysis = f"Umidade média: {avg_humidity:.1f}%"
        
        if abs(deviation) < 5:
            analysis += ". Dentro da faixa ideal."
        elif deviation > 0:
            analysis += f". {deviation:.1f}% acima do ideal."
        else:
            analysis += f". {abs(deviation):.1f}% abaixo do ideal."
        
        if humidity_std > 10:
            analysis += " Alta variabilidade observada."
        elif humidity_std < 3:
            analysis += " Umidade muito estável."
        
        return analysis
    
    def _analyze_soil_moisture(self, df: pd.DataFrame, ideal_values: Dict) -> str:
        """Analisa padrões de umidade do solo"""
        soil_col = 'soil_moisture'
        if soil_col not in df.columns:
            return "Dados de umidade do solo não disponíveis."
        
        soil_moistures = df[soil_col].dropna()
        if soil_moistures.empty:
            return "Dados de umidade do solo insuficientes."
        
        avg_soil = soil_moistures.mean()
        soil_std = soil_moistures.std()
        ideal_soil = (ideal_values.get('soil_moisture_initial', 0) + 
                     ideal_values.get('soil_moisture_final', 0)) / 2
        
        deviation = avg_soil - ideal_soil
        
        analysis = f"Umidade do solo média: {avg_soil:.1f}%"
        
        if abs(deviation) < 10:
            analysis += ". Dentro da faixa ideal."
        elif deviation > 0:
            analysis += f". {deviation:.1f}% acima do ideal."
        else:
            analysis += f". {abs(deviation):.1f}% abaixo do ideal."
        
        if soil_std > 15:
            analysis += " Alta variabilidade observada."
        elif soil_std < 5:
            analysis += " Umidade do solo muito estável."
        
        return analysis
    
    def _analyze_irrigation_pattern(self, df: pd.DataFrame) -> str:
        """Analisa padrões de irrigação"""
        if df.empty:
            return "Dados de sensores insuficientes para análise de irrigação."
        
        # Analisar variações na umidade do solo como indicador de irrigação
        if 'soil_moisture' in df.columns:
            soil_moistures = df['soil_moisture'].dropna()
            if len(soil_moistures) > 1:
                # Detectar aumentos súbitos na umidade do solo
                soil_diff = soil_moistures.diff()
                irrigation_events = (soil_diff > 15).sum()  # Aumento de 15% ou mais
                
                if irrigation_events > 0:
                    return f"Detectados {irrigation_events} eventos de irrigação baseados na variação da umidade do solo."
                else:
                    return "Nenhum evento de irrigação detectado baseado na variação da umidade do solo."
        
        return "Análise de irrigação não disponível."
    
    def _analyze_weather_impact(self, sensor_df: pd.DataFrame, weather_df: pd.DataFrame) -> str:
        """Analisa impacto das condições climáticas"""
        if weather_df.empty:
            return "Dados climáticos não disponíveis para análise."
        
        if sensor_df.empty:
            return "Dados de sensores insuficientes para correlação climática."
        
        # Correlação entre temperatura externa e interna
        if 'avgTemp' in weather_df.columns and 'air_temperature' in sensor_df.columns:
            # Alinhar dados por data
            sensor_df['date'] = pd.to_datetime(sensor_df['timecreated']).dt.date
            weather_df['date'] = pd.to_datetime(weather_df['date']).dt.date
            
            # Calcular correlação
            merged = pd.merge(sensor_df, weather_df, on='date', how='inner')
            if len(merged) > 1:
                correlation = merged['air_temperature'].corr(merged['avgTemp'])
                
                if correlation > 0.7:
                    return f"Forte correlação entre temperatura externa e interna (r={correlation:.2f}). Clima externo influencia significativamente o ambiente interno."
                elif correlation > 0.4:
                    return f"Correlação moderada entre temperatura externa e interna (r={correlation:.2f}). Clima externo tem influência moderada."
                else:
                    return f"Baixa correlação entre temperatura externa e interna (r={correlation:.2f}). Ambiente interno bem controlado."
        
        return "Análise de correlação climática não disponível."
    
    def _generate_recommendations(self, sensor_df: pd.DataFrame, weather_df: pd.DataFrame,
                                 ideal_values: Dict, metrics: Dict) -> List[Dict[str, Any]]:
        """Gera recomendações baseadas na análise"""
        recommendations = []
        
        # Recomendações de temperatura
        if 'air_temperature' in sensor_df.columns:
            temp_rec = self._get_temperature_recommendations(sensor_df, ideal_values)
            if temp_rec:
                recommendations.append(temp_rec)
        
        # Recomendações de umidade
        if 'air_humidity' in sensor_df.columns:
            humidity_rec = self._get_humidity_recommendations(sensor_df, ideal_values)
            if humidity_rec:
                recommendations.append(humidity_rec)
        
        # Recomendações de irrigação
        irrigation_rec = self._get_irrigation_recommendations(sensor_df, metrics)
        if irrigation_rec:
            recommendations.append(irrigation_rec)
        
        return recommendations
    
    def _get_temperature_recommendations(self, df: pd.DataFrame, ideal_values: Dict) -> Optional[Dict]:
        """Gera recomendações de temperatura"""
        temps = df['air_temperature'].dropna()
        if temps.empty:
            return None
        
        avg_temp = temps.mean()
        ideal_temp = (ideal_values.get('air_temperature_initial', 0) + 
                     ideal_values.get('air_temperature_final', 0)) / 2
        deviation = avg_temp - ideal_temp
        
        if abs(deviation) > 3:
            priority = 'high' if abs(deviation) > 5 else 'medium'
            action = 'reduzir' if deviation > 0 else 'aumentar'
            return {
                'category': 'temperature',
                'priority': priority,
                'description': f'Ajustar temperatura para {action} em {abs(deviation):.1f}°C'
            }
        
        return None
    
    def _get_humidity_recommendations(self, df: pd.DataFrame, ideal_values: Dict) -> Optional[Dict]:
        """Gera recomendações de umidade"""
        humidities = df['air_humidity'].dropna()
        if humidities.empty:
            return None
        
        avg_humidity = humidities.mean()
        ideal_humidity = (ideal_values.get('air_humidity_initial', 0) + 
                         ideal_values.get('air_humidity_final', 0)) / 2
        deviation = avg_humidity - ideal_humidity
        
        if abs(deviation) > 8:
            priority = 'high' if abs(deviation) > 15 else 'medium'
            action = 'reduzir' if deviation > 0 else 'aumentar'
            return {
                'category': 'humidity',
                'priority': priority,
                'description': f'Ajustar umidade para {action} em {abs(deviation):.1f}%'
            }
        
        return None
    
    def _get_irrigation_recommendations(self, df: pd.DataFrame, metrics: Dict) -> Optional[Dict]:
        """Gera recomendações de irrigação"""
        total_irrigations = metrics.get('total_irrigations', 0)
        
        if total_irrigations == 0:
            return {
                'category': 'irrigation',
                'priority': 'medium',
                'description': 'Considerar irrigação manual ou verificar sistema automático'
            }
        
        return None
    
    def _detect_anomalies(self, sensor_df: pd.DataFrame, weather_df: pd.DataFrame) -> List[Dict]:
        """Detecta anomalias nos dados"""
        anomalies = []
        
        if sensor_df.empty:
            return anomalies
        
        # Detectar anomalias de temperatura
        if 'air_temperature' in sensor_df.columns:
            temp_anomalies = self._detect_temperature_anomalies(sensor_df)
            anomalies.extend(temp_anomalies)
        
        # Detectar anomalias de umidade
        if 'air_humidity' in sensor_df.columns:
            humidity_anomalies = self._detect_humidity_anomalies(sensor_df)
            anomalies.extend(humidity_anomalies)
        
        return anomalies
    
    def _detect_temperature_anomalies(self, df: pd.DataFrame) -> List[Dict]:
        """Detecta anomalias de temperatura"""
        anomalies = []
        temps = df['air_temperature'].dropna()
        
        if len(temps) < 10:  # Muito poucos dados para detectar anomalias
            return anomalies
        
        # Usar Z-score para detectar outliers
        z_scores = np.abs(stats.zscore(temps))
        outliers = temps[z_scores > 2.5]
        
        for idx, temp in outliers.items():
            anomalies.append({
                'type': 'temperature_outlier',
                'description': f'Temperatura anômala detectada: {temp:.1f}°C',
                'severity': 'high' if z_scores[idx] > 3 else 'medium'
            })
        
        return anomalies
    
    def _detect_humidity_anomalies(self, df: pd.DataFrame) -> List[Dict]:
        """Detecta anomalias de umidade"""
        anomalies = []
        humidities = df['air_humidity'].dropna()
        
        if len(humidities) < 10:
            return anomalies
        
        # Usar Z-score para detectar outliers
        z_scores = np.abs(stats.zscore(humidities))
        outliers = humidities[z_scores > 2.5]
        
        for idx, humidity in outliers.items():
            anomalies.append({
                'type': 'humidity_outlier',
                'description': f'Umidade anômala detectada: {humidity:.1f}%',
                'severity': 'high' if z_scores[idx] > 3 else 'medium'
            })
        
        return anomalies
    
    def _calculate_stability_score(self, df: pd.DataFrame) -> float:
        """Calcula score de estabilidade (0-1)"""
        if df.empty:
            return 0.0
        
        scores = []
        
        # Estabilidade de temperatura
        if 'air_temperature' in df.columns:
            temp_std = df['air_temperature'].std()
            temp_score = max(0, 1 - temp_std / 10)  # Normalizar por 10°C
            scores.append(temp_score)
        
        # Estabilidade de umidade
        if 'air_humidity' in df.columns:
            humidity_std = df['air_humidity'].std()
            humidity_score = max(0, 1 - humidity_std / 20)  # Normalizar por 20%
            scores.append(humidity_score)
        
        return np.mean(scores) if scores else 0.0
    
    def _analyze_growth_trend(self, df: pd.DataFrame) -> Dict[str, str]:
        """Analisa tendência de crescimento"""
        if df.empty:
            return {'trend': 'unknown', 'description': 'Dados insuficientes'}
        
        # Análise simples baseada na estabilidade dos parâmetros
        stability_score = self._calculate_stability_score(df)
        
        if stability_score > 0.8:
            return {'trend': 'positive', 'description': 'Condições estáveis favorecem o crescimento'}
        elif stability_score > 0.6:
            return {'trend': 'stable', 'description': 'Condições moderadamente estáveis'}
        else:
            return {'trend': 'negative', 'description': 'Condições instáveis podem prejudicar o crescimento'}
    
    def _get_fallback_insights(self, data: Dict) -> Dict[str, Any]:
        """Retorna insights básicos em caso de erro"""
        return {
            'summary': 'Análise básica realizada. Dados processados com sucesso.',
            'insights': {
                'temperature': 'Análise de temperatura não disponível.',
                'humidity': 'Análise de umidade não disponível.',
                'soil_moisture': 'Análise de umidade do solo não disponível.',
                'light': 'Análise de luminosidade não disponível.',
                'irrigation': 'Análise de irrigação não disponível.',
                'weather_impact': 'Análise de impacto climático não disponível.'
            },
            'recommendations': [],
            'anomalies': []
        }
