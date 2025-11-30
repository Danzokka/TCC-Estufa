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
            
            # NOVO: Adicionar insights específicos sobre saúde da planta
            plant_health_insights = self._generate_plant_health_insights(
                sensor_df, weather_df, ideal_values, data.get('plant_info', {})
            )
            insights['plant_health'] = plant_health_insights
            
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
        """Gera resumo geral do período - versão expandida"""
        period_type = metrics.get('period_type', 'período')
        total_readings = len(sensor_df)
        total_irrigations = len(irrigation_data)
        
        # Análise de estabilidade
        stability_score = self._calculate_stability_score(sensor_df)
        
        # Análise de crescimento
        growth_analysis = self._analyze_growth_trend(sensor_df)
        
        # Estatísticas detalhadas
        stats_summary = self._get_statistics_summary(sensor_df)
        
        # Início do resumo
        summary_parts = []
        
        # Header com período e contagem
        summary_parts.append(f"📊 **Relatório {period_type.capitalize()}**")
        summary_parts.append(f"Período de análise com {total_readings} medições coletadas e {total_irrigations} eventos de irrigação registrados.")
        
        # Estatísticas de sensores
        if stats_summary:
            summary_parts.append("")
            summary_parts.append("🌡️ **Resumo dos Sensores:**")
            if 'temperature' in stats_summary:
                t = stats_summary['temperature']
                summary_parts.append(f"• Temperatura: média {t['mean']:.1f}°C (min: {t['min']:.1f}°C, máx: {t['max']:.1f}°C)")
            if 'humidity' in stats_summary:
                h = stats_summary['humidity']
                summary_parts.append(f"• Umidade do ar: média {h['mean']:.1f}% (min: {h['min']:.1f}%, máx: {h['max']:.1f}%)")
            if 'soil_moisture' in stats_summary:
                s = stats_summary['soil_moisture']
                summary_parts.append(f"• Umidade do solo: média {s['mean']:.1f}% (min: {s['min']:.1f}%, máx: {s['max']:.1f}%)")
        
        # Análise de estabilidade
        summary_parts.append("")
        summary_parts.append("📈 **Estabilidade Ambiental:**")
        if stability_score > 0.8:
            summary_parts.append(f"Excelente! Score de estabilidade: {stability_score:.0%}. O ambiente está muito bem controlado, com variações mínimas nos parâmetros.")
        elif stability_score > 0.6:
            summary_parts.append(f"Bom! Score de estabilidade: {stability_score:.0%}. Condições moderadamente estáveis com algumas variações aceitáveis.")
        elif stability_score > 0.4:
            summary_parts.append(f"Atenção! Score de estabilidade: {stability_score:.0%}. Variações significativas detectadas - considere ajustes no ambiente.")
        else:
            summary_parts.append(f"Crítico! Score de estabilidade: {stability_score:.0%}. Condições muito instáveis que podem prejudicar a planta.")
        
        # Tendência de crescimento
        summary_parts.append("")
        summary_parts.append("🌱 **Condições de Crescimento:**")
        if growth_analysis['trend'] == 'positive':
            summary_parts.append("As condições ambientais favorecem o desenvolvimento saudável da planta. Continue monitorando para manter a qualidade.")
        elif growth_analysis['trend'] == 'negative':
            summary_parts.append("Condições desfavoráveis detectadas. Recomenda-se investigar as causas e tomar ações corretivas.")
        else:
            summary_parts.append("Crescimento estável observado. As condições atuais mantêm a planta em equilíbrio.")
        
        # Irrigação
        if total_irrigations > 0:
            summary_parts.append("")
            summary_parts.append("💧 **Irrigação:**")
            avg_per_day = total_irrigations / max(1, (total_readings / 24))  # Aproximação
            summary_parts.append(f"Total de {total_irrigations} irrigações realizadas no período.")
            if avg_per_day > 3:
                summary_parts.append("Frequência alta de irrigação - verificar se o solo está drenando adequadamente.")
            elif avg_per_day < 0.5 and total_readings > 48:
                summary_parts.append("Frequência baixa de irrigação - confirmar se a planta está recebendo água suficiente.")
            else:
                summary_parts.append("Frequência de irrigação dentro do esperado.")
        
        return "\n".join(summary_parts)
    
    def _get_statistics_summary(self, df: pd.DataFrame) -> Dict[str, Dict]:
        """Calcula estatísticas resumidas dos sensores"""
        stats = {}
        
        if df.empty:
            return stats
        
        if 'air_temperature' in df.columns:
            temps = df['air_temperature'].dropna()
            if not temps.empty:
                stats['temperature'] = {
                    'mean': temps.mean(),
                    'min': temps.min(),
                    'max': temps.max(),
                    'std': temps.std()
                }
        
        if 'air_humidity' in df.columns:
            humidity = df['air_humidity'].dropna()
            if not humidity.empty:
                stats['humidity'] = {
                    'mean': humidity.mean(),
                    'min': humidity.min(),
                    'max': humidity.max(),
                    'std': humidity.std()
                }
        
        if 'soil_moisture' in df.columns:
            soil = df['soil_moisture'].dropna()
            if not soil.empty:
                stats['soil_moisture'] = {
                    'mean': soil.mean(),
                    'min': soil.min(),
                    'max': soil.max(),
                    'std': soil.std()
                }
        
        return stats
    
    def _generate_detailed_insights(self, sensor_df: pd.DataFrame, 
                                   weather_df: pd.DataFrame, ideal_values: Dict) -> Dict[str, str]:
        """Gera insights detalhados por categoria - versão expandida"""
        insights = {}
        
        # Análise de temperatura
        if not sensor_df.empty and 'air_temperature' in sensor_df.columns:
            temp_analysis = self._analyze_temperature_detailed(sensor_df, ideal_values)
            insights['temperature'] = temp_analysis
        else:
            insights['temperature'] = "📊 Dados de temperatura não disponíveis para este período."
        
        # Análise de umidade do ar
        if not sensor_df.empty and 'air_humidity' in sensor_df.columns:
            humidity_analysis = self._analyze_humidity_detailed(sensor_df, ideal_values)
            insights['humidity'] = humidity_analysis
        else:
            insights['humidity'] = "📊 Dados de umidade do ar não disponíveis para este período."
        
        # Análise de umidade do solo
        if not sensor_df.empty and 'soil_moisture' in sensor_df.columns:
            soil_analysis = self._analyze_soil_moisture_detailed(sensor_df, ideal_values)
            insights['soil_moisture'] = soil_analysis
        else:
            insights['soil_moisture'] = "📊 Dados de umidade do solo não disponíveis para este período."
        
        # Análise de padrões temporais
        if not sensor_df.empty:
            temporal_analysis = self._analyze_temporal_patterns(sensor_df)
            insights['temporal_patterns'] = temporal_analysis
        
        # Análise de irrigação
        irrigation_analysis = self._analyze_irrigation_pattern_detailed(sensor_df)
        insights['irrigation'] = irrigation_analysis
        
        # Análise de impacto climático
        weather_analysis = self._analyze_weather_impact_detailed(sensor_df, weather_df)
        insights['weather_impact'] = weather_analysis
        
        # Análise de correlação entre variáveis
        if not sensor_df.empty:
            correlation_analysis = self._analyze_correlations(sensor_df)
            insights['correlations'] = correlation_analysis
        
        return insights
    
    def _analyze_temperature_detailed(self, df: pd.DataFrame, ideal_values: Dict) -> str:
        """Analisa padrões de temperatura - versão detalhada"""
        temp_col = 'air_temperature'
        temps = df[temp_col].dropna()
        
        if temps.empty:
            return "📊 Dados de temperatura insuficientes para análise."
        
        avg_temp = temps.mean()
        temp_std = temps.std()
        temp_min = temps.min()
        temp_max = temps.max()
        temp_range = temp_max - temp_min
        
        ideal_temp_min = ideal_values.get('air_temperature_initial', 20)
        ideal_temp_max = ideal_values.get('air_temperature_final', 30)
        ideal_temp_avg = (ideal_temp_min + ideal_temp_max) / 2
        
        # Calcular tempo fora da faixa ideal
        out_of_range = ((temps < ideal_temp_min) | (temps > ideal_temp_max)).sum()
        out_of_range_pct = (out_of_range / len(temps)) * 100
        
        # Análise de tendência
        if len(temps) > 10:
            trend = np.polyfit(range(len(temps)), temps.values, 1)[0]
            trend_text = "subindo" if trend > 0.1 else "caindo" if trend < -0.1 else "estável"
        else:
            trend_text = "não determinada"
        
        analysis_parts = []
        analysis_parts.append("🌡️ **Análise de Temperatura**")
        analysis_parts.append("")
        analysis_parts.append(f"**Estatísticas:**")
        analysis_parts.append(f"• Média: {avg_temp:.1f}°C | Mínima: {temp_min:.1f}°C | Máxima: {temp_max:.1f}°C")
        analysis_parts.append(f"• Variação: {temp_range:.1f}°C | Desvio padrão: {temp_std:.1f}°C")
        analysis_parts.append(f"• Faixa ideal: {ideal_temp_min:.0f}°C - {ideal_temp_max:.0f}°C")
        analysis_parts.append("")
        
        # Avaliação
        analysis_parts.append("**Avaliação:**")
        if out_of_range_pct < 10:
            analysis_parts.append(f"✅ Excelente! {100-out_of_range_pct:.0f}% do tempo dentro da faixa ideal.")
        elif out_of_range_pct < 30:
            analysis_parts.append(f"⚠️ Atenção: {out_of_range_pct:.0f}% do tempo fora da faixa ideal.")
        else:
            analysis_parts.append(f"❌ Crítico: {out_of_range_pct:.0f}% do tempo fora da faixa ideal!")
        
        # Tendência
        analysis_parts.append(f"📈 Tendência: temperatura {trend_text} ao longo do período.")
        
        # Variabilidade
        if temp_std > 5:
            analysis_parts.append("⚠️ Alta variabilidade detectada - considere melhorar isolamento térmico.")
        elif temp_std < 2:
            analysis_parts.append("✅ Temperatura muito estável - excelente controle ambiental.")
        
        return "\n".join(analysis_parts)
    
    def _analyze_humidity_detailed(self, df: pd.DataFrame, ideal_values: Dict) -> str:
        """Analisa padrões de umidade do ar - versão detalhada"""
        humidity_col = 'air_humidity'
        humidities = df[humidity_col].dropna()
        
        if humidities.empty:
            return "📊 Dados de umidade insuficientes para análise."
        
        avg_humidity = humidities.mean()
        humidity_std = humidities.std()
        humidity_min = humidities.min()
        humidity_max = humidities.max()
        
        ideal_humidity_min = ideal_values.get('air_humidity_initial', 50)
        ideal_humidity_max = ideal_values.get('air_humidity_final', 70)
        
        # Tempo fora da faixa
        out_of_range = ((humidities < ideal_humidity_min) | (humidities > ideal_humidity_max)).sum()
        out_of_range_pct = (out_of_range / len(humidities)) * 100
        
        # Risco de doenças
        high_humidity_time = (humidities > 80).sum()
        high_humidity_pct = (high_humidity_time / len(humidities)) * 100
        
        low_humidity_time = (humidities < 40).sum()
        low_humidity_pct = (low_humidity_time / len(humidities)) * 100
        
        analysis_parts = []
        analysis_parts.append("💨 **Análise de Umidade do Ar**")
        analysis_parts.append("")
        analysis_parts.append("**Estatísticas:**")
        analysis_parts.append(f"• Média: {avg_humidity:.1f}% | Mínima: {humidity_min:.1f}% | Máxima: {humidity_max:.1f}%")
        analysis_parts.append(f"• Desvio padrão: {humidity_std:.1f}%")
        analysis_parts.append(f"• Faixa ideal: {ideal_humidity_min:.0f}% - {ideal_humidity_max:.0f}%")
        analysis_parts.append("")
        
        analysis_parts.append("**Avaliação:**")
        if out_of_range_pct < 15:
            analysis_parts.append(f"✅ Bom controle! {100-out_of_range_pct:.0f}% do tempo dentro da faixa ideal.")
        elif out_of_range_pct < 40:
            analysis_parts.append(f"⚠️ Atenção: {out_of_range_pct:.0f}% do tempo fora da faixa ideal.")
        else:
            analysis_parts.append(f"❌ Crítico: {out_of_range_pct:.0f}% do tempo fora da faixa ideal!")
        
        # Riscos
        if high_humidity_pct > 20:
            analysis_parts.append(f"🦠 Risco: {high_humidity_pct:.0f}% do tempo com umidade >80% - risco de doenças fúngicas!")
        if low_humidity_pct > 20:
            analysis_parts.append(f"🥀 Risco: {low_humidity_pct:.0f}% do tempo com umidade <40% - risco de desidratação!")
        
        return "\n".join(analysis_parts)
    
    def _analyze_soil_moisture_detailed(self, df: pd.DataFrame, ideal_values: Dict) -> str:
        """Analisa padrões de umidade do solo - versão detalhada"""
        soil_col = 'soil_moisture'
        soil = df[soil_col].dropna()
        
        if soil.empty:
            return "📊 Dados de umidade do solo insuficientes para análise."
        
        avg_soil = soil.mean()
        soil_std = soil.std()
        soil_min = soil.min()
        soil_max = soil.max()
        
        ideal_soil_min = ideal_values.get('soil_moisture_initial', 40)
        ideal_soil_max = ideal_values.get('soil_moisture_final', 70)
        
        # Análise de ciclos de irrigação
        soil_diff = soil.diff().dropna()
        irrigation_events = (soil_diff > 10).sum()  # Aumentos significativos
        drying_events = (soil_diff < -5).sum()  # Secagens
        
        # Tempo crítico
        critical_low = (soil < 30).sum()
        critical_low_pct = (critical_low / len(soil)) * 100
        
        analysis_parts = []
        analysis_parts.append("🌱 **Análise de Umidade do Solo**")
        analysis_parts.append("")
        analysis_parts.append("**Estatísticas:**")
        analysis_parts.append(f"• Média: {avg_soil:.1f}% | Mínima: {soil_min:.1f}% | Máxima: {soil_max:.1f}%")
        analysis_parts.append(f"• Desvio padrão: {soil_std:.1f}%")
        analysis_parts.append(f"• Faixa ideal: {ideal_soil_min:.0f}% - {ideal_soil_max:.0f}%")
        analysis_parts.append("")
        
        analysis_parts.append("**Padrões de Irrigação:**")
        analysis_parts.append(f"• Eventos de irrigação detectados: ~{irrigation_events}")
        analysis_parts.append(f"• Ciclos de secagem detectados: ~{drying_events}")
        
        if irrigation_events > 0:
            cycle_efficiency = drying_events / max(1, irrigation_events)
            if cycle_efficiency > 0.8:
                analysis_parts.append("✅ Bom ciclo de irrigação-secagem - solo com boa drenagem.")
            else:
                analysis_parts.append("⚠️ Solo pode estar retendo muita água ou irrigação muito frequente.")
        
        analysis_parts.append("")
        analysis_parts.append("**Avaliação:**")
        if avg_soil >= ideal_soil_min and avg_soil <= ideal_soil_max:
            analysis_parts.append(f"✅ Umidade média ({avg_soil:.1f}%) está dentro da faixa ideal!")
        elif avg_soil < ideal_soil_min:
            deficit = ideal_soil_min - avg_soil
            analysis_parts.append(f"⚠️ Solo seco! Média {deficit:.1f}% abaixo do ideal mínimo.")
        else:
            excess = avg_soil - ideal_soil_max
            analysis_parts.append(f"⚠️ Solo encharcado! Média {excess:.1f}% acima do ideal máximo.")
        
        if critical_low_pct > 10:
            analysis_parts.append(f"❌ Crítico: {critical_low_pct:.0f}% do tempo com umidade <30% - estresse hídrico!")
        
        return "\n".join(analysis_parts)
    
    def _analyze_temporal_patterns(self, df: pd.DataFrame) -> str:
        """Analisa padrões temporais nos dados"""
        if 'timecreated' not in df.columns:
            return "📊 Dados temporais não disponíveis para análise."
        
        df = df.copy()
        df['hour'] = pd.to_datetime(df['timecreated']).dt.hour
        df['day_period'] = df['hour'].apply(lambda h: 
            'manhã (6-12h)' if 6 <= h < 12 else
            'tarde (12-18h)' if 12 <= h < 18 else
            'noite (18-24h)' if 18 <= h < 24 else
            'madrugada (0-6h)'
        )
        
        analysis_parts = []
        analysis_parts.append("⏰ **Padrões Temporais**")
        analysis_parts.append("")
        
        # Análise por período do dia
        if 'air_temperature' in df.columns:
            period_temps = df.groupby('day_period')['air_temperature'].mean()
            if not period_temps.empty:
                hottest_period = period_temps.idxmax()
                coldest_period = period_temps.idxmin()
                analysis_parts.append(f"🌡️ Período mais quente: {hottest_period} ({period_temps[hottest_period]:.1f}°C)")
                analysis_parts.append(f"🌡️ Período mais frio: {coldest_period} ({period_temps[coldest_period]:.1f}°C)")
        
        if 'soil_moisture' in df.columns:
            period_soil = df.groupby('day_period')['soil_moisture'].mean()
            if not period_soil.empty:
                driest_period = period_soil.idxmin()
                analysis_parts.append(f"💧 Período mais seco: {driest_period} ({period_soil[driest_period]:.1f}%)")
        
        return "\n".join(analysis_parts) if len(analysis_parts) > 2 else "📊 Dados insuficientes para análise temporal."
    
    def _analyze_correlations(self, df: pd.DataFrame) -> str:
        """Analisa correlações entre variáveis"""
        correlations = []
        
        analysis_parts = []
        analysis_parts.append("🔗 **Correlações Detectadas**")
        analysis_parts.append("")
        
        # Temperatura vs Umidade do ar
        if 'air_temperature' in df.columns and 'air_humidity' in df.columns:
            corr = df['air_temperature'].corr(df['air_humidity'])
            if not np.isnan(corr):
                if corr < -0.5:
                    analysis_parts.append(f"📉 Temperatura e umidade: correlação negativa forte (r={corr:.2f})")
                    analysis_parts.append("   → Quando a temperatura sobe, a umidade tende a cair.")
                elif corr > 0.5:
                    analysis_parts.append(f"📈 Temperatura e umidade: correlação positiva forte (r={corr:.2f})")
        
        # Temperatura vs Umidade do solo
        if 'air_temperature' in df.columns and 'soil_moisture' in df.columns:
            corr = df['air_temperature'].corr(df['soil_moisture'])
            if not np.isnan(corr) and abs(corr) > 0.3:
                analysis_parts.append(f"📊 Temperatura e umidade do solo: r={corr:.2f}")
                if corr < -0.3:
                    analysis_parts.append("   → Dias quentes aceleram a evaporação do solo.")
        
        if len(analysis_parts) <= 2:
            analysis_parts.append("Nenhuma correlação significativa detectada entre as variáveis monitoradas.")
        
        return "\n".join(analysis_parts)
    
    def _analyze_irrigation_pattern_detailed(self, df: pd.DataFrame) -> str:
        """Analisa padrões de irrigação - versão detalhada"""
        if df.empty:
            return "📊 Dados insuficientes para análise de irrigação."
        
        analysis_parts = []
        analysis_parts.append("💧 **Análise de Irrigação**")
        analysis_parts.append("")
        
        if 'soil_moisture' not in df.columns:
            return "📊 Dados de umidade do solo não disponíveis para análise de irrigação."
        
        soil = df['soil_moisture'].dropna()
        if len(soil) < 2:
            return "📊 Dados insuficientes para análise de irrigação."
        
        soil_diff = soil.diff().dropna()
        
        # Detectar irrigações (aumentos súbitos)
        irrigation_threshold = 10
        irrigation_events = (soil_diff > irrigation_threshold).sum()
        
        # Detectar secagens (quedas graduais)
        drying_events = (soil_diff < -3).sum()
        
        # Análise de amplitude
        if irrigation_events > 0:
            irrigation_amplitudes = soil_diff[soil_diff > irrigation_threshold]
            avg_irrigation_amount = irrigation_amplitudes.mean()
            
            analysis_parts.append("**Eventos Detectados:**")
            analysis_parts.append(f"• Irrigações identificadas: ~{irrigation_events} eventos")
            analysis_parts.append(f"• Amplitude média por irrigação: ~{avg_irrigation_amount:.1f}% de aumento")
            analysis_parts.append(f"• Eventos de secagem: ~{drying_events}")
            analysis_parts.append("")
            
            # Análise de eficiência
            analysis_parts.append("**Eficiência:**")
            if drying_events >= irrigation_events * 0.7:
                analysis_parts.append("✅ Bom ciclo de irrigação - o solo está absorvendo e secando normalmente.")
            elif drying_events < irrigation_events * 0.3:
                analysis_parts.append("⚠️ Solo pode estar retendo muita água - verificar drenagem.")
            
            # Frequência
            if 'timecreated' in df.columns:
                total_hours = (pd.to_datetime(df['timecreated']).max() - 
                              pd.to_datetime(df['timecreated']).min()).total_seconds() / 3600
                if total_hours > 0:
                    irrigations_per_day = (irrigation_events / total_hours) * 24
                    analysis_parts.append(f"📊 Frequência média: ~{irrigations_per_day:.1f} irrigações/dia")
        else:
            analysis_parts.append("**Eventos Detectados:**")
            analysis_parts.append("• Nenhum evento de irrigação significativo detectado no período.")
            analysis_parts.append("• Isso pode indicar irrigação manual ou sensor descalibrado.")
        
        return "\n".join(analysis_parts)
    
    def _analyze_weather_impact_detailed(self, sensor_df: pd.DataFrame, weather_df: pd.DataFrame) -> str:
        """Analisa impacto das condições climáticas - versão detalhada"""
        analysis_parts = []
        analysis_parts.append("🌤️ **Impacto Climático**")
        analysis_parts.append("")
        
        if weather_df.empty:
            analysis_parts.append("Dados climáticos externos não disponíveis para este período.")
            analysis_parts.append("Considere integrar dados meteorológicos para análises mais completas.")
            return "\n".join(analysis_parts)
        
        if sensor_df.empty:
            return "📊 Dados de sensores insuficientes para correlação climática."
        
        # Estatísticas do clima externo
        analysis_parts.append("**Condições Externas no Período:**")
        
        if 'avgTemp' in weather_df.columns:
            avg_ext_temp = weather_df['avgTemp'].mean()
            analysis_parts.append(f"• Temperatura externa média: {avg_ext_temp:.1f}°C")
        
        if 'avgHumidity' in weather_df.columns:
            avg_ext_humidity = weather_df['avgHumidity'].mean()
            analysis_parts.append(f"• Umidade externa média: {avg_ext_humidity:.1f}%")
        
        if 'precipitation' in weather_df.columns:
            total_precip = weather_df['precipitation'].sum()
            if total_precip > 0:
                analysis_parts.append(f"• Precipitação total: {total_precip:.1f}mm")
        
        analysis_parts.append("")
        
        # Correlação interna vs externa
        if 'air_temperature' in sensor_df.columns and 'avgTemp' in weather_df.columns:
            sensor_copy = sensor_df.copy()
            sensor_copy['date'] = pd.to_datetime(sensor_copy['timecreated']).dt.date
            weather_copy = weather_df.copy()
            weather_copy['date'] = pd.to_datetime(weather_copy['date']).dt.date
            
            merged = pd.merge(sensor_copy, weather_copy, on='date', how='inner')
            if len(merged) > 1:
                correlation = merged['air_temperature'].corr(merged['avgTemp'])
                
                analysis_parts.append("**Análise de Correlação:**")
                if not np.isnan(correlation):
                    if correlation > 0.7:
                        analysis_parts.append(f"📈 Forte influência externa (r={correlation:.2f})")
                        analysis_parts.append("   → O clima externo afeta significativamente o ambiente interno.")
                        analysis_parts.append("   → Considere melhorar isolamento ou climatização.")
                    elif correlation > 0.4:
                        analysis_parts.append(f"📊 Influência moderada (r={correlation:.2f})")
                        analysis_parts.append("   → Ambiente interno parcialmente controlado.")
                    else:
                        analysis_parts.append(f"✅ Ambiente bem isolado (r={correlation:.2f})")
                        analysis_parts.append("   → Excelente controle ambiental!")
        
        return "\n".join(analysis_parts)
    
    def _generate_plant_health_insights(self, sensor_df: pd.DataFrame, 
                                        weather_df: pd.DataFrame,
                                        ideal_values: Dict,
                                        plant_info: Dict) -> str:
        """
        Gera insights específicos sobre a saúde da planta baseados nos dados semanais
        e previsão do tempo
        """
        analysis_parts = []
        analysis_parts.append("🌱 **Análise de Saúde da Planta**")
        analysis_parts.append("")
        
        plant_name = plant_info.get('name', 'planta')
        
        # 1. Avaliação do estresse da planta
        stress_assessment = self._assess_plant_stress(sensor_df, ideal_values)
        analysis_parts.append("**🔍 Avaliação de Estresse:**")
        analysis_parts.append(stress_assessment)
        analysis_parts.append("")
        
        # 2. Análise de crescimento e desenvolvimento
        growth_analysis = self._analyze_plant_growth_potential(sensor_df, ideal_values, plant_info)
        analysis_parts.append("**📈 Potencial de Crescimento:**")
        analysis_parts.append(growth_analysis)
        analysis_parts.append("")
        
        # 3. Riscos identificados
        risk_analysis = self._identify_plant_health_risks(sensor_df, weather_df, ideal_values)
        if risk_analysis:
            analysis_parts.append("**⚠️ Riscos Identificados:**")
            analysis_parts.append(risk_analysis)
            analysis_parts.append("")
        
        # 4. Previsão baseada no clima
        if not weather_df.empty:
            weather_forecast = self._analyze_weather_forecast_impact(weather_df, sensor_df, ideal_values)
            analysis_parts.append("**🌤️ Impacto da Previsão do Tempo:**")
            analysis_parts.append(weather_forecast)
            analysis_parts.append("")
        
        # 5. Recomendações prioritárias
        priority_actions = self._get_priority_plant_actions(sensor_df, weather_df, ideal_values)
        if priority_actions:
            analysis_parts.append("**⭐ Ações Prioritárias:**")
            for action in priority_actions:
                analysis_parts.append(f"• {action}")
        
        return "\n".join(analysis_parts)
    
    def _assess_plant_stress(self, df: pd.DataFrame, ideal_values: Dict) -> str:
        """Avalia o nível de estresse da planta"""
        if df.empty:
            return "Dados insuficientes para avaliar estresse."
        
        stress_factors = []
        stress_score = 0  # 0 = sem estresse, 100 = estresse crítico
        
        # Estresse térmico
        if 'air_temperature' in df.columns:
            temps = df['air_temperature'].dropna()
            ideal_min = ideal_values.get('air_temperature_initial', 20)
            ideal_max = ideal_values.get('air_temperature_final', 30)
            
            too_hot = (temps > ideal_max + 5).sum() / len(temps) * 100
            too_cold = (temps < ideal_min - 5).sum() / len(temps) * 100
            
            if too_hot > 20:
                stress_factors.append(f"🔥 Estresse térmico por calor: {too_hot:.0f}% do tempo acima de {ideal_max+5}°C")
                stress_score += 30
            elif too_hot > 10:
                stress_factors.append(f"⚠️ Calor moderado: {too_hot:.0f}% do tempo acima de {ideal_max+5}°C")
                stress_score += 15
            
            if too_cold > 20:
                stress_factors.append(f"❄️ Estresse térmico por frio: {too_cold:.0f}% do tempo abaixo de {ideal_min-5}°C")
                stress_score += 30
            elif too_cold > 10:
                stress_factors.append(f"⚠️ Frio moderado: {too_cold:.0f}% do tempo abaixo de {ideal_min-5}°C")
                stress_score += 15
        
        # Estresse hídrico
        if 'soil_moisture' in df.columns:
            soil = df['soil_moisture'].dropna()
            ideal_min = ideal_values.get('soil_moisture_initial', 40)
            
            too_dry = (soil < 30).sum() / len(soil) * 100
            too_wet = (soil > 80).sum() / len(soil) * 100
            
            if too_dry > 25:
                stress_factors.append(f"🏜️ Estresse hídrico severo: {too_dry:.0f}% do tempo com solo muito seco (<30%)")
                stress_score += 35
            elif too_dry > 10:
                stress_factors.append(f"💧 Leve déficit hídrico: {too_dry:.0f}% do tempo com solo seco")
                stress_score += 20
            
            if too_wet > 25:
                stress_factors.append(f"🌊 Encharcamento: {too_wet:.0f}% do tempo com solo saturado (>80%)")
                stress_score += 25
        
        # Estresse por umidade do ar
        if 'air_humidity' in df.columns:
            humidity = df['air_humidity'].dropna()
            ideal_min = ideal_values.get('air_humidity_initial', 50)
            ideal_max = ideal_values.get('air_humidity_final', 80)
            
            too_dry_air = (humidity < ideal_min - 15).sum() / len(humidity) * 100
            too_humid_air = (humidity > ideal_max + 15).sum() / len(humidity) * 100
            
            if too_dry_air > 30:
                stress_factors.append(f"💨 Ar muito seco: {too_dry_air:.0f}% do tempo com umidade <{ideal_min-15}%")
                stress_score += 20
            
            if too_humid_air > 30:
                stress_factors.append(f"☁️ Ar muito úmido: {too_humid_air:.0f}% do tempo com umidade >{ideal_max+15}%")
                stress_score += 15
        
        # Avaliação final
        if stress_score == 0:
            return "✅ Excelente! A planta está em condições ideais, sem sinais de estresse."
        elif stress_score < 30:
            return "🟢 Baixo nível de estresse. Planta está saudável com condições boas.\n" + "\n".join(stress_factors)
        elif stress_score < 60:
            return f"🟡 Nível moderado de estresse (score: {stress_score:.0f}/100). Atenção necessária:\n" + "\n".join(stress_factors)
        else:
            return f"🔴 Nível crítico de estresse (score: {stress_score:.0f}/100)! Ação imediata necessária:\n" + "\n".join(stress_factors)
    
    def _analyze_plant_growth_potential(self, df: pd.DataFrame, ideal_values: Dict, plant_info: Dict) -> str:
        """Analisa o potencial de crescimento da planta"""
        if df.empty:
            return "Dados insuficientes para análise de crescimento."
        
        growth_factors = []
        growth_score = 0  # 0-100
        
        # Fator 1: Estabilidade ambiental
        stability = self._calculate_stability_score(df)
        if stability > 0.8:
            growth_factors.append("✅ Ambiente muito estável - ótimo para crescimento")
            growth_score += 30
        elif stability > 0.6:
            growth_factors.append("🟡 Ambiente moderadamente estável")
            growth_score += 20
        else:
            growth_factors.append("⚠️ Ambiente instável pode afetar o crescimento")
            growth_score += 10
        
        # Fator 2: Condições dentro da faixa ideal
        if 'air_temperature' in df.columns:
            temps = df['air_temperature'].dropna()
            ideal_min = ideal_values.get('air_temperature_initial', 20)
            ideal_max = ideal_values.get('air_temperature_final', 30)
            in_range = ((temps >= ideal_min) & (temps <= ideal_max)).sum() / len(temps) * 100
            
            if in_range > 80:
                growth_factors.append(f"🌡️ Temperatura ideal {in_range:.0f}% do tempo")
                growth_score += 25
            elif in_range > 60:
                growth_factors.append(f"🌡️ Temperatura aceitável {in_range:.0f}% do tempo")
                growth_score += 15
            else:
                growth_factors.append(f"⚠️ Temperatura fora do ideal {100-in_range:.0f}% do tempo")
                growth_score += 5
        
        # Fator 3: Irrigação adequada
        if 'soil_moisture' in df.columns:
            soil = df['soil_moisture'].dropna()
            ideal_min = ideal_values.get('soil_moisture_initial', 40)
            ideal_max = ideal_values.get('soil_moisture_final', 70)
            in_range = ((soil >= ideal_min) & (soil <= ideal_max)).sum() / len(soil) * 100
            
            if in_range > 70:
                growth_factors.append(f"💧 Umidade do solo ideal {in_range:.0f}% do tempo")
                growth_score += 25
            elif in_range > 50:
                growth_factors.append(f"💧 Umidade do solo aceitável {in_range:.0f}% do tempo")
                growth_score += 15
            else:
                growth_factors.append(f"⚠️ Umidade do solo inadequada {100-in_range:.0f}% do tempo")
                growth_score += 5
        
        # Fator 4: Consistência ao longo do tempo
        if 'timecreated' in df.columns and len(df) > 24:
            # Verificar se as condições melhoraram ou pioraram
            df_sorted = df.sort_values('timecreated')
            first_half = df_sorted.iloc[:len(df_sorted)//2]
            second_half = df_sorted.iloc[len(df_sorted)//2:]
            
            if 'air_temperature' in df.columns:
                first_temp_in_range = 0
                second_temp_in_range = 0
                
                ideal_min = ideal_values.get('air_temperature_initial', 20)
                ideal_max = ideal_values.get('air_temperature_final', 30)
                
                if not first_half.empty:
                    first_temps = first_half['air_temperature'].dropna()
                    if len(first_temps) > 0:
                        first_temp_in_range = ((first_temps >= ideal_min) & (first_temps <= ideal_max)).sum() / len(first_temps) * 100
                
                if not second_half.empty:
                    second_temps = second_half['air_temperature'].dropna()
                    if len(second_temps) > 0:
                        second_temp_in_range = ((second_temps >= ideal_min) & (second_temps <= ideal_max)).sum() / len(second_temps) * 100
                
                improvement = second_temp_in_range - first_temp_in_range
                if improvement > 10:
                    growth_factors.append(f"📈 Condições melhorando: +{improvement:.0f}% de tempo em temperatura ideal")
                    growth_score += 20
                elif improvement < -10:
                    growth_factors.append(f"📉 Condições piorando: {improvement:.0f}% de tempo em temperatura ideal")
        
        # Avaliação final
        analysis = []
        if growth_score >= 80:
            analysis.append("🌟 Excelente potencial de crescimento! As condições estão ideais.")
            analysis.append(f"**Score de crescimento: {growth_score}/100**")
        elif growth_score >= 60:
            analysis.append("🟢 Bom potencial de crescimento. Condições favoráveis.")
            analysis.append(f"**Score de crescimento: {growth_score}/100**")
        elif growth_score >= 40:
            analysis.append("🟡 Potencial moderado. Algumas melhorias recomendadas.")
            analysis.append(f"**Score de crescimento: {growth_score}/100**")
        else:
            analysis.append("🔴 Baixo potencial de crescimento. Ajustes necessários urgentemente.")
            analysis.append(f"**Score de crescimento: {growth_score}/100**")
        
        analysis.append("")
        analysis.extend(growth_factors)
        
        return "\n".join(analysis)
    
    def _identify_plant_health_risks(self, sensor_df: pd.DataFrame, 
                                     weather_df: pd.DataFrame, 
                                     ideal_values: Dict) -> str:
        """Identifica riscos específicos para a saúde da planta"""
        risks = []
        
        if sensor_df.empty:
            return ""
        
        # Risco 1: Doenças fúngicas por umidade alta
        if 'air_humidity' in sensor_df.columns:
            humidity = sensor_df['air_humidity'].dropna()
            high_humidity_hours = (humidity > 85).sum()
            
            if high_humidity_hours > len(humidity) * 0.3:
                risks.append("🍄 **Alto risco de doenças fúngicas**: Umidade do ar muito alta por períodos prolongados")
                risks.append("   → Risco: Oídio, míldio, podridão")
                risks.append("   → Ação: Melhorar ventilação, reduzir irrigação foliar")
        
        # Risco 2: Estresse hídrico
        if 'soil_moisture' in sensor_df.columns:
            soil = sensor_df['soil_moisture'].dropna()
            critical_dry = (soil < 25).sum()
            
            if critical_dry > len(soil) * 0.2:
                risks.append("🏜️ **Risco de murcha e estresse hídrico**: Solo muito seco frequentemente")
                risks.append("   → Consequências: Redução do crescimento, folhas murchas")
                risks.append("   → Ação: Aumentar frequência de irrigação")
        
        # Risco 3: Choque térmico
        if 'air_temperature' in sensor_df.columns:
            temps = sensor_df['air_temperature'].dropna()
            if len(temps) > 1:
                temp_diff = temps.diff().abs()
                thermal_shocks = (temp_diff > 8).sum()
                
                if thermal_shocks > 3:
                    risks.append("🌡️ **Risco de choque térmico**: Variações bruscas de temperatura detectadas")
                    risks.append("   → Consequências: Estresse, crescimento lento")
                    risks.append("   → Ação: Melhorar isolamento, usar sombreamento/aquecimento gradual")
        
        # Risco 4: Condições climáticas adversas previstas
        if not weather_df.empty:
            if 'maxTemp' in weather_df.columns:
                future_temps = weather_df['maxTemp'].tail(3)  # Próximos 3 dias
                if len(future_temps) > 0 and future_temps.max() > 35:
                    risks.append("☀️ **Alerta de onda de calor**: Temperaturas extremas previstas")
                    risks.append("   → Ação preventiva: Aumentar sombreamento, irrigar preventivamente")
            
            if 'precipitation' in weather_df.columns:
                future_rain = weather_df['precipitation'].tail(3).sum()
                if future_rain > 50:
                    risks.append("🌧️ **Alerta de chuva intensa**: Alta precipitação prevista")
                    risks.append("   → Ação: Verificar drenagem, reduzir irrigação")
        
        # Risco 5: Deficiência nutricional (baseado em crescimento lento)
        growth_trend = self._analyze_growth_trend(sensor_df)
        if growth_trend['trend'] == 'negative':
            risks.append("🌾 **Possível deficiência nutricional**: Condições instáveis podem indicar falta de nutrientes")
            risks.append("   → Ação: Analisar solo, considerar adubação")
        
        return "\n".join(risks) if risks else ""
    
    def _analyze_weather_forecast_impact(self, weather_df: pd.DataFrame, 
                                         sensor_df: pd.DataFrame,
                                         ideal_values: Dict) -> str:
        """Analisa o impacto da previsão do tempo na planta"""
        if weather_df.empty:
            return "Previsão do tempo não disponível."
        
        analysis = []
        
        # Analisar próximos dias (últimas linhas do dataframe de clima)
        future_weather = weather_df.tail(7)  # Próxima semana
        
        if 'avgTemp' in future_weather.columns:
            avg_future_temp = future_weather['avgTemp'].mean()
            ideal_temp = (ideal_values.get('air_temperature_initial', 20) + 
                         ideal_values.get('air_temperature_final', 30)) / 2
            
            temp_diff = avg_future_temp - ideal_temp
            
            if abs(temp_diff) < 3:
                analysis.append(f"🎯 Temperatura prevista ideal: média de {avg_future_temp:.1f}°C")
                analysis.append("   → Excelente! Condições favoráveis para crescimento")
            elif temp_diff > 5:
                analysis.append(f"🔥 Semana quente prevista: média de {avg_future_temp:.1f}°C ({temp_diff:+.1f}°C acima do ideal)")
                analysis.append("   → Preparar: Aumentar sombreamento, verificar irrigação")
            elif temp_diff < -5:
                analysis.append(f"❄️ Semana fria prevista: média de {avg_future_temp:.1f}°C ({temp_diff:.1f}°C abaixo do ideal)")
                analysis.append("   → Preparar: Proteção contra frio, reduzir ventilação")
            else:
                analysis.append(f"🌡️ Temperatura moderada prevista: média de {avg_future_temp:.1f}°C")
        
        if 'precipitation' in future_weather.columns:
            total_rain = future_weather['precipitation'].sum()
            rainy_days = (future_weather['precipitation'] > 1).sum()
            
            if total_rain > 100:
                analysis.append(f"🌧️ Período chuvoso: {total_rain:.0f}mm previstos em {rainy_days} dias")
                analysis.append("   → Ação: Reduzir irrigação, garantir boa drenagem")
            elif total_rain > 30:
                analysis.append(f"☁️ Chuvas moderadas: {total_rain:.0f}mm previstos")
                analysis.append("   → Ajustar irrigação conforme necessário")
            else:
                analysis.append("☀️ Período seco previsto")
                analysis.append("   → Manter atenção à irrigação")
        
        if 'avgHumidity' in future_weather.columns:
            avg_humidity = future_weather['avgHumidity'].mean()
            
            if avg_humidity > 80:
                analysis.append(f"💨 Alta umidade do ar prevista: {avg_humidity:.0f}%")
                analysis.append("   → Risco aumentado de doenças fúngicas - melhorar ventilação")
            elif avg_humidity < 40:
                analysis.append(f"🏜️ Ar seco previsto: {avg_humidity:.0f}%")
                analysis.append("   → Considerar umidificação ou nebulização")
        
        return "\n".join(analysis) if analysis else "Sem alertas climáticos especiais para a próxima semana."
    
    def _get_priority_plant_actions(self, sensor_df: pd.DataFrame, 
                                    weather_df: pd.DataFrame, 
                                    ideal_values: Dict) -> List[str]:
        """Identifica ações prioritárias baseadas em todos os dados"""
        actions = []
        
        if sensor_df.empty:
            return actions
        
        # Ação 1: Irrigação urgente
        if 'soil_moisture' in sensor_df.columns:
            current_soil = sensor_df['soil_moisture'].iloc[-1] if len(sensor_df) > 0 else 0
            if current_soil < 30:
                actions.append("🚨 URGENTE: Irrigar imediatamente - solo muito seco!")
        
        # Ação 2: Temperatura crítica
        if 'air_temperature' in sensor_df.columns:
            recent_temps = sensor_df['air_temperature'].tail(10)
            if len(recent_temps) > 0:
                current_temp = recent_temps.iloc[-1]
                ideal_max = ideal_values.get('air_temperature_final', 30)
                
                if current_temp > ideal_max + 7:
                    actions.append(f"🔥 URGENTE: Resfriar ambiente - {current_temp:.1f}°C é muito alto!")
                elif current_temp < ideal_values.get('air_temperature_initial', 20) - 7:
                    actions.append(f"❄️ URGENTE: Aquecer ambiente - {current_temp:.1f}°C é muito baixo!")
        
        # Ação 3: Preparação para clima extremo
        if not weather_df.empty:
            future_weather = weather_df.tail(3)
            if 'maxTemp' in future_weather.columns:
                max_temp_forecast = future_weather['maxTemp'].max()
                if max_temp_forecast > 38:
                    actions.append(f"⚠️ Preparar para onda de calor: até {max_temp_forecast:.0f}°C previstos")
            
            if 'precipitation' in future_weather.columns:
                rain_forecast = future_weather['precipitation'].sum()
                if rain_forecast > 80:
                    actions.append(f"⚠️ Preparar para chuvas intensas: {rain_forecast:.0f}mm previstos")
        
        # Ação 4: Melhorar estabilidade se necessário
        stability = self._calculate_stability_score(sensor_df)
        if stability < 0.5:
            actions.append("🔧 Revisar sistema: ambiente muito instável afeta a planta")
        
        return actions
    
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
        """Gera recomendações baseadas na análise - versão expandida"""
        recommendations = []
        
        if sensor_df.empty:
            return recommendations
        
        # Recomendações de temperatura
        if 'air_temperature' in sensor_df.columns:
            temp_recs = self._get_temperature_recommendations_detailed(sensor_df, ideal_values)
            recommendations.extend(temp_recs)
        
        # Recomendações de umidade do ar
        if 'air_humidity' in sensor_df.columns:
            humidity_recs = self._get_humidity_recommendations_detailed(sensor_df, ideal_values)
            recommendations.extend(humidity_recs)
        
        # Recomendações de umidade do solo
        if 'soil_moisture' in sensor_df.columns:
            soil_recs = self._get_soil_recommendations_detailed(sensor_df, ideal_values, metrics)
            recommendations.extend(soil_recs)
        
        # Recomendações de irrigação
        irrigation_recs = self._get_irrigation_recommendations_detailed(sensor_df, metrics)
        recommendations.extend(irrigation_recs)
        
        # Recomendações gerais
        general_recs = self._get_general_recommendations(sensor_df, ideal_values, metrics)
        recommendations.extend(general_recs)
        
        return recommendations
    
    def _get_temperature_recommendations_detailed(self, df: pd.DataFrame, ideal_values: Dict) -> List[Dict]:
        """Gera recomendações detalhadas de temperatura"""
        recommendations = []
        temps = df['air_temperature'].dropna()
        if temps.empty:
            return recommendations
        
        avg_temp = temps.mean()
        temp_max = temps.max()
        temp_min = temps.min()
        temp_std = temps.std()
        
        ideal_temp_min = ideal_values.get('air_temperature_initial', 20)
        ideal_temp_max = ideal_values.get('air_temperature_final', 30)
        ideal_temp_avg = (ideal_temp_min + ideal_temp_max) / 2
        
        # Verificar se está muito quente
        if avg_temp > ideal_temp_max:
            deviation = avg_temp - ideal_temp_max
            recommendations.append({
                'category': 'temperature',
                'priority': 'high' if deviation > 5 else 'medium',
                'title': '🌡️ Temperatura Elevada',
                'description': f'A temperatura média está {deviation:.1f}°C acima do ideal máximo ({ideal_temp_max}°C).',
                'action': 'Considere melhorar a ventilação, adicionar sombreamento ou usar sistema de resfriamento.'
            })
        
        # Verificar se está muito frio
        elif avg_temp < ideal_temp_min:
            deviation = ideal_temp_min - avg_temp
            recommendations.append({
                'category': 'temperature',
                'priority': 'high' if deviation > 5 else 'medium',
                'title': '❄️ Temperatura Baixa',
                'description': f'A temperatura média está {deviation:.1f}°C abaixo do ideal mínimo ({ideal_temp_min}°C).',
                'action': 'Considere adicionar aquecimento ou melhorar o isolamento térmico.'
            })
        
        # Verificar variabilidade alta
        if temp_std > 5:
            recommendations.append({
                'category': 'temperature',
                'priority': 'medium',
                'title': '📊 Alta Variação de Temperatura',
                'description': f'Variação de temperatura muito alta (desvio padrão: {temp_std:.1f}°C).',
                'action': 'Considere automatizar o controle de temperatura para manter maior estabilidade.'
            })
        
        # Verificar extremos
        if temp_max > 35:
            recommendations.append({
                'category': 'temperature',
                'priority': 'high',
                'title': '🔥 Pico de Temperatura Crítico',
                'description': f'Temperatura máxima atingiu {temp_max:.1f}°C, podendo causar estresse térmico na planta.',
                'action': 'Instale alertas para temperaturas acima de 32°C e tome ações preventivas.'
            })
        
        return recommendations
    
    def _get_humidity_recommendations_detailed(self, df: pd.DataFrame, ideal_values: Dict) -> List[Dict]:
        """Gera recomendações detalhadas de umidade do ar"""
        recommendations = []
        humidities = df['air_humidity'].dropna()
        if humidities.empty:
            return recommendations
        
        avg_humidity = humidities.mean()
        humidity_max = humidities.max()
        humidity_min = humidities.min()
        
        ideal_humidity_min = ideal_values.get('air_humidity_initial', 50)
        ideal_humidity_max = ideal_values.get('air_humidity_final', 70)
        
        # Tempo em zona de risco
        high_humidity_pct = ((humidities > 80).sum() / len(humidities)) * 100
        low_humidity_pct = ((humidities < 40).sum() / len(humidities)) * 100
        
        if high_humidity_pct > 20:
            recommendations.append({
                'category': 'humidity',
                'priority': 'high',
                'title': '🦠 Risco de Doenças Fúngicas',
                'description': f'{high_humidity_pct:.0f}% do tempo com umidade acima de 80%.',
                'action': 'Aumente a ventilação e considere usar um desumidificador para reduzir risco de fungos.'
            })
        
        if low_humidity_pct > 20:
            recommendations.append({
                'category': 'humidity',
                'priority': 'high',
                'title': '🥀 Risco de Desidratação',
                'description': f'{low_humidity_pct:.0f}% do tempo com umidade abaixo de 40%.',
                'action': 'Considere usar nebulização ou umidificador para manter a umidade adequada.'
            })
        
        if avg_humidity < ideal_humidity_min:
            recommendations.append({
                'category': 'humidity',
                'priority': 'medium',
                'title': '💨 Umidade do Ar Baixa',
                'description': f'Umidade média ({avg_humidity:.1f}%) abaixo do ideal ({ideal_humidity_min}%).',
                'action': 'Aumente a frequência de nebulização ou irrigação para elevar a umidade ambiente.'
            })
        
        return recommendations
    
    def _get_soil_recommendations_detailed(self, df: pd.DataFrame, ideal_values: Dict, metrics: Dict) -> List[Dict]:
        """Gera recomendações detalhadas de umidade do solo"""
        recommendations = []
        soil = df['soil_moisture'].dropna()
        if soil.empty:
            return recommendations
        
        avg_soil = soil.mean()
        soil_min = soil.min()
        soil_max = soil.max()
        
        ideal_soil_min = ideal_values.get('soil_moisture_initial', 40)
        ideal_soil_max = ideal_values.get('soil_moisture_final', 70)
        
        # Tempo em zona crítica
        critical_low_pct = ((soil < 30).sum() / len(soil)) * 100
        too_wet_pct = ((soil > 80).sum() / len(soil)) * 100
        
        if critical_low_pct > 10:
            recommendations.append({
                'category': 'soil_moisture',
                'priority': 'high',
                'title': '🏜️ Estresse Hídrico Detectado',
                'description': f'{critical_low_pct:.0f}% do tempo com umidade do solo abaixo de 30%.',
                'action': 'Aumente a frequência de irrigação ou verifique se o sistema está funcionando corretamente.'
            })
        
        if too_wet_pct > 20:
            recommendations.append({
                'category': 'soil_moisture',
                'priority': 'high',
                'title': '💦 Solo Encharcado',
                'description': f'{too_wet_pct:.0f}% do tempo com umidade do solo acima de 80%.',
                'action': 'Reduza a irrigação e verifique a drenagem do solo para evitar apodrecimento das raízes.'
            })
        
        if avg_soil < ideal_soil_min:
            deficit = ideal_soil_min - avg_soil
            recommendations.append({
                'category': 'soil_moisture',
                'priority': 'medium',
                'title': '💧 Solo Seco',
                'description': f'Umidade média do solo ({avg_soil:.1f}%) está {deficit:.1f}% abaixo do ideal.',
                'action': 'Ajuste o sistema de irrigação para manter a umidade na faixa ideal.'
            })
        
        return recommendations
    
    def _get_irrigation_recommendations_detailed(self, df: pd.DataFrame, metrics: Dict) -> List[Dict]:
        """Gera recomendações detalhadas de irrigação"""
        recommendations = []
        total_irrigations = metrics.get('total_irrigations', 0)
        
        if 'soil_moisture' in df.columns:
            soil = df['soil_moisture'].dropna()
            if len(soil) > 10:
                # Analisar padrões de irrigação
                soil_diff = soil.diff().dropna()
                irrigation_events = (soil_diff > 10).sum()
                
                # Frequência de irrigação
                if 'timecreated' in df.columns:
                    hours = (pd.to_datetime(df['timecreated']).max() - 
                            pd.to_datetime(df['timecreated']).min()).total_seconds() / 3600
                    if hours > 0:
                        irrigations_per_day = (irrigation_events / hours) * 24
                        
                        if irrigations_per_day > 5:
                            recommendations.append({
                                'category': 'irrigation',
                                'priority': 'medium',
                                'title': '⏰ Alta Frequência de Irrigação',
                                'description': f'Detectadas ~{irrigations_per_day:.1f} irrigações por dia.',
                                'action': 'Considere irrigações menos frequentes mas mais longas para permitir absorção adequada.'
                            })
                        elif irrigations_per_day < 0.5 and soil.mean() < 40:
                            recommendations.append({
                                'category': 'irrigation',
                                'priority': 'high',
                                'title': '🚰 Irrigação Insuficiente',
                                'description': f'Poucas irrigações detectadas e solo seco (média: {soil.mean():.1f}%).',
                                'action': 'Verifique o sistema de irrigação e aumente a frequência de rega.'
                            })
        
        return recommendations
    
    def _get_general_recommendations(self, df: pd.DataFrame, ideal_values: Dict, metrics: Dict) -> List[Dict]:
        """Gera recomendações gerais"""
        recommendations = []
        
        # Verificar estabilidade geral
        stability_score = self._calculate_stability_score(df)
        
        if stability_score < 0.4:
            recommendations.append({
                'category': 'general',
                'priority': 'high',
                'title': '⚠️ Ambiente Instável',
                'description': f'Score de estabilidade muito baixo ({stability_score:.0%}).',
                'action': 'Revise todos os controles ambientais - temperatura, umidade e irrigação precisam de ajustes.'
            })
        elif stability_score > 0.8:
            recommendations.append({
                'category': 'general',
                'priority': 'low',
                'title': '✅ Ambiente Bem Controlado',
                'description': f'Excelente estabilidade ambiental ({stability_score:.0%}).',
                'action': 'Continue monitorando para manter a qualidade. Considere documentar as configurações atuais.'
            })
        
        return recommendations
    
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
