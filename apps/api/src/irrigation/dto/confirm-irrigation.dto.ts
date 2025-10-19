import { IsString, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class ConfirmIrrigationDto {
  @IsUUID()
  irrigationId: string;

  @IsNumber()
  @Min(0)
  waterAmount: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
