import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  IsUUID,
  IsIP,
} from 'class-validator';

export class ActivatePumpDto {
  @IsNotEmpty()
  @IsUUID()
  greenhouseId: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  duration: number; // Duration in seconds

  @IsOptional()
  @IsNumber()
  @Min(0.1)
  waterAmount?: number; // Water amount in liters (optional)

  @IsOptional()
  @IsString()
  reason?: string; // Reason for activation (manual, automatic, etc.)
}

export class PumpStatusDto {
  id: string;
  greenhouseId: string;
  isActive: boolean;
  remainingTime?: number; // Remaining time in seconds
  targetWaterAmount?: number;
  currentWaterAmount?: number;
  startedAt?: Date;
  estimatedEndTime?: Date;
  reason?: string;
}

export class PumpHistoryDto {
  id: string;
  greenhouseId: string;
  duration: number;
  waterAmount?: number;
  reason?: string;
  startedAt: Date;
  endedAt?: Date;
  status: 'active' | 'completed' | 'cancelled' | 'error';
  errorMessage?: string;
}

// Simplified DTOs for IP-based control
export class SimpleActivatePumpDto {
  @IsNotEmpty()
  @IsIP()
  deviceIp: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  duration: number; // Duration in seconds

  @IsOptional()
  @IsNumber()
  @Min(0.1)
  waterAmount?: number; // Water amount in liters (optional)

  @IsOptional()
  @IsString()
  reason?: string; // Reason for activation
}

export class DeviceConfigDto {
  @IsNotEmpty()
  @IsString()
  deviceName: string;

  @IsNotEmpty()
  @IsIP()
  deviceIp: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class SimpleDeviceStatusDto {
  deviceIp: string;
  deviceName: string;
  isActive: boolean;
  remainingTime?: number;
  targetWaterAmount?: number;
  currentWaterAmount?: number;
  startedAt?: Date;
  lastUpdate: Date;
}
