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
