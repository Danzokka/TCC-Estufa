import { IsEnum, IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export enum PeriodEnum {
  TODAY = 'today',
  WEEK = 'week',
  MONTH = 'month',
}

export class GetAggregatedDataDto {
  @IsString()
  @IsOptional()
  plantId?: string;

  @IsEnum(PeriodEnum)
  @IsOptional()
  period?: PeriodEnum;

  @IsOptional()
  @Type(() => Number) // Converter para number primeiro
  @IsInt()
  @Min(1)
  @Max(720) // Máximo 30 dias em horas
  @Transform(({ value }) => (value ? parseInt(value, 10) : undefined))
  hours?: number;
}
