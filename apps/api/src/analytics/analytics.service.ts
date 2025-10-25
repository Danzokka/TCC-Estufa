import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { WeatherService } from '../weather/weather.service';
import { AiIntegrationService } from './ai-integration.service';
import { Report, WeatherData } from '@prisma/client';

export interface ReportMetrics {
  totalReadings: number;
  totalIrrigations: number;
  avgGrowthRate?: number;
  
  // Métricas ambientais
  avgTemperature: number;
  minTemperature: number;
  maxTemperature: number;
  avgHumidity: number;
  minHumidity: number;
  maxHumidity: number;
  avgSoilMoisture: number;
  minSoilMoisture: number;
  maxSoilMoisture: number;
  avgLightIntensity: number;
  minLightIntensity: number;
  maxLightIntensity: number;
  
  // Comparação com valores ideais
  temperatureDeviation: number;
  humidityDeviation: number;
  soilMoistureDeviation: number;
  lightIntensityDeviation: number;
  
  // Dados climáticos
  weatherData?: WeatherData[];
  avgWeatherTemp?: number;
  totalPrecipitation?: number;
  avgWeatherHumidity?: number;
}

export interface ReportData {
  userPlantId: string;
  type: 'weekly' | 'monthly' | 'general';
  startDate: Date;
  endDate: Date;
  metrics: ReportMetrics;
  sensorReadings: any[];
  irrigationEvents: any[];
  weatherData: WeatherData[];
  plantIdealValues: any;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly weatherService: WeatherService,
    private readonly aiIntegrationService: AiIntegrationService,
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
   * Gera relatório geral para uma planta
   */
  async generateGeneralReport(userPlantId: string): Promise<Report> {
    // Buscar data de adição da planta
    const userPlant = await this.prisma.userPlant.findUnique({
      where: { id: userPlantId },
      include: { plant: true },
    });

    if (!userPlant) {
      throw new NotFoundException(`Planta do usuário com ID ${userPlantId} não encontrada`);
    }

    const startDate = userPlant.dateAdded;
    const endDate = new Date();

    return this.generateReport(userPlantId, 'general', startDate, endDate);
  }

  /**
   * Gera relatório para um período específico
   */
  private async generateReport(
    userPlantId: string,
    type: 'weekly' | 'monthly' | 'general',
    startDate: Date,
    endDate: Date,
  ): Promise<Report> {
    try {
      this.logger.log(`Gerando relatório ${type} para planta ${userPlantId}`);

      // Verificar se a planta existe
      const userPlant = await this.prisma.userPlant.findUnique({
        where: { id: userPlantId },
        include: { 
          plant: true,
          greenhouse: true,
        },
      });

      if (!userPlant) {
        throw new NotFoundException(`Planta do usuário com ID ${userPlantId} não encontrada`);
      }

      // Calcular métricas do período
      const metrics = await this.calculateMetrics(userPlantId, startDate, endDate);

      // Buscar dados climáticos se a estufa tiver localização
      let weatherData: WeatherData[] = [];
      if (userPlant.greenhouse?.location && userPlant.greenhouseId) {
        weatherData = await this.weatherService.getWeatherDataForPeriod(
          userPlant.greenhouseId,
          startDate,
          endDate,
        );
      }

      // Preparar dados para IA
      const reportData: ReportData = {
        userPlantId,
        type,
        startDate,
        endDate,
        metrics,
        sensorReadings: await this.getSensorReadings(userPlantId, startDate, endDate),
        irrigationEvents: await this.getIrrigationEvents(userPlantId, startDate, endDate),
        weatherData,
        plantIdealValues: {
          air_temperature_initial: userPlant.plant.air_temperature_initial,
          air_temperature_final: userPlant.plant.air_temperature_final,
          air_humidity_initial: userPlant.plant.air_humidity_initial,
          air_humidity_final: userPlant.plant.air_humidity_final,
          soil_moisture_initial: userPlant.plant.soil_moisture_initial,
          soil_moisture_final: userPlant.plant.soil_moisture_final,
          soil_temperature_initial: userPlant.plant.soil_temperature_initial,
          soil_temperature_final: userPlant.plant.soil_temperature_final,
          light_intensity_initial: userPlant.plant.light_intensity_initial,
          light_intensity_final: userPlant.plant.light_intensity_final,
        },
      };

      // Integrar com serviço de IA para gerar insights
      let aiInsights;
      try {
        aiInsights = await this.aiIntegrationService.generateInsights(reportData);
      } catch (error) {
        this.logger.warn(`Erro ao gerar insights via IA: ${error.message}. Usando insights padrão.`);
        aiInsights = {
          summary: `Relatório ${type} gerado automaticamente`,
          insights: {
            temperature: `Temperatura média: ${metrics.avgTemperature.toFixed(1)}°C`,
            humidity: `Umidade média: ${metrics.avgHumidity.toFixed(1)}%`,
            soil_moisture: `Umidade do solo média: ${metrics.avgSoilMoisture.toFixed(1)}%`,
            light: `Luminosidade média: ${metrics.avgLightIntensity.toFixed(1)} lux`,
            irrigation: `Total de irrigações: ${metrics.totalIrrigations}`,
            weather_impact: weatherData.length > 0 ? 'Dados climáticos disponíveis' : 'Dados climáticos não disponíveis',
          },
          recommendations: [
            {
              category: 'temperature',
              priority: Math.abs(metrics.temperatureDeviation) > 5 ? 'high' : 'medium',
              description: `Temperatura ${metrics.temperatureDeviation > 0 ? 'acima' : 'abaixo'} do ideal`,
            },
            {
              category: 'humidity',
              priority: Math.abs(metrics.humidityDeviation) > 10 ? 'high' : 'medium',
              description: `Umidade ${metrics.humidityDeviation > 0 ? 'acima' : 'abaixo'} do ideal`,
            },
            {
              category: 'soil_moisture',
              priority: Math.abs(metrics.soilMoistureDeviation) > 15 ? 'high' : 'medium',
              description: `Umidade do solo ${metrics.soilMoistureDeviation > 0 ? 'acima' : 'abaixo'} do ideal`,
            },
          ],
          anomalies: [],
        };
      }

      // Criar relatório no banco
      const report = await this.prisma.report.create({
        data: {
          userPlantId,
          type,
          startDate,
          endDate,
          totalReadings: metrics.totalReadings,
          totalIrrigations: metrics.totalIrrigations,
          avgGrowthRate: metrics.avgGrowthRate,
          summary: aiInsights.summary,
          aiInsights: aiInsights.insights,
          recommendations: aiInsights.recommendations,
          weatherSummary: weatherData.length > 0 ? {
            totalDays: weatherData.length,
            avgTemp: metrics.avgWeatherTemp,
            totalPrecip: metrics.totalPrecipitation,
            avgHumidity: metrics.avgWeatherHumidity,
          } : undefined,
        },
      });

      this.logger.log(`Relatório ${type} gerado com sucesso para planta ${userPlantId}`);
      return report;
    } catch (error) {
      this.logger.error(`Erro ao gerar relatório: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calcula métricas para um período específico
   */
  async calculateMetrics(
    userPlantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ReportMetrics> {
    // Buscar leituras de sensores do período
    const sensorReadings = await this.prisma.sensor.findMany({
      where: {
        userPlantId,
        timecreated: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        timecreated: 'asc',
      },
    });

    // Buscar irrigações do período
    const irrigations = await this.prisma.irrigation.findMany({
      where: {
        plantId: userPlantId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Buscar planta para valores ideais
    const userPlant = await this.prisma.userPlant.findUnique({
      where: { id: userPlantId },
      include: { plant: true },
    });

    if (!userPlant) {
      throw new NotFoundException(`Planta do usuário com ID ${userPlantId} não encontrada`);
    }

    const plant = userPlant.plant;

    // Calcular estatísticas básicas
    const totalReadings = sensorReadings.length;
    const totalIrrigations = irrigations.length;

    // Calcular médias, mínimos e máximos
    const temperatures = sensorReadings.map(r => r.air_temperature);
    const humidities = sensorReadings.map(r => r.air_humidity);
    const soilMoistures = sensorReadings.map(r => r.soil_moisture);
    const lightIntensities = sensorReadings.map(r => r.light_intensity);

    const avgTemperature = this.calculateAverage(temperatures);
    const minTemperature = Math.min(...temperatures);
    const maxTemperature = Math.max(...temperatures);

    const avgHumidity = this.calculateAverage(humidities);
    const minHumidity = Math.min(...humidities);
    const maxHumidity = Math.max(...humidities);

    const avgSoilMoisture = this.calculateAverage(soilMoistures);
    const minSoilMoisture = Math.min(...soilMoistures);
    const maxSoilMoisture = Math.max(...soilMoistures);

    const avgLightIntensity = this.calculateAverage(lightIntensities);
    const minLightIntensity = Math.min(...lightIntensities);
    const maxLightIntensity = Math.max(...lightIntensities);

    // Calcular desvios dos valores ideais
    const idealTemp = (plant.air_temperature_initial + plant.air_temperature_final) / 2;
    const idealHumidity = (plant.air_humidity_initial + plant.air_humidity_final) / 2;
    const idealSoilMoisture = (plant.soil_moisture_initial + plant.soil_moisture_final) / 2;
    const idealLight = (plant.light_intensity_initial + plant.light_intensity_final) / 2;

    const temperatureDeviation = avgTemperature - idealTemp;
    const humidityDeviation = avgHumidity - idealHumidity;
    const soilMoistureDeviation = avgSoilMoisture - idealSoilMoisture;
    const lightIntensityDeviation = avgLightIntensity - idealLight;

    return {
      totalReadings,
      totalIrrigations,
      avgGrowthRate: undefined, // TODO: Implementar cálculo de taxa de crescimento
      
      avgTemperature,
      minTemperature,
      maxTemperature,
      avgHumidity,
      minHumidity,
      maxHumidity,
      avgSoilMoisture,
      minSoilMoisture,
      maxSoilMoisture,
      avgLightIntensity,
      minLightIntensity,
      maxLightIntensity,
      
      temperatureDeviation,
      humidityDeviation,
      soilMoistureDeviation,
      lightIntensityDeviation,
    };
  }

  /**
   * Busca leituras de sensores de um período
   */
  private async getSensorReadings(userPlantId: string, startDate: Date, endDate: Date) {
    return this.prisma.sensor.findMany({
      where: {
        userPlantId,
        timecreated: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        timecreated: 'asc',
      },
    });
  }

  /**
   * Busca eventos de irrigação de um período
   */
  private async getIrrigationEvents(userPlantId: string, startDate: Date, endDate: Date) {
    return this.prisma.irrigation.findMany({
      where: {
        plantId: userPlantId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  /**
   * Lista relatórios de uma planta
   */
  async getReports(userPlantId: string, type?: string): Promise<Report[]> {
    const where: any = { userPlantId };
    
    if (type) {
      where.type = type;
    }

    return this.prisma.report.findMany({
      where,
      orderBy: {
        generatedAt: 'desc',
      },
    });
  }

  /**
   * Busca relatório por ID
   */
  async getReportById(reportId: string): Promise<Report | null> {
    return this.prisma.report.findUnique({
      where: { id: reportId },
    });
  }

  /**
   * Busca último relatório de um tipo
   */
  async getLatestReport(userPlantId: string, type: string): Promise<Report | null> {
    return this.prisma.report.findFirst({
      where: {
        userPlantId,
        type,
      },
      orderBy: {
        generatedAt: 'desc',
      },
    });
  }

  /**
   * Calcula média de um array de números
   */
  private calculateAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  }
}
