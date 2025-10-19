import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CreatePlantDto {
  name: string;
  description: string;
  air_temperature_initial: number;
  air_humidity_initial: number;
  soil_moisture_initial: number;
  soil_temperature_initial: number;
  light_intensity_initial: number;
  air_temperature_final: number;
  air_humidity_final: number;
  soil_moisture_final: number;
  soil_temperature_final: number;
  light_intensity_final: number;
}

export class CreateUserPlantDto {
  plantId: string;
  nickname?: string; // Tornando o nickname opcional
}

export class UpdateUserPlantDto {
  @IsString()
  @IsNotEmpty()
  nickname: string;
}

// DTO para retornar dados agregados de plantas
export interface UserPlantWithStatsDto {
  id: string;
  userId: string;
  plantId: string;
  nickname: string | null;
  dateAdded: Date;
  // Dados da planta
  plant: {
    id: string;
    name: string;
    description: string;
  };
  // Estatísticas agregadas
  stats: {
    totalReadings: number;
    daysWithPlant: number;
    lastReading: {
      date: Date | null;
      status: 'ativo' | 'inativo';
      air_temperature: number | null;
      air_humidity: number | null;
      soil_moisture: number | null;
    };
  };
}
