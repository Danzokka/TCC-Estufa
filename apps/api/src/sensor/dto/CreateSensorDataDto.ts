import { IsNumber, IsString, IsNotEmpty } from 'class-validator';

export class CreateSensorDataDto {
  @IsNumber()
  air_temperature: number;

  @IsNumber()
  air_humidity: number;

  @IsNumber()
  soil_temperature: number;

  @IsNumber()
  soil_moisture: number;

  @IsNumber()
  light_intensity: number;

  @IsNumber()
  water_level: number;

  @IsNumber()
  water_reserve: number;

  @IsString()
  @IsNotEmpty()
  userPlant: string;
}
