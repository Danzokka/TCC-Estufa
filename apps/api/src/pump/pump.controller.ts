import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PumpService } from './pump.service';
import { ActivatePumpDto, PumpStatusDto, PumpHistoryDto } from './dto/pump.dto';

@Controller('pump')
export class PumpController {
  constructor(private readonly pumpService: PumpService) {}

  /**
   * Activate water pump
   * POST /pump/activate
   */ @Post('activate')
  async activatePump(@Body() activatePumpDto: ActivatePumpDto): Promise<{
    success: boolean;
    message: string;
    data?: PumpStatusDto;
  }> {
    try {
      const result = await this.pumpService.activatePump(activatePumpDto);
      return {
        success: true,
        message: 'Pump activated successfully',
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to activate pump',
      };
    }
  }

  /**
   * Get pump status for a greenhouse
   * GET /pump/status/:greenhouseId
   */
  @Get('status/:greenhouseId')
  async getPumpStatus(@Param('greenhouseId') greenhouseId: string): Promise<{
    success: boolean;
    message: string;
    data: PumpStatusDto | null;
  }> {
    try {
      const status = await this.pumpService.getPumpStatus(greenhouseId);
      return {
        success: true,
        message: status ? 'Pump status retrieved' : 'No active pump operation',
        data: status,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to get pump status',
        data: null,
      };
    }
  }

  /**
   * Stop/cancel pump operation
   * DELETE /pump/stop/:greenhouseId
   */ @Delete('stop/:greenhouseId')
  async stopPump(@Param('greenhouseId') greenhouseId: string): Promise<{
    success: boolean;
    message: string;
    data?: PumpStatusDto;
  }> {
    try {
      const result = await this.pumpService.stopPump(greenhouseId);
      return {
        success: true,
        message: 'Pump stopped successfully',
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to stop pump',
      };
    }
  }

  /**
   * Get pump operation history
   * GET /pump/history/:greenhouseId
   */
  @Get('history/:greenhouseId')
  async getPumpHistory(
    @Param('greenhouseId') greenhouseId: string,
    @Query('limit') limit?: string,
  ): Promise<{
    success: boolean;
    message: string;
    data: PumpHistoryDto[];
  }> {
    try {
      const limitNum = limit ? parseInt(limit, 10) : 50;
      const history = await this.pumpService.getPumpHistory(
        greenhouseId,
        limitNum,
      );
      return {
        success: true,
        message: 'Pump history retrieved successfully',
        data: history,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to get pump history',
        data: [],
      };
    }
  }

  /**
   * ESP32 device registration endpoint
   * POST /pump/register-device
   */
  @Post('register-device')
  async registerDevice(
    @Body()
    deviceInfo: {
      name: string;
      greenhouseId: string;
      ipAddress: string;
      macAddress: string;
      firmwareVersion?: string;
    },
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      await this.pumpService.registerDevice(deviceInfo);
      return {
        success: true,
        message: 'Device registered successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to register device',
      };
    }
  }
  /**
   * ESP32 status update endpoint (called by ESP32 when operation completes)
   * POST /pump/update-status
   */
  @Post('update-status')
  async updatePumpStatus(
    @Body()
    statusUpdate: {
      operationId: string;
      status: 'completed' | 'error';
      errorMessage?: string;
    },
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      await this.pumpService.updatePumpStatus(
        statusUpdate.operationId,
        statusUpdate.status,
        statusUpdate.errorMessage,
      );
      return {
        success: true,
        message: 'Status updated successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to update status',
      };
    }
  }

  /**
   * ESP32 device status endpoint (called by ESP32 periodically to report device status)
   * POST /pump/esp32-status
   */
  @Post('esp32-status')
  async receiveDeviceStatus(
    @Body()
    deviceStatus: {
      type: string;
      status: string;
      runtime_seconds?: number;
      volume_liters?: number;
      device_id: string;
    },
  ): Promise<{
    success: boolean;
    message: string;
    timestamp: string;
  }> {
    try {
      // Log the device status for monitoring
      console.log('ESP32 Device Status Update:', {
        deviceId: deviceStatus.device_id,
        type: deviceStatus.type,
        status: deviceStatus.status,
        runtime: deviceStatus.runtime_seconds,
        volume: deviceStatus.volume_liters,
        timestamp: new Date().toISOString(),
      });

      // In a production system, you might want to:
      // 1. Validate the device_id against registered devices
      // 2. Store the status in the database
      // 3. Trigger alerts if status indicates problems
      // 4. Update device last_seen timestamp

      return {
        success: true,
        message: 'Device status received successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error processing ESP32 status:', error);
      return {
        success: false,
        message: error.message || 'Failed to process device status',
        timestamp: new Date().toISOString(),
      };
    }
  }
}
