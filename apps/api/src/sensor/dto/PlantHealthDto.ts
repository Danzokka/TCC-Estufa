import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class PlantHealthDto {
  @IsString()
  @IsNotEmpty()
  userPlantId: string;

  @IsEnum(['High Stress', 'Moderate Stress', 'Healthy'] as const)
  healthStatus: 'High Stress' | 'Moderate Stress' | 'Healthy';

  @IsNumber()
  @Min(0)
  @Max(100)
  confidence: number; // 0-100

  @IsArray()
  @IsString({ each: true })
  recommendations: string[];

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
