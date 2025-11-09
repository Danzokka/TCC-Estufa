import { IsNumber, IsString, IsNotEmpty, Min, Max } from 'class-validator';

/**
 * DTO para recebimento de dados de sensores enviados pelo ESP32.
 * Versão simplificada (v2) mantendo apenas 4 sensores reais:
 *  - air_temperature (DHT22)
 *  - air_humidity (DHT22)
 *  - soil_temperature (sensor de solo)
 *  - soil_moisture (sensor de umidade de solo)
 */
export class CreateSensorDataDto {
  @IsNumber()
  @Min(-10)
  @Max(50)
  air_temperature: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  air_humidity: number;

  @IsNumber()
  @Min(-10)
  @Max(50)
  soil_temperature: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  soil_moisture: number;

  @IsString()
  @IsNotEmpty()
  userPlant: string;
}
