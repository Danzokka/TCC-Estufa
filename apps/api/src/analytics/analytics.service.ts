import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AiIntegrationService, AIInsights } from './ai-integration.service';

export interface ReportMetrics {
  avgTemperature: number;
  avgHumidity: number;
  avgSoilMoisture: number;
  avgSoilTemperature: number;
  temperatureDeviation: number;
  humidityDeviation: number;
  soilMoistureDeviation: number;
  totalReadings: number;
  totalIrrigations: number;
}

export interface ReportData {
  userPlantId: string;
  type: 'weekly' | 'monthly' | 'general';
  startDate: Date;
  endDate: Date;
  sensorReadings: any[];
  irrigationEvents: any[];
  plantIdealValues: {
    minTemperature: number;
    maxTemperature: number;
    minHumidity: number;
    maxHumidity: number;
    minSoilMoisture: number;
    maxSoilMoisture: number;
  };
  metrics: ReportMetrics;
}

export interface Report {
  id: string;
  userPlantId: string;
  type: string;
  startDate: Date;
  endDate: Date;
  totalReadings: number;
  totalIrrigations: number;
  summary: string | null;
  aiInsights: AIInsights | null;
  recommendations: any | null;
  createdAt: Date;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiIntegration: AiIntegrationService,
  ) {}

  /**
   * Gera relatório semanal para uma planta
   */
  async generateWeeklyReport(userPlantId: string): Promise<Report> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    return this.generateReport(userPlantId, 'weekly', startDate, endDate);
  }

  /**
   * Gera relatório mensal para uma planta
   */
  async generateMonthlyReport(userPlantId: string): Promise<Report> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);

    return this.generateReport(userPlantId, 'monthly', startDate, endDate);
  }

  /**
   * Gera relatório geral (últimos 30 dias) para uma planta
   */
  async generateGeneralReport(userPlantId: string): Promise<Report> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    return this.generateReport(userPlantId, 'general', startDate, endDate);
  }

  /**
   * Gera relatório com dados e insights
   */
  private async generateReport(
    userPlantId: string,
    type: 'weekly' | 'monthly' | 'general',
    startDate: Date,
    endDate: Date,
  ): Promise<Report> {
    this.logger.log(`Gerando relatório ${type} para planta ${userPlantId}`);

    // 1. Buscar dados da planta do usuário
    const userPlant = await this.prisma.userPlant.findUnique({
      where: { id: userPlantId },
      include: {
        plant: true,
        greenhouse: true,
      },
    });

    if (!userPlant) {
      throw new Error('Planta não encontrada');
    }

    if (!userPlant.greenhouseId) {
      throw new Error('Planta não associada a uma estufa');
    }

    // 2. Buscar leituras de sensor no período
    const sensorReadings = await this.prisma.greenhouseSensorReading.findMany({
      where: {
        greenhouseId: userPlant.greenhouseId,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { timestamp: 'asc' },
    });

    // 3. Buscar eventos de irrigação no período
    const irrigations = await this.prisma.irrigation.findMany({
      where: {
        greenhouseId: userPlant.greenhouseId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // 4. Calcular métricas
    const metrics = this.calculateMetrics(
      sensorReadings,
      irrigations,
      userPlant.plant,
    );

    // 5. Montar dados do relatório para IA
    const reportData: ReportData = {
      userPlantId,
      type,
      startDate,
      endDate,
      sensorReadings: sensorReadings.map((r) => ({
        id: r.id,
        timestamp: r.timestamp,
        air_temperature: r.airTemperature,
        air_humidity: r.airHumidity,
        soil_moisture: r.soilMoisture,
        soil_temperature: r.soilTemperature,
      })),
      irrigationEvents: irrigations.map((i) => ({
        id: i.id,
        type: i.type,
        createdAt: i.createdAt,
        notes: i.notes,
      })),
      plantIdealValues: {
        minTemperature: userPlant.plant.air_temperature_initial,
        maxTemperature: userPlant.plant.air_temperature_final,
        minHumidity: userPlant.plant.air_humidity_initial,
        maxHumidity: userPlant.plant.air_humidity_final,
        minSoilMoisture: userPlant.plant.soil_moisture_initial,
        maxSoilMoisture: userPlant.plant.soil_moisture_final,
      },
      metrics,
    };

    // 6. Gerar insights usando IA
    let insights: AIInsights | null = null;
    try {
      insights = await this.aiIntegration.generateInsights(reportData as any);
    } catch (error) {
      this.logger.warn(`Falha ao gerar insights via IA: ${error.message}`);
    }

    // 7. Gerar resumo
    const summary = this.generateSummary(metrics, userPlant.plant);

    // 8. Gerar recomendações
    const recommendations = this.generateRecommendations(
      metrics,
      userPlant.plant,
    );

    // 9. Salvar relatório no banco
    const report = await this.prisma.report.create({
      data: {
        userPlantId,
        type,
        startDate,
        endDate,
        totalReadings: metrics.totalReadings,
        totalIrrigations: metrics.totalIrrigations,
        summary,
        aiInsights: insights as any,
        recommendations: recommendations as any,
      },
    });

    return {
      id: report.id,
      userPlantId: report.userPlantId,
      type: report.type,
      startDate: report.startDate,
      endDate: report.endDate,
      totalReadings: report.totalReadings,
      totalIrrigations: report.totalIrrigations,
      summary: report.summary,
      aiInsights: report.aiInsights as AIInsights | null,
      recommendations: report.recommendations,
      createdAt: report.createdAt,
    };
  }

  /**
   * Gera resumo do relatório
   */
  private generateSummary(metrics: ReportMetrics, plant: any): string {
    const parts: string[] = [];

    if (metrics.totalReadings === 0) {
      return 'Nenhuma leitura de sensor registrada no período.';
    }

    parts.push(
      `Durante o período analisado, foram registradas ${metrics.totalReadings} leituras de sensor.`,
    );

    if (Math.abs(metrics.temperatureDeviation) > 3) {
      const direction = metrics.temperatureDeviation > 0 ? 'acima' : 'abaixo';
      parts.push(
        `A temperatura média esteve ${Math.abs(metrics.temperatureDeviation).toFixed(1)}°C ${direction} do ideal.`,
      );
    } else {
      parts.push('A temperatura se manteve dentro da faixa ideal.');
    }

    if (Math.abs(metrics.humidityDeviation) > 10) {
      parts.push(
        `A umidade do ar teve desvio de ${Math.abs(metrics.humidityDeviation).toFixed(1)}% em relação ao ideal.`,
      );
    }

    if (metrics.totalIrrigations > 0) {
      parts.push(
        `Foram registradas ${metrics.totalIrrigations} irrigações no período.`,
      );
    }

    return parts.join(' ');
  }

  /**
   * Gera recomendações baseadas nas métricas
   */
  private generateRecommendations(
    metrics: ReportMetrics,
    plant: any,
  ): Array<{ category: string; priority: string; description: string }> {
    const recommendations: Array<{
      category: string;
      priority: string;
      description: string;
    }> = [];

    // Recomendações de temperatura
    if (metrics.temperatureDeviation > 5) {
      recommendations.push({
        category: 'temperature',
        priority: 'high',
        description: `A temperatura está muito alta. Considere melhorar a ventilação ou adicionar sombreamento.`,
      });
    } else if (metrics.temperatureDeviation < -5) {
      recommendations.push({
        category: 'temperature',
        priority: 'high',
        description: `A temperatura está muito baixa. Considere usar aquecimento ou melhorar o isolamento.`,
      });
    }

    // Recomendações de umidade do ar
    if (metrics.humidityDeviation > 15) {
      recommendations.push({
        category: 'humidity',
        priority: 'medium',
        description: `A umidade do ar está alta. Melhore a ventilação para evitar doenças fúngicas.`,
      });
    } else if (metrics.humidityDeviation < -15) {
      recommendations.push({
        category: 'humidity',
        priority: 'medium',
        description: `A umidade do ar está baixa. Considere aumentar a irrigação ou usar umidificadores.`,
      });
    }

    // Recomendações de umidade do solo
    if (metrics.soilMoistureDeviation > 20) {
      recommendations.push({
        category: 'soil_moisture',
        priority: 'high',
        description: `Solo muito úmido. Reduza a frequência de irrigação para evitar podridão de raízes.`,
      });
    } else if (metrics.soilMoistureDeviation < -20) {
      recommendations.push({
        category: 'soil_moisture',
        priority: 'high',
        description: `Solo seco. Aumente a frequência ou duração das irrigações.`,
      });
    }

    // Recomendação de irrigação
    if (metrics.totalIrrigations === 0 && metrics.totalReadings > 10) {
      recommendations.push({
        category: 'irrigation',
        priority: 'medium',
        description: `Nenhuma irrigação registrada no período. Verifique se o sistema está funcionando.`,
      });
    }

    return recommendations;
  }

  /**
   * Calcula métricas do relatório
   */
  private calculateMetrics(
    readings: any[],
    irrigations: any[],
    plant: any,
  ): ReportMetrics {
    if (readings.length === 0) {
      return {
        avgTemperature: 0,
        avgHumidity: 0,
        avgSoilMoisture: 0,
        avgSoilTemperature: 0,
        temperatureDeviation: 0,
        humidityDeviation: 0,
        soilMoistureDeviation: 0,
        totalReadings: 0,
        totalIrrigations: irrigations.length,
      };
    }

    // Calcular médias
    const avgTemperature =
      readings.reduce((sum, r) => sum + (r.airTemperature || 0), 0) /
      readings.length;
    const avgHumidity =
      readings.reduce((sum, r) => sum + (r.airHumidity || 0), 0) /
      readings.length;
    const avgSoilMoisture =
      readings.reduce((sum, r) => sum + (r.soilMoisture || 0), 0) /
      readings.length;
    const avgSoilTemperature =
      readings.reduce((sum, r) => sum + (r.soilTemperature || 0), 0) /
      readings.length;

    // Calcular valores ideais (média entre initial e final)
    const idealTemperature =
      (plant.air_temperature_initial + plant.air_temperature_final) / 2;
    const idealHumidity =
      (plant.air_humidity_initial + plant.air_humidity_final) / 2;
    const idealSoilMoisture =
      (plant.soil_moisture_initial + plant.soil_moisture_final) / 2;

    // Calcular desvios
    const temperatureDeviation = avgTemperature - idealTemperature;
    const humidityDeviation = avgHumidity - idealHumidity;
    const soilMoistureDeviation = avgSoilMoisture - idealSoilMoisture;

    return {
      avgTemperature: Number(avgTemperature.toFixed(2)),
      avgHumidity: Number(avgHumidity.toFixed(2)),
      avgSoilMoisture: Number(avgSoilMoisture.toFixed(2)),
      avgSoilTemperature: Number(avgSoilTemperature.toFixed(2)),
      temperatureDeviation: Number(temperatureDeviation.toFixed(2)),
      humidityDeviation: Number(humidityDeviation.toFixed(2)),
      soilMoistureDeviation: Number(soilMoistureDeviation.toFixed(2)),
      totalReadings: readings.length,
      totalIrrigations: irrigations.length,
    };
  }

  /**
   * Busca relatórios de uma planta
   */
  async getReports(userPlantId: string, type?: string): Promise<Report[]> {
    const reports = await this.prisma.report.findMany({
      where: {
        userPlantId,
        ...(type && { type }),
      },
      orderBy: { createdAt: 'desc' },
    });

    return reports.map((r) => ({
      id: r.id,
      userPlantId: r.userPlantId,
      type: r.type,
      startDate: r.startDate,
      endDate: r.endDate,
      totalReadings: r.totalReadings,
      totalIrrigations: r.totalIrrigations,
      summary: r.summary,
      aiInsights: r.aiInsights as AIInsights | null,
      recommendations: r.recommendations,
      createdAt: r.createdAt,
    }));
  }

  /**
   * Busca relatório por ID
   */
  async getReportById(reportId: string): Promise<Report | null> {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) return null;

    return {
      id: report.id,
      userPlantId: report.userPlantId,
      type: report.type,
      startDate: report.startDate,
      endDate: report.endDate,
      totalReadings: report.totalReadings,
      totalIrrigations: report.totalIrrigations,
      summary: report.summary,
      aiInsights: report.aiInsights as AIInsights | null,
      recommendations: report.recommendations,
      createdAt: report.createdAt,
    };
  }

  /**
   * Busca último relatório de um tipo específico
   */
  async getLatestReport(
    userPlantId: string,
    type: string,
  ): Promise<Report | null> {
    const report = await this.prisma.report.findFirst({
      where: {
        userPlantId,
        type,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!report) return null;

    return {
      id: report.id,
      userPlantId: report.userPlantId,
      type: report.type,
      startDate: report.startDate,
      endDate: report.endDate,
      totalReadings: report.totalReadings,
      totalIrrigations: report.totalIrrigations,
      summary: report.summary,
      aiInsights: report.aiInsights as AIInsights | null,
      recommendations: report.recommendations,
      createdAt: report.createdAt,
    };
  }

  /**
   * Verifica saúde do serviço de IA
   */
  async checkAiHealth(): Promise<boolean> {
    return this.aiIntegration.checkAiServiceHealth();
  }
}
