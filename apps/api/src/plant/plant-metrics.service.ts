import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

export interface PlantMetrics {
  plantId: string;
  currentTemperature: number;
  currentHumidity: number;
  currentSoilMoisture: number;
  currentWaterLevel: number;
  idealTemperatureMin: number;
  idealTemperatureMax: number;
  idealHumidityMin: number;
  idealHumidityMax: number;
  idealSoilMoistureMin: number;
  idealSoilMoistureMax: number;
  alerts: PlantAlert[];
}

export interface PlantAlert {
  type:
    | 'temperature_alert'
    | 'humidity_alert'
    | 'soil_moisture_alert'
    | 'water_level_low';
  severity: 'low' | 'medium' | 'high';
  message: string;
  currentValue: number;
  idealMin?: number;
  idealMax?: number;
}

@Injectable()
export class PlantMetricsService {
  private readonly logger = new Logger(PlantMetricsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Analisa as métricas de uma planta e gera alertas se necessário
   */
  async analyzePlantMetrics(userPlantId: string): Promise<PlantMetrics | null> {
    try {
      // Buscar dados da planta do usuário
      const userPlant = await this.prisma.userPlant.findUnique({
        where: { id: userPlantId },
        include: {
          plant: true,
          sensorReadings: {
            orderBy: { timecreated: 'desc' },
            take: 1,
          },
        },
      });

      if (!userPlant || userPlant.sensorReadings.length === 0) {
        this.logger.warn(`No data found for user plant: ${userPlantId}`);
        return null;
      }

      const plant = userPlant.plant;
      const latestReading = userPlant.sensorReadings[0];

      // Calcular faixas ideais baseadas nos valores inicial e final
      const idealTemperatureMin = Math.min(
        plant.air_temperature_initial,
        plant.air_temperature_final,
      );
      const idealTemperatureMax = Math.max(
        plant.air_temperature_initial,
        plant.air_temperature_final,
      );

      const idealHumidityMin = Math.min(
        plant.air_humidity_initial,
        plant.air_humidity_final,
      );
      const idealHumidityMax = Math.max(
        plant.air_humidity_initial,
        plant.air_humidity_final,
      );

      const idealSoilMoistureMin = Math.min(
        plant.soil_moisture_initial,
        plant.soil_moisture_final,
      );
      const idealSoilMoistureMax = Math.max(
        plant.soil_moisture_initial,
        plant.soil_moisture_final,
      );

      // Gerar alertas
      const alerts: PlantAlert[] = [];

      // Alerta de temperatura
      if (
        latestReading.air_temperature < idealTemperatureMin - 5 ||
        latestReading.air_temperature > idealTemperatureMax + 5
      ) {
        const severity =
          Math.abs(latestReading.air_temperature - idealTemperatureMin) > 10 ||
          Math.abs(latestReading.air_temperature - idealTemperatureMax) > 10
            ? 'high'
            : 'medium';

        alerts.push({
          type: 'temperature_alert',
          severity,
          message: `Temperatura fora do ideal: ${latestReading.air_temperature}°C (ideal: ${idealTemperatureMin}°C - ${idealTemperatureMax}°C)`,
          currentValue: latestReading.air_temperature,
          idealMin: idealTemperatureMin,
          idealMax: idealTemperatureMax,
        });
      }

      // Alerta de umidade do ar
      if (
        latestReading.air_humidity < idealHumidityMin - 10 ||
        latestReading.air_humidity > idealHumidityMax + 10
      ) {
        const severity =
          Math.abs(latestReading.air_humidity - idealHumidityMin) > 20 ||
          Math.abs(latestReading.air_humidity - idealHumidityMax) > 20
            ? 'high'
            : 'medium';

        alerts.push({
          type: 'humidity_alert',
          severity,
          message: `Umidade do ar fora do ideal: ${latestReading.air_humidity}% (ideal: ${idealHumidityMin}% - ${idealHumidityMax}%)`,
          currentValue: latestReading.air_humidity,
          idealMin: idealHumidityMin,
          idealMax: idealHumidityMax,
        });
      }

      // Alerta de umidade do solo
      if (
        latestReading.soil_moisture < idealSoilMoistureMin - 10 ||
        latestReading.soil_moisture > idealSoilMoistureMax + 10
      ) {
        const severity =
          latestReading.soil_moisture < idealSoilMoistureMin - 20
            ? 'high'
            : 'medium';

        alerts.push({
          type: 'soil_moisture_alert',
          severity,
          message: `Umidade do solo fora do ideal: ${latestReading.soil_moisture}% (ideal: ${idealSoilMoistureMin}% - ${idealSoilMoistureMax}%)`,
          currentValue: latestReading.soil_moisture,
          idealMin: idealSoilMoistureMin,
          idealMax: idealSoilMoistureMax,
        });
      }

      // Alerta de nível de água baixo
      if (latestReading.water_level < 20) {
        alerts.push({
          type: 'water_level_low',
          severity: latestReading.water_level < 10 ? 'high' : 'medium',
          message: `Nível de água baixo: ${latestReading.water_level}%`,
          currentValue: latestReading.water_level,
        });
      }

      return {
        plantId: userPlantId,
        currentTemperature: latestReading.air_temperature,
        currentHumidity: latestReading.air_humidity,
        currentSoilMoisture: latestReading.soil_moisture,
        currentWaterLevel: latestReading.water_level,
        idealTemperatureMin,
        idealTemperatureMax,
        idealHumidityMin,
        idealHumidityMax,
        idealSoilMoistureMin,
        idealSoilMoistureMax,
        alerts,
      };
    } catch (error) {
      this.logger.error('Error analyzing plant metrics:', error);
      return null;
    }
  }

  /**
   * Verifica métricas de todas as plantas de um usuário
   */
  async analyzeUserPlants(userId: string): Promise<PlantMetrics[]> {
    try {
      const userPlants = await this.prisma.userPlant.findMany({
        where: { userId },
        select: { id: true },
      });

      const results: PlantMetrics[] = [];

      for (const userPlant of userPlants) {
        const metrics = await this.analyzePlantMetrics(userPlant.id);
        if (metrics && metrics.alerts.length > 0) {
          results.push(metrics);
        }
      }

      return results;
    } catch (error) {
      this.logger.error('Error analyzing user plants:', error);
      return [];
    }
  }
}
