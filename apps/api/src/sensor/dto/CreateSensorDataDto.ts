import {
  IsNumber,
  IsString,
  IsNotEmpty,
  IsOptional,
  Min,
  Max,
} from 'class-validator';

/**
 * DTO para recebimento de dados de sensores enviados pelo ESP32.
 * Versão simplificada (v2) mantendo apenas 4 sensores reais:
 *  - air_temperature (DHT22)
 *  - air_humidity (DHT22)
 *  - soil_temperature (sensor de solo)
 *  - soil_moisture (sensor de umidade de solo)
 *
 * O ESP32 envia o greenhouseId e o sistema usa a planta ativa da greenhouse.
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

  /**
   * ID da greenhouse que está enviando os dados.
   * O sistema usará a planta ativa (activeUserPlantId) da greenhouse.
   */
  @IsString()
  @IsNotEmpty()
  greenhouseId: string;

  /**
   * @deprecated Use greenhouseId instead. Mantido para compatibilidade.
   */
  @IsString()
  @IsOptional()
  userPlant?: string;
}
