import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateSensorDataDto } from './dto/CreateSensorDataDto';

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
        },
      });
      this.logger.log('Data sent successfully:', sensorData);
      return sensorData;
    } catch (error) {
      this.logger.error('Error sending data:', error);
      throw new Error('Failed to send data');
    }
  }
}
