import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsUUID,
  Min,
  Max,
} from 'class-validator';

export class CreateIrrigationDto {
  @IsEnum(['manual', 'automatic', 'detected', 'rain'])
  type: 'manual' | 'automatic' | 'detected' | 'rain';

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000)
  waterAmount?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsUUID()
  greenhouseId: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsUUID()
  plantId?: string;

  @IsOptional()
  @IsUUID()
  sensorId?: string;
}

export class UpdateIrrigationDto {
  @IsOptional()
  @IsEnum(['manual', 'automatic', 'detected', 'rain'])
  type?: 'manual' | 'automatic' | 'detected' | 'rain';

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000)
  waterAmount?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsUUID()
  plantId?: string;
}

export class ConfirmIrrigationDto {
  @IsEnum(['manual', 'rain'])
  type: 'manual' | 'rain';

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000)
  waterAmount?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class IrrigationFiltersDto {
  @IsOptional()
  @IsUUID()
  greenhouseId?: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsEnum(['manual', 'automatic', 'detected', 'rain'])
  type?: 'manual' | 'automatic' | 'detected' | 'rain';

  @IsOptional()
  startDate?: Date;

  @IsOptional()
  endDate?: Date;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  offset?: number;
}

export class IrrigationStatsQueryDto {
  @IsOptional()
  @IsUUID()
  greenhouseId?: string;

  @IsOptional()
  @IsEnum(['day', 'week', 'month', 'year', 'all'])
  period?: 'day' | 'week' | 'month' | 'year' | 'all';
}

/**
 * DTO for AI service to report automatic irrigation events
 * Used by the AI irrigation monitoring system
 */
export class AIIrrigationReportDto {
  @IsUUID()
  greenhouseId: string;

  @IsEnum(['success', 'failed'])
  status: 'success' | 'failed';

  @IsNumber()
  @Min(0)
  durationMs: number; // Duration in milliseconds

  @IsOptional()
  @IsNumber()
  @Min(0)
  pulseCount?: number; // Number of pulses executed

  @IsOptional()
  @IsNumber()
  @Min(0)
  moistureBefore?: number; // Soil moisture before irrigation

  @IsOptional()
  @IsNumber()
  @Min(0)
  moistureAfter?: number; // Soil moisture after irrigation (if available)

  @IsOptional()
  @IsNumber()
  @Min(0)
  targetMoisture?: number; // Target moisture level

  @IsOptional()
  @IsString()
  errorMessage?: string; // Error message if status is 'failed'

  @IsOptional()
  @IsString()
  plantType?: string; // Type of plant being irrigated

  @IsOptional()
  @IsString()
  esp32Ip?: string; // IP of the ESP32 device
}

/**
 * DTO for AI LSTM prediction notifications
 * Used when AI predicts soil will dry based on environmental conditions
 */
export class AIPredictionNotificationDto {
  @IsUUID()
  greenhouseId: string;

  @IsEnum([
    'moisture_drop',
    'temperature_rise',
    'humidity_drop',
    'optimal_conditions',
  ])
  predictionType:
    | 'moisture_drop'
    | 'temperature_rise'
    | 'humidity_drop'
    | 'optimal_conditions';

  @IsNumber()
  currentMoisture: number;

  @IsNumber()
  predictedMoisture: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  confidence: number; // Confidence percentage of the prediction

  @IsNumber()
  hoursAhead: number; // Hours in the future for this prediction

  @IsOptional()
  @IsString()
  plantType?: string;

  @IsOptional()
  @IsNumber()
  currentTemperature?: number;

  @IsOptional()
  @IsNumber()
  predictedTemperature?: number;

  @IsOptional()
  @IsNumber()
  currentHumidity?: number;

  @IsOptional()
  @IsNumber()
  predictedHumidity?: number;

  @IsOptional()
  @IsString()
  recommendation?: string;
}
