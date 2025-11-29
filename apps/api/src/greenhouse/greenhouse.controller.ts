import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  ValidationPipe,
  ParseUUIDPipe,
} from '@nestjs/common';
import { GreenhouseService } from './greenhouse.service';
import { GeocodingService } from '../geocoding/geocoding.service';
import {
  CreateGreenhouseDto,
  UpdateGreenhouseDto,
  GreenhouseConfigurationDto,
  SensorDataDto,
} from './dto/greenhouse.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { AuthGuard, RequestAuthGuard } from '../auth/guards/auth.guard';
import { ApiKeyGuard } from '../auth/api-key.guard';

@Controller('greenhouses')
export class GreenhouseController {
  constructor(
    private readonly greenhouseService: GreenhouseService,
    private readonly geocodingService: GeocodingService,
  ) {}
  /**
   * Create a new greenhouse
   */
  @Post()
  @UseGuards(AuthGuard)
  async create(
    @Request() req: RequestAuthGuard,
    @Body(ValidationPipe) createGreenhouseDto: CreateGreenhouseDto,
  ) {
    return this.greenhouseService.create(req.user.id, createGreenhouseDto);
  }
  /**
   * Get all greenhouses for the authenticated user
   */
  @Get()
  @UseGuards(AuthGuard)
  async findAll(@Request() req: RequestAuthGuard) {
    return this.greenhouseService.findAllByUser(req.user.id);
  }

  /**
   * Get specific greenhouse by ID
   */
  @Get(':id')
  @UseGuards(AuthGuard)
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: RequestAuthGuard,
  ) {
    return this.greenhouseService.findOne(id, req.user.id);
  }

  /**
   * Update greenhouse configuration
   */
  @Patch(':id')
  @UseGuards(AuthGuard)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: RequestAuthGuard,
    @Body(ValidationPipe) updateGreenhouseDto: UpdateGreenhouseDto,
  ) {
    return this.greenhouseService.update(id, req.user.id, updateGreenhouseDto);
  }

  /**
   * Update greenhouse location
   */
  @Patch(':id/location')
  @UseGuards(AuthGuard)
  async updateLocation(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: RequestAuthGuard,
    @Body(ValidationPipe) updateLocationDto: UpdateLocationDto,
  ) {
    return this.greenhouseService.updateLocation(id, req.user.id, {
      location: updateLocationDto.location,
      latitude: updateLocationDto.latitude,
      longitude: updateLocationDto.longitude,
    });
  }

  /**
   * Update greenhouse location from coordinates
   */
  @Post(':id/location/from-coords')
  @UseGuards(AuthGuard)
  async updateLocationFromCoords(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: RequestAuthGuard,
    @Body() body: { latitude: number; longitude: number },
  ) {
    const stateName = await this.geocodingService.getStateFromCoordinates(
      body.latitude,
      body.longitude,
    );

    return this.greenhouseService.updateLocation(
      id,
      req.user.id,
      {
        latitude: body.latitude,
        longitude: body.longitude,
        location: stateName,
      },
    );
  }

  /**
   * Delete greenhouse
   */
  @Delete(':id')
  @UseGuards(AuthGuard)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: RequestAuthGuard,
  ) {
    await this.greenhouseService.remove(id, req.user.id);
    return { message: 'Greenhouse deleted successfully' };
  }

  /**
   * Generate QR code for ESP32 configuration
   */
  @Post(':id/qr-code')
  @UseGuards(AuthGuard)
  async generateQRCode(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: RequestAuthGuard,
  ) {
    return this.greenhouseService.generateQRCode(id, req.user.id);
  }

  /**
   * Configure greenhouse via QR code (called by ESP32)
   */
  @Post('configure')
  @UseGuards(ApiKeyGuard)
  async configureFromQR(
    @Body(ValidationPipe) configurationDto: GreenhouseConfigurationDto,
  ) {
    const result =
      await this.greenhouseService.configureFromQR(configurationDto);
    const { wifiPassword, ...sanitizedResult } = result;
    return sanitizedResult;
  }

  /**
   * Receive sensor data from ESP32
   */
  @Post('sensor-data')
  @UseGuards(ApiKeyGuard)
  async receiveSensorData(@Body(ValidationPipe) sensorDataDto: SensorDataDto) {
    return this.greenhouseService.receiveSensorData(sensorDataDto);
  }
  /**
   * Get sensor history for a greenhouse
   */
  @Get(':id/sensor-history')
  @UseGuards(AuthGuard)
  async getSensorHistory(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: RequestAuthGuard,
    @Query('hours') hours?: string,
  ) {
    const hoursNumber = hours ? parseInt(hours, 10) : 24;
    return this.greenhouseService.getSensorHistory(
      id,
      req.user.id,
      hoursNumber,
    );
  }

  /**
   * Get real-time status for a greenhouse
   */
  @Get(':id/status')
  @UseGuards(AuthGuard)
  async getRealtimeStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: RequestAuthGuard,
  ): Promise<any> {
    return this.greenhouseService.getRealtimeStatus(id, req.user.id);
  }
}
