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
