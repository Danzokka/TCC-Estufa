import { IsString, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class CreateIrrigationDto {
  @IsString()
  type: 'manual' | 'automatic' | 'detected';

  @IsOptional()
  @IsNumber()
  @Min(0)
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
