import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateSensorDataDto } from './dto/CreateSensorDataDto';
import { GetAggregatedDataDto, PeriodEnum } from './dto/GetAggregatedDataDto';

export interface DashboardKPIs {
  avgTemperature: number;
  avgHumidity: number;
  avgSoilMoisture: number;
  avgWaterLevel: number;
  maxTemperature: number;
  minTemperature: number;
  maxHumidity: number;
  minHumidity: number;
  totalReadings: number;
  lastUpdated: string | null;
}

@Injectable()
export class SensorService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly logger = new Logger(SensorService.name);

  async sendData(data: CreateSensorDataDto) {
    try {
      const sensorData = await this.prisma.sensor.create({
        data: {
          air_temperature: data.air_temperature,
          air_humidity: data.air_humidity,
          soil_temperature: data.soil_temperature,
          soil_moisture: data.soil_moisture,
          light_intensity: data.light_intensity,
          water_level: data.water_level,
          water_reserve: data.water_reserve,
          userPlantId: data.userPlant, // Ensure this property is provided in CreateSensorDataDto
        },
      });

      // Check for irrigation detection after saving sensor data
      await this.checkForIrrigationDetection(sensorData);

      this.logger.log('Data sent successfully:', sensorData);
      return sensorData;
    } catch (error) {
      this.logger.error('Error sending data:', error);
      throw new Error('Failed to send data');
    }
  }

  async getData() {
    try {
      const data = await this.prisma.sensor.findMany({
        orderBy: {
          timecreated: 'desc',
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

      // Buscar todos os dados do período usando Prisma
      const readings = await this.prisma.sensor.findMany({
        where: {
          timecreated: {
            gte: startDate,
          },
          ...(filters.plantId && { userPlantId: filters.plantId }),
        },
        orderBy: {
          timecreated: 'asc',
        },
      });

      this.logger.log(
        `Found ${readings.length} readings between ${startDate} and now`,
      );

      if (readings.length > 0) {
        this.logger.log(
          `First reading: ${readings[0].timecreated}, Last reading: ${readings[readings.length - 1].timecreated}`,
        );
      }

      // Agrupar dados por intervalo usando Map
      const intervalMap = new Map<string, typeof readings>();

      readings.forEach((reading) => {
        const readingTime = new Date(reading.timecreated);

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

          // Calcular somas
          const sums = intervalReadings.reduce(
            (acc, reading) => ({
              air_temperature: acc.air_temperature + reading.air_temperature,
              air_humidity: acc.air_humidity + reading.air_humidity,
              soil_temperature: acc.soil_temperature + reading.soil_temperature,
              soil_moisture: acc.soil_moisture + reading.soil_moisture,
              light_intensity: acc.light_intensity + reading.light_intensity,
              water_level: acc.water_level + reading.water_level,
              water_reserve: acc.water_reserve + reading.water_reserve,
            }),
            {
              air_temperature: 0,
              air_humidity: 0,
              soil_temperature: 0,
              soil_moisture: 0,
              light_intensity: 0,
              water_level: 0,
              water_reserve: 0,
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
            light_intensity: Number((sums.light_intensity / count).toFixed(2)),
            water_level: Number((sums.water_level / count).toFixed(2)),
            water_reserve: Number((sums.water_reserve / count).toFixed(2)),
            timecreated: intervalKey,
            reading_count: count,
          };
        },
      );

      // Ordenar por timestamp
      formattedData.sort(
        (a, b) =>
          new Date(a.timecreated).getTime() - new Date(b.timecreated).getTime(),
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

      // Buscar última leitura usando Prisma
      const latest = await this.prisma.sensor.findFirst({
        where: filters.plantId ? { userPlantId: filters.plantId } : {},
        orderBy: { timecreated: 'desc' },
      });

      // Buscar todas as leituras do período para calcular KPIs
      const readings = await this.prisma.sensor.findMany({
        where: {
          timecreated: {
            gte: startDate,
          },
          ...(filters.plantId && { userPlantId: filters.plantId }),
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
        avgTemperature: latest?.air_temperature || 0,
        avgHumidity: latest?.air_humidity || 0,
        avgSoilMoisture: latest?.soil_moisture || 0,
        avgWaterLevel: latest?.water_level || 0,
        maxTemperature: latest?.air_temperature || 0,
        minTemperature: latest?.air_temperature || 0,
        maxHumidity: latest?.air_humidity || 0,
        minHumidity: latest?.air_humidity || 0,
        totalReadings: 0,
        lastUpdated: latest?.timecreated?.toISOString() || null,
      };
    }

    // Extrair valores
    const temperatures = readings.map((r) => r.air_temperature);
    const humidities = readings.map((r) => r.air_humidity);
    const soilMoistures = readings.map((r) => r.soil_moisture);
    const waterLevels = readings.map((r) => r.water_level);

    // Calcular médias
    const avgTemperature =
      temperatures.reduce((a, b) => a + b, 0) / temperatures.length;
    const avgHumidity =
      humidities.reduce((a, b) => a + b, 0) / humidities.length;
    const avgSoilMoisture =
      soilMoistures.reduce((a, b) => a + b, 0) / soilMoistures.length;
    const avgWaterLevel =
      waterLevels.reduce((a, b) => a + b, 0) / waterLevels.length;

    return {
      avgTemperature: Number(avgTemperature.toFixed(2)),
      avgHumidity: Number(avgHumidity.toFixed(2)),
      avgSoilMoisture: Number(avgSoilMoisture.toFixed(2)),
      avgWaterLevel: Number(avgWaterLevel.toFixed(2)),
      maxTemperature: Number(Math.max(...temperatures).toFixed(2)),
      minTemperature: Number(Math.min(...temperatures).toFixed(2)),
      maxHumidity: Number(Math.max(...humidities).toFixed(2)),
      minHumidity: Number(Math.min(...humidities).toFixed(2)),
      totalReadings: readings.length,
      lastUpdated: latest?.timecreated?.toISOString() || null,
    };
  }

  /**
   * Check for irrigation detection based on soil moisture changes
   */
  private async checkForIrrigationDetection(sensorData: any) {
    try {
      // Get the user plant to find the greenhouse
      const userPlant = await this.prisma.userPlant.findUnique({
        where: { id: sensorData.userPlantId },
        include: { user: true },
      });

      if (!userPlant) {
        this.logger.warn(
          `UserPlant not found for sensor data: ${sensorData.id}`,
        );
        return;
      }

      // Get recent sensor readings for this user plant
      const recentReadings = await this.prisma.sensor.findMany({
        where: { userPlantId: sensorData.userPlantId },
        orderBy: { timecreated: 'desc' },
        take: 10, // Last 10 readings
      });

      if (recentReadings.length < 2) {
        return; // Not enough data for comparison
      }

      const latest = recentReadings[0];
      const previous = recentReadings[1];

      // Check for significant moisture increase
      const moistureIncrease = latest.soil_moisture - previous.soil_moisture;
      const threshold = 15; // 15% increase threshold

      if (moistureIncrease > threshold) {
        // Check if there was a pump activation in the same timeframe
        const pumpActivation = await this.checkPumpActivationInTimeframe(
          latest.timecreated,
          previous.timecreated,
          userPlant.id,
        );

        if (!pumpActivation) {
          // Detected manual/chuva irrigation
          this.logger.log(
            `Irrigation detected for user plant ${userPlant.id}: moisture increase ${moistureIncrease.toFixed(1)}%`,
          );

          // Get greenhouse ID from user plant
          const greenhouse = await this.prisma.greenhouse.findFirst({
            where: { ownerId: userPlant.userId },
          });

          if (greenhouse) {
            // Create irrigation record
            const irrigation = await this.prisma.irrigation.create({
              data: {
                type: 'detected',
                waterAmount: null, // Will be filled by user
                notes: `Detected moisture increase of ${moistureIncrease.toFixed(1)}%`,
                greenhouseId: greenhouse.id,
                sensorId: sensorData.id,
              },
            });

            // TODO: Send notification via WebSocket
            // This will be implemented when we integrate with the WebSocket gateway
            this.logger.log(`Irrigation record created: ${irrigation.id}`);
          }
        }
      }
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
    userPlantId: string,
  ): Promise<boolean> {
    // TODO: Implement pump activation checking
    // This would check the pump operations table for activations
    // in the timeframe between startTime and endTime
    return false; // For now, always return false to trigger detection
  }
}
