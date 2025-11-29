import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from 'src/prisma.service';
import { CreateSensorDataDto } from './dto/CreateSensorDataDto';
import { PlantHealthDto } from './dto/PlantHealthDto';
import { GetAggregatedDataDto, PeriodEnum } from './dto/GetAggregatedDataDto';
import { IrrigationService } from '../irrigation/irrigation.service';
import { NotificationGeneratorService } from '../notifications/notification-generator.service';
import { firstValueFrom } from 'rxjs';

export interface DashboardKPIs {
  avgTemperature: number;
  avgHumidity: number;
  avgSoilMoisture: number;
  maxTemperature: number;
  minTemperature: number;
  maxHumidity: number;
  minHumidity: number;
  totalReadings: number;
  lastUpdated: string | null;
}

@Injectable()
export class SensorService {
  private readonly logger = new Logger(SensorService.name);
  private readonly AI_SERVICE_URL =
    process.env.AI_SERVICE_URL || 'http://localhost:5001';

  constructor(
    private readonly prisma: PrismaService,
    private readonly irrigationService: IrrigationService,
    private readonly notificationGenerator: NotificationGeneratorService,
    private readonly httpService: HttpService,
  ) {}

  /**
   * Recebe dados simplificados (4 campos) e persiste diretamente no GreenhouseSensorReading.
   * O ESP32 envia o greenhouseId e o sistema usa a planta ativa da greenhouse.
   */
  async sendData(data: CreateSensorDataDto) {
    try {
      // Busca a greenhouse diretamente pelo greenhouseId enviado pelo ESP32
      const greenhouse = await this.prisma.greenhouse.findUnique({
        where: { id: data.greenhouseId },
        include: {
          activeUserPlant: {
            include: {
              plant: true,
            },
          },
        },
      });

      if (!greenhouse) {
        throw new Error(`Greenhouse ${data.greenhouseId} not found`);
      }

      // Create the greenhouse sensor reading directly
      const sensorReading = await this.prisma.greenhouseSensorReading.create({
        data: {
          greenhouseId: greenhouse.id,
          airTemperature: data.air_temperature,
          airHumidity: data.air_humidity,
          soilMoisture: data.soil_moisture,
          soilTemperature: data.soil_temperature,
        },
      });

      // Update greenhouse current values and last data update
      await this.prisma.greenhouse.update({
        where: { id: greenhouse.id },
        data: {
          currentTemperature: data.air_temperature,
          currentHumidity: data.air_humidity,
          currentSoilMoisture: data.soil_moisture,
          lastDataUpdate: new Date(),
          isOnline: true,
        },
      });

      // Check for irrigation detection after saving sensor data
      await this.checkForIrrigationDetection(sensorReading);

      // Call AI service to analyze plant health (async, non-blocking)
      // Usa a planta ativa da greenhouse se disponível
      const activeUserPlantId = greenhouse.activeUserPlantId;
      if (activeUserPlantId) {
        this.callAIServiceAsync(
          greenhouse.id,
          sensorReading.id,
          activeUserPlantId,
        ).catch((error) => {
          this.logger.error(
            'AI service call failed (non-blocking):',
            error.message,
          );
        });
      }

      // Generate metric notifications for the greenhouse owner
      try {
        await this.notificationGenerator.generateMetricNotifications(
          greenhouse.ownerId,
        );
      } catch (error) {
        this.logger.error('Error generating metric notifications:', error);
      }

      this.logger.log('Sensor data saved successfully:', sensorReading);
      return sensorReading;
    } catch (error) {
      this.logger.error('Error sending data:', error);
      throw new Error('Failed to send data');
    }
  }

  async getData() {
    try {
      const data = await this.prisma.greenhouseSensorReading.findMany({
        orderBy: {
          timestamp: 'desc',
        },
        include: {
          greenhouse: {
            select: {
              name: true,
              location: true,
            },
          },
        },
      });
      this.logger.log('Data retrieved successfully:', data);
      return data;
    } catch (error) {
      this.logger.error('Error retrieving data:', error);
      throw new Error('Failed to retrieve data');
    }
  }

  /**
   * Determina o intervalo de agregação em minutos baseado no período/horas
   */
  private getAggregationInterval(period?: PeriodEnum, hours?: number): number {
    if (hours) {
      if (hours <= 3) return 15; // 1-3h: 15 min
      if (hours <= 12) return 30; // 6-12h: 30 min
      if (hours <= 24) return 60; // 24h: 1 hora
      if (hours <= 72) return 120; // 48-72h: 2 horas
      return 360; // > 72h: 6 horas
    }

    switch (period) {
      case PeriodEnum.TODAY:
        return 60; // 1 hora
      case PeriodEnum.WEEK:
        return 360; // 6 horas
      case PeriodEnum.MONTH:
        return 1440; // 1 dia
      default:
        return 60;
    }
  }

  /**
   * Calcula data inicial baseada nos filtros
   */
  private getStartDate(period?: PeriodEnum, hours?: number): Date {
    const now = new Date();

    if (hours) {
      return new Date(now.getTime() - hours * 60 * 60 * 1000);
    }

    const startDate = new Date();
    switch (period) {
      case PeriodEnum.TODAY:
        startDate.setHours(0, 0, 0, 0);
        break;
      case PeriodEnum.WEEK:
        startDate.setDate(now.getDate() - 7);
        break;
      case PeriodEnum.MONTH:
        startDate.setMonth(now.getMonth() - 1);
        break;
      default:
        startDate.setHours(0, 0, 0, 0);
    }

    return startDate;
  }

  /**
   * Retorna dados agregados usando Prisma (sem SQL puro)
   * Agrupa dados por intervalos de tempo dinâmicos
   */
  async getAggregatedData(filters: GetAggregatedDataDto) {
    try {
      const intervalMinutes = this.getAggregationInterval(
        filters.period,
        filters.hours,
      );
      const startDate = this.getStartDate(filters.period, filters.hours);

      this.logger.log(
        `Aggregating data with ${intervalMinutes}min intervals from ${startDate}`,
      );
      this.logger.log(
        `Filter: plantId=${filters.plantId}, period=${filters.period}, hours=${filters.hours}`,
      );

      // Get greenhouse ID from plantId if provided
      let greenhouseId: string | undefined;
      if (filters.plantId) {
        const userPlant = await this.prisma.userPlant.findUnique({
          where: { id: filters.plantId },
          select: { greenhouseId: true },
        });
        greenhouseId = userPlant?.greenhouseId || undefined;
      }

      // Buscar todos os dados do período usando Prisma
      const readings = await this.prisma.greenhouseSensorReading.findMany({
        where: {
          timestamp: {
            gte: startDate,
          },
          ...(greenhouseId && { greenhouseId }),
        },
        orderBy: {
          timestamp: 'asc',
        },
      });

      this.logger.log(
        `Found ${readings.length} readings between ${startDate} and now`,
      );

      if (readings.length > 0) {
        this.logger.log(
          `First reading: ${readings[0].timestamp}, Last reading: ${readings[readings.length - 1].timestamp}`,
        );
      }

      // Agrupar dados por intervalo usando Map
      const intervalMap = new Map<string, typeof readings>();

      readings.forEach((reading) => {
        const readingTime = new Date(reading.timestamp);

        // Calcular o timestamp arredondado para o intervalo
        // Usar timestamp completo em minutos desde epoch, não apenas horas do dia
        const totalMinutesSinceEpoch = Math.floor(
          readingTime.getTime() / (1000 * 60),
        );
        const roundedMinutesSinceEpoch =
          Math.floor(totalMinutesSinceEpoch / intervalMinutes) *
          intervalMinutes;

        // Criar nova data com o timestamp arredondado
        const intervalStart = new Date(roundedMinutesSinceEpoch * 60 * 1000);

        const intervalKey = intervalStart.toISOString();

        if (!intervalMap.has(intervalKey)) {
          intervalMap.set(intervalKey, []);
        }
        intervalMap.get(intervalKey)!.push(reading);
      });

      // Calcular médias para cada intervalo
      const formattedData = Array.from(intervalMap.entries()).map(
        ([intervalKey, intervalReadings]) => {
          const count = intervalReadings.length;

          // Calcular somas (apenas 4 campos)
          const sums = intervalReadings.reduce(
            (acc, reading) => ({
              air_temperature: acc.air_temperature + reading.airTemperature,
              air_humidity: acc.air_humidity + reading.airHumidity,
              soil_temperature: acc.soil_temperature + reading.soilTemperature,
              soil_moisture: acc.soil_moisture + reading.soilMoisture,
            }),
            {
              air_temperature: 0,
              air_humidity: 0,
              soil_temperature: 0,
              soil_moisture: 0,
            },
          );

          // Calcular médias e formatar com 2 casas decimais
          return {
            id: intervalKey,
            air_temperature: Number((sums.air_temperature / count).toFixed(2)),
            air_humidity: Number((sums.air_humidity / count).toFixed(2)),
            soil_temperature: Number(
              (sums.soil_temperature / count).toFixed(2),
            ),
            soil_moisture: Number((sums.soil_moisture / count).toFixed(2)),
            timestamp: intervalKey,
            reading_count: count,
          };
        },
      );

      // Ordenar por timestamp
      formattedData.sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      );

      this.logger.log(
        `Aggregated ${formattedData.length} intervals from ${readings.length} readings`,
      );

      return {
        data: formattedData,
        intervalMinutes,
        startDate: startDate.toISOString(),
        totalIntervals: formattedData.length,
        totalReadings: readings.length,
      };
    } catch (error) {
      this.logger.error('Error getting aggregated data:', error);
      throw new Error('Failed to get aggregated data');
    }
  }

  /**
   * Retorna dados completos do dashboard com KPIs calculados usando Prisma
   */
  async getDashboardData(filters: GetAggregatedDataDto) {
    try {
      const startDate = this.getStartDate(filters.period, filters.hours);

      // Get greenhouse ID from plantId if provided
      let greenhouseId: string | undefined;
      if (filters.plantId) {
        const userPlant = await this.prisma.userPlant.findUnique({
          where: { id: filters.plantId },
          select: { greenhouseId: true },
        });
        greenhouseId = userPlant?.greenhouseId || undefined;
      }

      // Buscar última leitura usando Prisma
      const latest = await this.prisma.greenhouseSensorReading.findFirst({
        where: greenhouseId ? { greenhouseId } : {},
        orderBy: { timestamp: 'desc' },
      });

      // Buscar todas as leituras do período para calcular KPIs
      const readings = await this.prisma.greenhouseSensorReading.findMany({
        where: {
          timestamp: {
            gte: startDate,
          },
          ...(greenhouseId && { greenhouseId }),
        },
      });

      // Calcular KPIs manualmente (mais fácil de entender que SQL)
      const kpis: DashboardKPIs = this.calculateKPIs(readings, latest);

      // Buscar dados agregados para gráficos
      const aggregatedData = await this.getAggregatedData(filters);

      this.logger.log('Dashboard data retrieved successfully');

      return {
        latest,
        history: aggregatedData.data,
        kpis,
        intervalMinutes: aggregatedData.intervalMinutes,
        startDate: aggregatedData.startDate,
      };
    } catch (error) {
      this.logger.error('Error getting dashboard data:', error);
      throw new Error('Failed to get dashboard data');
    }
  }

  /**
   * Calcula KPIs a partir das leituras usando JavaScript
   * Mais simples e legível que SQL
   */
  private calculateKPIs(readings: any[], latest: any): DashboardKPIs {
    if (readings.length === 0) {
      return {
        avgTemperature: latest?.airTemperature || 0,
        avgHumidity: latest?.airHumidity || 0,
        avgSoilMoisture: latest?.soilMoisture || 0,
        maxTemperature: latest?.airTemperature || 0,
        minTemperature: latest?.airTemperature || 0,
        maxHumidity: latest?.airHumidity || 0,
        minHumidity: latest?.airHumidity || 0,
        totalReadings: 0,
        lastUpdated: latest?.timestamp?.toISOString() || null,
      };
    }

    // Extrair valores (apenas 4 campos)
    const temperatures = readings.map((r) => r.airTemperature);
    const humidities = readings.map((r) => r.airHumidity);
    const soilMoistures = readings.map((r) => r.soilMoisture);

    // Calcular médias
    const avgTemperature =
      temperatures.reduce((a, b) => a + b, 0) / temperatures.length;
    const avgHumidity =
      humidities.reduce((a, b) => a + b, 0) / humidities.length;
    const avgSoilMoisture =
      soilMoistures.reduce((a, b) => a + b, 0) / soilMoistures.length;

    return {
      avgTemperature: Number(avgTemperature.toFixed(2)),
      avgHumidity: Number(avgHumidity.toFixed(2)),
      avgSoilMoisture: Number(avgSoilMoisture.toFixed(2)),
      maxTemperature: Number(Math.max(...temperatures).toFixed(2)),
      minTemperature: Number(Math.min(...temperatures).toFixed(2)),
      maxHumidity: Number(Math.max(...humidities).toFixed(2)),
      minHumidity: Number(Math.min(...humidities).toFixed(2)),
      totalReadings: readings.length,
      lastUpdated: latest?.timestamp?.toISOString() || null,
    };
  }

  /**
   * Check for irrigation detection based on soil moisture changes
   */
  async checkForIrrigationDetection(greenhouseSensorReading: any) {
    try {
      // Use the irrigation service to detect moisture-based irrigation
      await this.irrigationService.detectMoistureIrrigation(
        greenhouseSensorReading.greenhouseId,
        greenhouseSensorReading.soilMoisture,
      );
    } catch (error) {
      this.logger.error('Error checking for irrigation detection:', error);
    }
  }

  /**
   * Check if there was a pump activation in the given timeframe
   */
  private async checkPumpActivationInTimeframe(
    startTime: Date,
    endTime: Date,
    greenhouseId: string,
  ): Promise<boolean> {
    try {
      // Check for pump operations in the timeframe
      const pumpOperations = await this.prisma.pumpOperation.findMany({
        where: {
          greenhouseId: greenhouseId,
          startedAt: {
            gte: endTime,
            lte: startTime,
          },
          status: {
            in: ['active', 'completed'],
          },
        },
      });

      return pumpOperations.length > 0;
    } catch (error) {
      this.logger.error('Error checking pump activation:', error);
      return false; // Default to no pump activation on error
    }
  }

  /**
   * Chama o Flask AI Service para análise de saúde da planta
   * Esta função é non-blocking e não deve falhar o fluxo principal
   */
  private async callAIServiceAsync(
    greenhouseId: string,
    sensorReadingId: string,
    userPlantId: string,
  ): Promise<void> {
    try {
      this.logger.log(
        `🤖 Calling AI service for greenhouse ${greenhouseId}...`,
      );

      // Call Flask AI service
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.AI_SERVICE_URL}/analyze-sensors`,
          { greenhouseId },
          {
            timeout: 10000, // 10 second timeout
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      );

      const aiResult = response.data;

      this.logger.log(
        `✅ AI analysis complete: Health=${aiResult.healthScore}, Status=${aiResult.healthStatus}`,
      );

      // Update the sensor reading with AI predictions
      await this.prisma.greenhouseSensorReading.update({
        where: { id: sensorReadingId },
        data: {
          plantHealthScore: aiResult.healthScore,
          // Note: predictedMoisture array would need schema update to store
        },
      });

      // Create notification if plant health is critical
      if (aiResult.healthStatus === 'HIGH_STRESS') {
        try {
          const userPlant = await this.prisma.userPlant.findUnique({
            where: { id: userPlantId },
            select: { userId: true, plant: { select: { name: true } } },
          });

          if (userPlant?.userId) {
            await this.prisma.notification.create({
              data: {
                userId: userPlant.userId,
                title: '⚠️ Alerta de Saúde da Planta',
                message: `Planta ${userPlant.plant?.name || 'desconhecida'} com estresse crítico (Score: ${aiResult.healthScore.toFixed(1)}). ${aiResult.recommendations?.[0] || 'Verifique as condições.'}`,
                type: 'ALERT',
                isRead: false,
              },
            });
            this.logger.log(
              `📢 Critical health notification created for user ${userPlant.userId}`,
            );
          }
        } catch (notifError) {
          this.logger.error(
            'Failed to create health notification:',
            notifError,
          );
        }
      }

      this.logger.log(`💾 AI predictions saved to database`);
    } catch (error) {
      // Log error but don't throw - AI service failure should not block sensor data saving
      if (error.code === 'ECONNREFUSED') {
        this.logger.warn('⚠️  AI service not available (connection refused)');
      } else if (error.code === 'ETIMEDOUT') {
        this.logger.warn('⚠️  AI service timeout');
      } else {
        this.logger.error('❌ AI service error:', error.message);
      }
    }
  }

  /**
   * Atualiza o plantHealthScore da última leitura de uma greenhouse associada ao userPlant
   */
  async updatePlantHealthScore(dto: PlantHealthDto) {
    try {
      const userPlant = await this.prisma.userPlant.findUnique({
        where: { id: dto.userPlantId },
        select: { greenhouseId: true, userId: true },
      });
      if (!userPlant || !userPlant.greenhouseId) {
        this.logger.warn(
          `UserPlant ${dto.userPlantId} não possui greenhouse associada.`,
        );
        return null;
      }

      const latestReading = await this.prisma.greenhouseSensorReading.findFirst(
        {
          where: { greenhouseId: userPlant.greenhouseId },
          orderBy: { timestamp: 'desc' },
        },
      );

      if (!latestReading) {
        this.logger.warn(
          `Nenhuma leitura encontrada para greenhouse ${userPlant.greenhouseId}.`,
        );
        return null;
      }

      const updated = await this.prisma.greenhouseSensorReading.update({
        where: { id: latestReading.id },
        data: { plantHealthScore: dto.confidence },
      });

      // Geração opcional de notificação pode ser integrada aqui (futuro)
      return {
        reading: updated,
        healthStatus: dto.healthStatus,
        confidence: dto.confidence,
        recommendations: dto.recommendations,
      };
    } catch (err) {
      this.logger.error('Erro ao atualizar plantHealthScore', err);
      throw err;
    }
  }

  /**
   * Busca a última leitura de sensor de uma greenhouse específica
   * Usado pelo sistema de irrigação automática (AI)
   */
  async getLatestReading(greenhouseId: string) {
    const greenhouse = await this.prisma.greenhouse.findUnique({
      where: { id: greenhouseId },
      select: {
        id: true,
        name: true,
        currentTemperature: true,
        currentHumidity: true,
        currentSoilMoisture: true,
        lastDataUpdate: true,
        isOnline: true,
      },
    });

    if (!greenhouse) {
      throw new Error(`Greenhouse ${greenhouseId} not found`);
    }

    const latestReading = await this.prisma.greenhouseSensorReading.findFirst({
      where: { greenhouseId },
      orderBy: { timestamp: 'desc' },
    });

    return {
      greenhouse: {
        id: greenhouse.id,
        name: greenhouse.name,
        isOnline: greenhouse.isOnline,
        lastDataUpdate: greenhouse.lastDataUpdate,
      },
      latestReading: latestReading
        ? {
            id: latestReading.id,
            airTemperature: latestReading.airTemperature,
            airHumidity: latestReading.airHumidity,
            soilMoisture: latestReading.soilMoisture,
            soilTemperature: latestReading.soilTemperature,
            plantHealthScore: latestReading.plantHealthScore,
            timestamp: latestReading.timestamp,
          }
        : null,
      // Valores atuais da greenhouse (cache)
      currentValues: {
        temperature: greenhouse.currentTemperature,
        humidity: greenhouse.currentHumidity,
        soilMoisture: greenhouse.currentSoilMoisture,
      },
    };
  }

  /**
   * Verifica se a irrigação é necessária baseada na umidade do solo
   * Retorna recomendação para o sistema de irrigação automática
   */
  async checkIrrigationNeeded(greenhouseId: string, threshold: number = 30) {
    const data = await this.getLatestReading(greenhouseId);

    if (!data.latestReading) {
      return {
        needsIrrigation: false,
        reason: 'No sensor data available',
        soilMoisture: null,
        threshold,
        recommendation: 'WAIT',
      };
    }

    const soilMoisture = data.latestReading.soilMoisture;
    const needsIrrigation = soilMoisture < threshold;

    let recommendation: 'IRRIGATE' | 'MONITOR' | 'OK' | 'WAIT';
    let reason: string;

    if (soilMoisture === 0 || soilMoisture === null) {
      recommendation = 'WAIT';
      reason = 'Soil moisture sensor may be disconnected or reading invalid';
    } else if (soilMoisture < threshold) {
      recommendation = 'IRRIGATE';
      reason = `Soil moisture (${soilMoisture}%) is below threshold (${threshold}%)`;
    } else if (soilMoisture < threshold + 20) {
      recommendation = 'MONITOR';
      reason = `Soil moisture (${soilMoisture}%) is acceptable but below ideal`;
    } else {
      recommendation = 'OK';
      reason = `Soil moisture (${soilMoisture}%) is at good level`;
    }

    return {
      needsIrrigation,
      soilMoisture,
      threshold,
      recommendation,
      reason,
      timestamp: data.latestReading.timestamp,
      greenhouse: data.greenhouse,
    };
  }

  /**
   * Get historical readings for LSTM model input
   * Returns raw sensor readings for the specified time period
   */
  async getHistoricalReadings(
    greenhouseId: string,
    hours: number = 24,
    limit: number = 100,
  ): Promise<any[]> {
    const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);

    const readings = await this.prisma.greenhouseSensorReading.findMany({
      where: {
        greenhouseId,
        timestamp: {
          gte: startDate,
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: limit,
      select: {
        id: true,
        airTemperature: true,
        airHumidity: true,
        soilMoisture: true,
        soilTemperature: true,
        timestamp: true,
      },
    });

    // Return in chronological order (oldest first)
    return readings.reverse();
  }
}
