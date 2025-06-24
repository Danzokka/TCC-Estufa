import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  ActivatePumpDto,
  PumpStatusDto,
  PumpHistoryDto,
  SimpleActivatePumpDto,
  DeviceConfigDto,
  SimpleDeviceStatusDto,
} from './dto/pump.dto';
import axios from 'axios';

@Injectable()
export class PumpService {
  private readonly logger = new Logger(PumpService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Activate water pump for a specific greenhouse
   */
  async activatePump(activatePumpDto: ActivatePumpDto): Promise<PumpStatusDto> {
    const { greenhouseId, duration, waterAmount, reason } = activatePumpDto;

    try {
      // Check if there's already an active pump operation for this greenhouse
      const existingOperation = await this.prisma.pumpOperation.findFirst({
        where: {
          greenhouseId,
          status: 'active',
        },
      });

      if (existingOperation) {
        throw new BadRequestException(
          'Pump is already active for this greenhouse',
        );
      }

      // Find ESP32 device for this greenhouse
      const device = await this.prisma.device.findFirst({
        where: {
          greenhouseId,
          type: 'esp32',
          isOnline: true,
        },
      });

      if (!device || !device.ipAddress) {
        throw new NotFoundException(
          'No online ESP32 device found for this greenhouse',
        );
      }

      // Create pump operation record
      const pumpOperation = await this.prisma.pumpOperation.create({
        data: {
          greenhouseId,
          duration,
          waterAmount,
          reason: reason || 'manual',
          status: 'active',
        },
      });

      // Send command to ESP32 device
      const esp32Response = await this.sendPumpCommand(device.ipAddress, {
        action: 'activate',
        duration,
        waterAmount,
        operationId: pumpOperation.id,
      });

      // Update operation with ESP32 response
      await this.prisma.pumpOperation.update({
        where: { id: pumpOperation.id },
        data: { esp32Response: JSON.stringify(esp32Response) },
      });

      this.logger.log(
        `Pump activated for greenhouse ${greenhouseId}, duration: ${duration}s`,
      );

      return this.mapToStatusDto(pumpOperation);
    } catch (error) {
      this.logger.error(
        `Failed to activate pump for greenhouse ${greenhouseId}:`,
        error,
      );

      // If there was a database record created, mark it as error
      if (error.pumpOperationId) {
        await this.prisma.pumpOperation.update({
          where: { id: error.pumpOperationId },
          data: {
            status: 'error',
            errorMessage: error.message,
            endedAt: new Date(),
          },
        });
      }

      throw error;
    }
  }

  /**
   * Get current pump status for a greenhouse
   */
  async getPumpStatus(greenhouseId: string): Promise<PumpStatusDto | null> {
    const operation = await this.prisma.pumpOperation.findFirst({
      where: {
        greenhouseId,
        status: 'active',
      },
      orderBy: {
        startedAt: 'desc',
      },
    });

    if (!operation) {
      return null;
    }

    return this.mapToStatusDto(operation);
  }

  /**
   * Stop/cancel an active pump operation
   */
  async stopPump(greenhouseId: string): Promise<PumpStatusDto> {
    const operation = await this.prisma.pumpOperation.findFirst({
      where: {
        greenhouseId,
        status: 'active',
      },
    });

    if (!operation) {
      throw new NotFoundException(
        'No active pump operation found for this greenhouse',
      );
    }

    // Find ESP32 device
    const device = await this.prisma.device.findFirst({
      where: {
        greenhouseId,
        type: 'esp32',
        isOnline: true,
      },
    });

    if (device && device.ipAddress) {
      // Send stop command to ESP32
      try {
        await this.sendPumpCommand(device.ipAddress, {
          action: 'stop',
          operationId: operation.id,
        });
      } catch (error) {
        this.logger.warn(
          `Failed to send stop command to ESP32: ${error.message}`,
        );
      }
    }

    // Update operation status
    const updatedOperation = await this.prisma.pumpOperation.update({
      where: { id: operation.id },
      data: {
        status: 'cancelled',
        endedAt: new Date(),
      },
    });

    this.logger.log(`Pump stopped for greenhouse ${greenhouseId}`);

    return this.mapToStatusDto(updatedOperation);
  }

  /**
   * Get pump operation history for a greenhouse
   */
  async getPumpHistory(
    greenhouseId: string,
    limit: number = 50,
  ): Promise<PumpHistoryDto[]> {
    const operations = await this.prisma.pumpOperation.findMany({
      where: { greenhouseId },
      orderBy: { startedAt: 'desc' },
      take: limit,
    });
    return operations.map((op) => ({
      id: op.id,
      greenhouseId: op.greenhouseId,
      duration: op.duration,
      waterAmount: op.waterAmount ?? undefined,
      reason: op.reason ?? undefined,
      startedAt: op.startedAt,
      endedAt: op.endedAt ?? undefined,
      status: op.status as 'active' | 'completed' | 'cancelled' | 'error',
      errorMessage: op.errorMessage ?? undefined,
    }));
  }

  /**
   * Send HTTP command to ESP32 device
   */
  private async sendPumpCommand(
    esp32IpAddress: string,
    command: any,
  ): Promise<any> {
    const url = `http://${esp32IpAddress}/pump/control`;

    try {
      this.logger.debug(`Sending pump command to ${url}:`, command);

      const response = await axios.post(url, command, {
        timeout: 10000, // 10 second timeout
        headers: {
          'Content-Type': 'application/json',
        },
      });

      this.logger.debug(`ESP32 response:`, response.data);
      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to send command to ESP32 at ${url}:`,
        error.message,
      );
      throw new BadRequestException(
        `Failed to communicate with ESP32 device: ${error.message}`,
      );
    }
  }

  /**
   * Update pump operation status (called by ESP32 or internal processes)
   */
  async updatePumpStatus(
    operationId: string,
    status: string,
    errorMessage?: string,
  ): Promise<void> {
    await this.prisma.pumpOperation.update({
      where: { id: operationId },
      data: {
        status,
        errorMessage,
        endedAt: status !== 'active' ? new Date() : undefined,
      },
    });

    this.logger.log(
      `Pump operation ${operationId} status updated to: ${status}`,
    );
  }

  /**
   * Register or update ESP32 device information
   */
  async registerDevice(deviceInfo: {
    name: string;
    greenhouseId: string;
    ipAddress: string;
    macAddress: string;
    firmwareVersion?: string;
  }): Promise<void> {
    const { name, greenhouseId, ipAddress, macAddress, firmwareVersion } =
      deviceInfo;

    await this.prisma.device.upsert({
      where: { macAddress },
      update: {
        name,
        greenhouseId,
        ipAddress,
        firmwareVersion,
        isOnline: true,
        lastSeen: new Date(),
      },
      create: {
        name,
        greenhouseId,
        ipAddress,
        macAddress,
        firmwareVersion,
        isOnline: true,
        type: 'esp32',
        lastSeen: new Date(),
      },
    });

    this.logger.log(
      `Device registered: ${name} (${macAddress}) at ${ipAddress}`,
    );
  }

  /**
   * Map database model to DTO
   */
  private mapToStatusDto(operation: any): PumpStatusDto {
    const now = new Date();
    const elapsed = Math.floor(
      (now.getTime() - operation.startedAt.getTime()) / 1000,
    );
    const remainingTime = Math.max(0, operation.duration - elapsed);
    const estimatedEndTime = new Date(
      operation.startedAt.getTime() + operation.duration * 1000,
    );

    return {
      id: operation.id,
      greenhouseId: operation.greenhouseId,
      isActive: operation.status === 'active',
      remainingTime: operation.status === 'active' ? remainingTime : undefined,
      targetWaterAmount: operation.waterAmount,
      startedAt: operation.startedAt,
      estimatedEndTime:
        operation.status === 'active' ? estimatedEndTime : undefined,
      reason: operation.reason,
    };
  }

  /**
   * SIMPLIFIED API METHODS - Direct device control by IP
   */

  /**
   * Activate pump using device IP directly
   */
  async activatePumpByIp(
    activateDto: SimpleActivatePumpDto,
  ): Promise<SimpleDeviceStatusDto> {
    const { deviceIp, duration, waterAmount, reason } = activateDto;

    try {
      // Send activation command directly to ESP32
      const response = await axios.post(
        `http://${deviceIp}:8080/pump/activate`,
        {
          duration,
          volume: waterAmount,
        },
        { timeout: 5000 },
      );

      if (response.status !== 200) {
        throw new BadRequestException('Failed to communicate with device');
      }

      // Return status without requiring database storage
      return {
        deviceIp,
        deviceName: `Device-${deviceIp.split('.').pop()}`,
        isActive: true,
        remainingTime: duration,
        targetWaterAmount: waterAmount,
        startedAt: new Date(),
        lastUpdate: new Date(),
      };
    } catch (error) {
      this.logger.error(
        `Failed to activate pump at ${deviceIp}:`,
        error.message,
      );
      throw new BadRequestException(
        `Failed to communicate with device at ${deviceIp}. Make sure the device is online and accessible.`,
      );
    }
  }

  /**
   * Get device status by IP
   */
  async getDeviceStatusByIp(deviceIp: string): Promise<SimpleDeviceStatusDto> {
    try {
      const response = await axios.get(`http://${deviceIp}:8080/pump/status`, {
        timeout: 5000,
      });

      const deviceStatus = response.data;

      return {
        deviceIp,
        deviceName: `Device-${deviceIp.split('.').pop()}`,
        isActive: deviceStatus.status === 'on',
        remainingTime: deviceStatus.remaining_seconds,
        targetWaterAmount: deviceStatus.target_volume,
        currentWaterAmount: deviceStatus.current_volume,
        startedAt: deviceStatus.start_time
          ? new Date(deviceStatus.start_time)
          : undefined,
        lastUpdate: new Date(),
      };
    } catch (error) {
      this.logger.error(
        `Failed to get status from ${deviceIp}:`,
        error.message,
      );
      throw new NotFoundException(
        `Device at ${deviceIp} is not responding. Check if the device is online.`,
      );
    }
  }

  /**
   * Stop pump by device IP
   */
  async stopPumpByIp(deviceIp: string): Promise<void> {
    try {
      const response = await axios.post(
        `http://${deviceIp}:8080/pump/deactivate`,
        {},
        { timeout: 5000 },
      );

      if (response.status !== 200) {
        throw new BadRequestException('Failed to stop pump');
      }
    } catch (error) {
      this.logger.error(`Failed to stop pump at ${deviceIp}:`, error.message);
      throw new BadRequestException(
        `Failed to communicate with device at ${deviceIp}`,
      );
    }
  }

  /**
   * Save device configuration (stored in localStorage on frontend)
   * This method is just for API consistency, actual storage happens on frontend
   */
  async saveDeviceConfig(configDto: DeviceConfigDto): Promise<DeviceConfigDto> {
    // In the simplified version, we just validate the IP is reachable
    try {
      await axios.get(`http://${configDto.deviceIp}:8080/pump/status`, {
        timeout: 3000,
      });

      return configDto;
    } catch (error) {
      throw new BadRequestException(
        `Cannot reach device at ${configDto.deviceIp}. Please check the IP address and ensure the device is online.`,
      );
    }
  }
}
