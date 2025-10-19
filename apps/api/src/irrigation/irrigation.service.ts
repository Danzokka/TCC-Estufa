import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateIrrigationDto } from './dto/create-irrigation.dto';
import { ConfirmIrrigationDto } from './dto/confirm-irrigation.dto';

@Injectable()
export class IrrigationService {
  private readonly logger = new Logger(IrrigationService.name);

  constructor(private prisma: PrismaService) {}

  async createManualIrrigation(createIrrigationDto: CreateIrrigationDto) {
    try {
      const irrigation = await this.prisma.irrigation.create({
        data: {
          type: 'manual',
          waterAmount: createIrrigationDto.waterAmount,
          notes: createIrrigationDto.notes,
          greenhouseId: createIrrigationDto.greenhouseId,
          userId: createIrrigationDto.userId,
          plantId: createIrrigationDto.plantId,
        },
      });

      this.logger.log(`Manual irrigation recorded: ${irrigation.id}`);
      return irrigation;
    } catch (error) {
      this.logger.error('Failed to create manual irrigation', error);
      throw error;
    }
  }

  async detectIrrigation(sensorId: string) {
    try {
      // Get recent sensor readings to detect irrigation
      const recentReadings = await this.prisma.sensorReading.findMany({
        where: {
          sensorId,
          sensorType: 'soil_moisture',
        },
        orderBy: { timestamp: 'desc' },
        take: 10, // Last 10 readings
      });

      if (recentReadings.length < 2) {
        return { detected: false, reason: 'Insufficient data' };
      }

      // Check for significant moisture increase without pump activation
      const latest = recentReadings[0];
      const previous = recentReadings[recentReadings.length - 1];

      const moistureIncrease = latest.value - previous.value;
      const threshold = 15; // 15% increase threshold

      if (moistureIncrease > threshold) {
        // Check if there was a pump activation in the same timeframe
        const pumpActivation = await this.checkPumpActivationInTimeframe(
          latest.timestamp,
          previous.timestamp,
          sensorId,
        );

        if (!pumpActivation) {
          // Detected manual/chuva irrigation
          const irrigation = await this.prisma.irrigation.create({
            data: {
              type: 'detected',
              waterAmount: null, // Will be filled by user
              notes: `Detected moisture increase of ${moistureIncrease.toFixed(1)}%`,
              greenhouseId: latest.greenhouseId,
              sensorId,
            },
          });

          this.logger.log(`Irrigation detected: ${irrigation.id}`);
          return {
            detected: true,
            irrigation,
            moistureIncrease,
            requiresConfirmation: true,
          };
        }
      }

      return { detected: false, reason: 'No significant moisture increase' };
    } catch (error) {
      this.logger.error('Failed to detect irrigation', error);
      throw error;
    }
  }

  async getIrrigationHistory(greenhouseId: string) {
    try {
      return await this.prisma.irrigation.findMany({
        where: { greenhouseId },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          plant: {
            select: { id: true, name: true, species: true },
          },
          sensor: {
            select: { id: true, name: true, type: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    } catch (error) {
      this.logger.error('Failed to get irrigation history', error);
      throw error;
    }
  }

  async confirmIrrigation(confirmIrrigationDto: ConfirmIrrigationDto) {
    try {
      const existingIrrigation = await this.prisma.irrigation.findUnique({
        where: { id: confirmIrrigationDto.irrigationId },
      });

      if (!existingIrrigation) {
        throw new NotFoundException('Irrigation record not found');
      }

      if (existingIrrigation.type !== 'detected') {
        throw new Error('Only detected irrigations can be confirmed');
      }

      const updatedIrrigation = await this.prisma.irrigation.update({
        where: { id: confirmIrrigationDto.irrigationId },
        data: {
          waterAmount: confirmIrrigationDto.waterAmount,
          notes: confirmIrrigationDto.notes || existingIrrigation.notes,
          type: 'manual', // Change to manual since user confirmed
        },
        include: {
          greenhouse: {
            select: { id: true, name: true },
          },
          sensor: {
            select: { id: true, name: true },
          },
        },
      });

      this.logger.log(`Irrigation confirmed: ${updatedIrrigation.id}`);
      return updatedIrrigation;
    } catch (error) {
      this.logger.error('Failed to confirm irrigation', error);
      throw error;
    }
  }

  private async checkPumpActivationInTimeframe(
    startTime: Date,
    endTime: Date,
    sensorId: string,
  ): Promise<boolean> {
    // Check if there was any pump activation in the timeframe
    // This would need to be implemented based on your pump logging
    // For now, return false to trigger manual irrigation detection
    return false;
  }
}
