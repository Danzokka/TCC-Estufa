import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ReportData } from './analytics.service';

export interface AIInsights {
  summary: string;
  insights: {
    temperature: string;
    humidity: string;
    soil_moisture: string;
    light: string;
    irrigation: string;
    weather_impact: string;
  };
  recommendations: Array<{
    category: string;
    priority: 'high' | 'medium' | 'low';
    description: string;
  }>;
  anomalies: Array<{
    type: string;
    description: string;
    severity: 'high' | 'medium' | 'low';
  }>;
}

@Injectable()
export class AiIntegrationService {
  private readonly logger = new Logger(AiIntegrationService.name);
  private readonly aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';

  constructor(private readonly httpService: HttpService) {}

  /**
   * Gera insights usando o serviço de IA
   */
  async generateInsights(reportData: ReportData): Promise<AIInsights> {
    try {
      this.logger.log(`Enviando dados para análise de IA: ${reportData.userPlantId}`);

      const payload = {
        user_plant_id: reportData.userPlantId,
        period_type: reportData.type,
        start_date: reportData.startDate.toISOString(),
        end_date: reportData.endDate.toISOString(),
        sensor_data: reportData.sensorReadings,
        weather_data: reportData.weatherData,
        irrigation_data: reportData.irrigationEvents,
        plant_ideal_values: reportData.plantIdealValues,
        metrics: reportData.metrics,
      };

      const response = await firstValueFrom(
        this.httpService.post(`${this.aiServiceUrl}/api/generate-insights`, payload, {
          timeout: 30000, // 30 segundos
        }),
      );

      this.logger.log(`Insights gerados com sucesso para ${reportData.userPlantId}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Erro ao gerar insights via IA: ${error.message}`);
      
      // Retornar insights padrão em caso de erro
      return this.getDefaultInsights(reportData);
    }
  }

  /**
   * Gera insights padrão quando o serviço de IA não está disponível
   */
  private getDefaultInsights(reportData: ReportData): AIInsights {
    const { metrics } = reportData;
    
    // Análise básica de temperatura
    let temperatureInsight = `Temperatura média de ${metrics.avgTemperature.toFixed(1)}°C`;
    if (Math.abs(metrics.temperatureDeviation) > 5) {
      temperatureInsight += `. ${metrics.temperatureDeviation > 0 ? 'Acima' : 'Abaixo'} do ideal.`;
    } else {
      temperatureInsight += '. Dentro da faixa ideal.';
    }

    // Análise básica de umidade
    let humidityInsight = `Umidade média de ${metrics.avgHumidity.toFixed(1)}%`;
    if (Math.abs(metrics.humidityDeviation) > 10) {
      humidityInsight += `. ${metrics.humidityDeviation > 0 ? 'Acima' : 'Abaixo'} do ideal.`;
    } else {
      humidityInsight += '. Dentro da faixa ideal.';
    }

    // Análise básica de umidade do solo
    let soilMoistureInsight = `Umidade do solo média de ${metrics.avgSoilMoisture.toFixed(1)}%`;
    if (Math.abs(metrics.soilMoistureDeviation) > 15) {
      soilMoistureInsight += `. ${metrics.soilMoistureDeviation > 0 ? 'Acima' : 'Abaixo'} do ideal.`;
    } else {
      soilMoistureInsight += '. Dentro da faixa ideal.';
    }

    // Análise básica de luminosidade
    let lightInsight = `Luminosidade média de ${metrics.avgLightIntensity.toFixed(1)} lux`;
    if (Math.abs(metrics.lightIntensityDeviation) > 20) {
      lightInsight += `. ${metrics.lightIntensityDeviation > 0 ? 'Acima' : 'Abaixo'} do ideal.`;
    } else {
      lightInsight += '. Dentro da faixa ideal.';
    }

    // Análise de irrigação
    const irrigationInsight = `Total de ${metrics.totalIrrigations} irrigações no período. ${
      metrics.totalIrrigations > 0 ? 'Atividade de irrigação registrada.' : 'Nenhuma irrigação detectada.'
    }`;

    // Análise de impacto climático
    const weatherInsight = reportData.weatherData.length > 0
      ? `Dados climáticos disponíveis para ${reportData.weatherData.length} dias. Temperatura externa média: ${metrics.avgWeatherTemp?.toFixed(1) || 'N/A'}°C`
      : 'Dados climáticos não disponíveis para análise.';

    // Gerar recomendações básicas
    const recommendations: Array<{
      category: string;
      priority: 'high' | 'medium' | 'low';
      description: string;
    }> = [];
    
    if (Math.abs(metrics.temperatureDeviation) > 5) {
      recommendations.push({
        category: 'temperature',
        priority: 'high' as const,
        description: `Ajustar temperatura para ${metrics.temperatureDeviation > 0 ? 'reduzir' : 'aumentar'} em ${Math.abs(metrics.temperatureDeviation).toFixed(1)}°C`,
      });
    }

    if (Math.abs(metrics.humidityDeviation) > 10) {
      recommendations.push({
        category: 'humidity',
        priority: 'high' as const,
        description: `Ajustar umidade para ${metrics.humidityDeviation > 0 ? 'reduzir' : 'aumentar'} em ${Math.abs(metrics.humidityDeviation).toFixed(1)}%`,
      });
    }

    if (Math.abs(metrics.soilMoistureDeviation) > 15) {
      recommendations.push({
        category: 'soil_moisture',
        priority: 'high' as const,
        description: `Ajustar irrigação para ${metrics.soilMoistureDeviation > 0 ? 'reduzir' : 'aumentar'} umidade do solo`,
      });
    }

    if (metrics.totalIrrigations === 0 && reportData.type !== 'general') {
      recommendations.push({
        category: 'irrigation',
        priority: 'medium' as const,
        description: 'Considerar irrigação manual ou verificar sistema automático',
      });
    }

    return {
      summary: `Relatório ${reportData.type} gerado com ${metrics.totalReadings} medições e ${metrics.totalIrrigations} irrigações. ${
        Math.abs(metrics.temperatureDeviation) > 5 || Math.abs(metrics.humidityDeviation) > 10 || Math.abs(metrics.soilMoistureDeviation) > 15
          ? 'Atenção necessária para ajustes ambientais.'
          : 'Condições ambientais dentro dos parâmetros ideais.'
      }`,
      insights: {
        temperature: temperatureInsight,
        humidity: humidityInsight,
        soil_moisture: soilMoistureInsight,
        light: lightInsight,
        irrigation: irrigationInsight,
        weather_impact: weatherInsight,
      },
      recommendations,
      anomalies: [], // TODO: Implementar detecção de anomalias
    };
  }

  /**
   * Verifica se o serviço de IA está disponível
   */
  async checkAiServiceHealth(): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.aiServiceUrl}/health`, {
          timeout: 5000,
        }),
      );
      return response.status === 200;
    } catch (error) {
      this.logger.warn(`Serviço de IA não disponível: ${error.message}`);
      return false;
    }
  }
}
