import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  CreateGreenhouseDto,
  UpdateGreenhouseDto,
  GreenhouseConfigurationDto,
  SensorDataDto,
  QRCodeResponseDto,
} from './dto/greenhouse.dto';
import { Greenhouse, GreenhouseSensorReading, User } from '@prisma/client';
import * as crypto from 'crypto';
import * as QRCode from 'qrcode';

interface Alert {
  type: 'warning' | 'critical';
  message: string;
  timestamp: Date;
}

export interface GreenhouseWithDetails extends Greenhouse {
  owner: User;
  _count: {
    sensorReadings: number;
  };
  latestReading?: GreenhouseSensorReading;
  sensorReadings?: GreenhouseSensorReading[];
}

@Injectable()
export class GreenhouseService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new greenhouse for a user
   */
  async create(
    userId: string,
    createGreenhouseDto: CreateGreenhouseDto,
  ): Promise<Greenhouse> {
    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Encrypt WiFi password if provided
    let encryptedWifiPassword: string | undefined;
    if (createGreenhouseDto.wifiPassword) {
      encryptedWifiPassword = this.encryptPassword(
        createGreenhouseDto.wifiPassword,
      );
    }

    return this.prisma.greenhouse.create({
      data: {
        name: createGreenhouseDto.name,
        description: createGreenhouseDto.description,
        location: createGreenhouseDto.location,
        ownerId: userId,
        targetTemperature: createGreenhouseDto.targetTemperature || 25.0,
        targetHumidity: createGreenhouseDto.targetHumidity || 60.0,
        targetSoilMoisture: createGreenhouseDto.targetSoilMoisture || 50,
        minWaterLevel: createGreenhouseDto.minWaterLevel || 20.0,
        wifiSSID: createGreenhouseDto.wifiSSID,
        wifiPassword: encryptedWifiPassword,
      },
    });
  }

  /**
   * Find all greenhouses for a user
   */
  async findAllByUser(userId: string): Promise<GreenhouseWithDetails[]> {
    const greenhouses = await this.prisma.greenhouse.findMany({
      where: { ownerId: userId },
      include: {
        owner: true,
        _count: {
          select: {
            sensorReadings: true,
          },
        },
        sensorReadings: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
      },
    });

    return greenhouses.map((greenhouse) => ({
      ...greenhouse,
      latestReading: greenhouse.sensorReadings[0] || undefined,
    }));
  }

  /**
   * Find a specific greenhouse by ID (with user ownership check)
   */
  async findOne(id: string, userId: string): Promise<GreenhouseWithDetails> {
    const greenhouse = await this.prisma.greenhouse.findFirst({
      where: {
        id,
        ownerId: userId,
      },
      include: {
        owner: true,
        _count: {
          select: {
            sensorReadings: true,
          },
        },
        sensorReadings: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
      },
    });

    if (!greenhouse) {
      throw new NotFoundException('Greenhouse not found or access denied');
    }

    return {
      ...greenhouse,
      latestReading: greenhouse.sensorReadings[0] || undefined,
    };
  }

  /**
   * Update greenhouse configuration
   */
  async update(
    id: string,
    userId: string,
    updateGreenhouseDto: UpdateGreenhouseDto,
  ): Promise<Greenhouse> {
    // Check ownership
    await this.findOne(id, userId);

    return this.prisma.greenhouse.update({
      where: { id },
      data: updateGreenhouseDto,
    });
  }

  /**
   * Update greenhouse location
   */
  async updateLocation(
    id: string,
    userId: string,
    data: { location: string; latitude?: number; longitude?: number },
  ): Promise<Greenhouse> {
    // Check ownership
    await this.findOne(id, userId);

    // Validate coordinates if provided
    if (
      data.latitude !== undefined &&
      (data.latitude < -90 || data.latitude > 90)
    ) {
      throw new BadRequestException('Latitude inválida');
    }
    if (
      data.longitude !== undefined &&
      (data.longitude < -180 || data.longitude > 180)
    ) {
      throw new BadRequestException('Longitude inválida');
    }

    return this.prisma.greenhouse.update({
      where: { id },
      data: {
        location: data.location,
        latitude: data.latitude,
        longitude: data.longitude,
      },
    });
  }

  /**
   * Delete a greenhouse
   */
  async remove(id: string, userId: string): Promise<void> {
    // Check ownership
    await this.findOne(id, userId);

    await this.prisma.greenhouse.delete({
      where: { id },
    });
  }

  /**
   * Generate QR code for ESP32 configuration
   */
  async generateQRCode(id: string, userId: string): Promise<QRCodeResponseDto> {
    const greenhouse = await this.findOne(id, userId);

    if (!greenhouse.wifiSSID || !greenhouse.wifiPassword) {
      throw new BadRequestException(
        'WiFi credentials not configured for this greenhouse',
      );
    }

    // Generate configuration token
    const configToken = crypto.randomBytes(32).toString('hex');

    // Decrypt WiFi password
    const wifiPassword = this.decryptPassword(greenhouse.wifiPassword);

    // Create QR code payload
    const qrPayload = {
      type: 'greenhouse_config',
      version: '1.0',
      greenhouseId: greenhouse.id,
      configToken,
      wifiSSID: greenhouse.wifiSSID,
      wifiPassword,
      serverURL: process.env.API_BASE_URL || 'http://localhost:3001',
      timestamp: new Date().toISOString(),
    };

    // Generate QR code data URL
    const qrCodeData = await QRCode.toDataURL(JSON.stringify(qrPayload), {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 256,
    });

    // Update greenhouse with QR code info
    await this.prisma.greenhouse.update({
      where: { id },
      data: {
        qrCodeData: JSON.stringify(qrPayload),
        qrCodeGeneratedAt: new Date(),
      },
    });

    return {
      qrCodeData,
      wifiSSID: greenhouse.wifiSSID,
      serverURL: qrPayload.serverURL,
      greenhouseId: greenhouse.id,
      configToken,
    };
  }

  /**
   * Configure greenhouse via QR code scan
   */
  async configureFromQR(
    configurationDto: GreenhouseConfigurationDto,
  ): Promise<Greenhouse> {
    const greenhouse = await this.prisma.greenhouse.findUnique({
      where: { id: configurationDto.greenhouseId },
    });

    if (!greenhouse) {
      throw new NotFoundException('Greenhouse not found');
    }

    // Validate QR code data (basic check)
    if (!greenhouse.qrCodeData) {
      throw new BadRequestException(
        'No QR code configuration found for this greenhouse',
      );
    }

    // Update greenhouse configuration status
    const updatedGreenhouse = await this.prisma.greenhouse.update({
      where: { id: configurationDto.greenhouseId },
      data: {
        isConfigured: true,
        isOnline: true,
        lastDataUpdate: new Date(),
      },
    });

    return updatedGreenhouse;
  }

  /**
   * Receive sensor data from ESP32
   */
  async receiveSensorData(
    sensorDataDto: SensorDataDto,
  ): Promise<GreenhouseSensorReading> {
    // Validate greenhouse exists and is configured
    const greenhouse = await this.prisma.greenhouse.findUnique({
      where: { id: sensorDataDto.greenhouseId },
    });

    if (!greenhouse) {
      throw new NotFoundException('Greenhouse not found');
    }

    if (!greenhouse.isConfigured) {
      throw new BadRequestException('Greenhouse not configured yet');
    }

    // Create sensor reading with only the fields that exist in the schema
    const sensorReading = await this.prisma.greenhouseSensorReading.create({
      data: {
        greenhouseId: sensorDataDto.greenhouseId,
        airTemperature: sensorDataDto.airTemperature,
        airHumidity: sensorDataDto.airHumidity,
        soilMoisture: sensorDataDto.soilMoisture,
        soilTemperature:
          sensorDataDto.soilTemperature ?? sensorDataDto.airTemperature, // Fallback to air temp if not provided
      },
    });

    // Update greenhouse current values and online status
    await this.prisma.greenhouse.update({
      where: { id: sensorDataDto.greenhouseId },
      data: {
        currentTemperature: sensorDataDto.airTemperature,
        currentHumidity: sensorDataDto.airHumidity,
        currentSoilMoisture: sensorDataDto.soilMoisture,
        isOnline: true,
        lastDataUpdate: new Date(),
      },
    });

    // Irrigation detection will be handled by the IrrigationService
    // when sensor data is processed through the sensor endpoint

    return sensorReading;
  }

  /**
   * Get sensor history for a greenhouse
   */
  async getSensorHistory(
    id: string,
    userId: string,
    hours: number = 24,
  ): Promise<GreenhouseSensorReading[]> {
    // Check ownership
    await this.findOne(id, userId);

    const fromDate = new Date();
    fromDate.setHours(fromDate.getHours() - hours);

    return this.prisma.greenhouseSensorReading.findMany({
      where: {
        greenhouseId: id,
        timestamp: {
          gte: fromDate,
        },
      },
      orderBy: { timestamp: 'desc' },
      take: 1000, // Limit to prevent large queries
    });
  }

  /**
   * Get real-time greenhouse status
   */
  async getRealtimeStatus(id: string, userId: string) {
    const greenhouse = await this.findOne(id, userId);

    const latestReading = await this.prisma.greenhouseSensorReading.findFirst({
      where: { greenhouseId: id },
      orderBy: { timestamp: 'desc' },
    });

    return {
      greenhouse: {
        id: greenhouse.id,
        name: greenhouse.name,
        isOnline: greenhouse.isOnline,
        isConfigured: greenhouse.isConfigured,
        lastDataUpdate: greenhouse.lastDataUpdate,
      },
      currentConditions: latestReading,
      targets: {
        temperature: greenhouse.targetTemperature,
        humidity: greenhouse.targetHumidity,
        soilMoisture: greenhouse.targetSoilMoisture,
      },
      alerts: await this.checkAlerts(greenhouse, latestReading || undefined),
    };
  }
  /**
   * Check for environmental alerts
   */
  private async checkAlerts(
    greenhouse: Greenhouse,
    latestReading?: GreenhouseSensorReading,
  ): Promise<Alert[]> {
    const alerts: Alert[] = [];

    if (!latestReading) {
      alerts.push({
        type: 'warning',
        message: 'No recent sensor data received',
        timestamp: new Date(),
      });
      return alerts;
    }

    // Temperature alerts
    if (latestReading.airTemperature > greenhouse.targetTemperature + 5) {
      alerts.push({
        type: 'critical',
        message: `Temperature too high: ${latestReading.airTemperature}°C`,
        timestamp: latestReading.timestamp,
      });
    } else if (
      latestReading.airTemperature <
      greenhouse.targetTemperature - 5
    ) {
      alerts.push({
        type: 'warning',
        message: `Temperature too low: ${latestReading.airTemperature}°C`,
        timestamp: latestReading.timestamp,
      });
    }

    // Humidity alerts
    if (latestReading.airHumidity > greenhouse.targetHumidity + 20) {
      alerts.push({
        type: 'warning',
        message: `Humidity too high: ${latestReading.airHumidity}%`,
        timestamp: latestReading.timestamp,
      });
    } else if (latestReading.airHumidity < greenhouse.targetHumidity - 20) {
      alerts.push({
        type: 'warning',
        message: `Humidity too low: ${latestReading.airHumidity}%`,
        timestamp: latestReading.timestamp,
      });
    }

    // Soil moisture alerts
    if (latestReading.soilMoisture < greenhouse.targetSoilMoisture - 20) {
      alerts.push({
        type: 'warning',
        message: `Soil moisture low: ${latestReading.soilMoisture}%`,
        timestamp: latestReading.timestamp,
      });
    }

    return alerts;
  }
  /**
   * Encrypt WiFi password for storage
   */
  private encryptPassword(password: string): string {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(
      process.env.ENCRYPTION_KEY || 'default-key',
      'salt',
      32,
    );
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(password, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return `${iv.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypt WiFi password for use
   */
  private decryptPassword(encryptedPassword: string): string {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(
      process.env.ENCRYPTION_KEY || 'default-key',
      'salt',
      32,
    );

    const [ivHex, encrypted] = encryptedPassword.split(':');
    const iv = Buffer.from(ivHex, 'hex');

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
