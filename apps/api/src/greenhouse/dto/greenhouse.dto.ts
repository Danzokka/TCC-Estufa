import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  Min,
  Max,
  Length,
  IsUUID,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateGreenhouseDto {
  @IsString()
  @Length(1, 100)
  name: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  description?: string;

  @IsOptional()
  @IsString()
  @Length(0, 200)
  location?: string;

  // Target configuration
  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(40)
  @Type(() => Number)
  targetTemperature?: number = 25.0;

  @IsOptional()
  @IsNumber()
  @Min(20)
  @Max(100)
  @Type(() => Number)
  targetHumidity?: number = 60.0;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  targetSoilMoisture?: number = 50;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  minWaterLevel?: number = 20.0;

  // WiFi configuration (optional for manual setup)
  @IsOptional()
  @IsString()
  @Length(1, 32)
  wifiSSID?: string;

  @IsOptional()
  @IsString()
  @Length(8, 64)
  wifiPassword?: string;
}

export class UpdateGreenhouseDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  description?: string;

  @IsOptional()
  @IsString()
  @Length(0, 200)
  location?: string;

  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(40)
  @Type(() => Number)
  targetTemperature?: number;

  @IsOptional()
  @IsNumber()
  @Min(20)
  @Max(100)
  @Type(() => Number)
  targetHumidity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  targetSoilMoisture?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  minWaterLevel?: number;
}

export class GreenhouseConfigurationDto {
  @IsUUID()
  greenhouseId: string;

  @IsString()
  @Length(1, 32)
  wifiSSID: string;

  @IsString()
  @Length(8, 64)
  wifiPassword: string;

  @IsOptional()
  @IsString()
  deviceId?: string;

  @IsOptional()
  @IsString()
  macAddress?: string;
}

export class SensorDataDto {
  @IsUUID()
  greenhouseId: string;

  @IsNumber()
  @Min(-50)
  @Max(100)
  @Type(() => Number)
  airTemperature: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  airHumidity: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  soilMoisture: number;

  @IsOptional()
  @IsNumber()
  @Min(-50)
  @Max(100)
  @Type(() => Number)
  soilTemperature?: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  lightIntensity: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  waterLevel: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  waterReserve?: number;

  @IsOptional()
  @IsString()
  deviceId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  batteryLevel?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  signalStrength?: number;
}

export class QRCodeResponseDto {
  @IsString()
  qrCodeData: string;

  @IsString()
  wifiSSID: string;

  @IsString()
  serverURL: string;

  @IsUUID()
  greenhouseId: string;

  @IsString()
  configToken: string;
}
