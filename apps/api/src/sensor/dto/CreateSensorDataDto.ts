export class CreateSensorDataDto {
  air_temperature: number;
  air_humidity: number;
  soil_temperature: number;
  soil_moisture: number;
  light_intensity: number;
  water_level: number;
  water_reserve: number;  
  userPlant: string; // Ensure this property is provided in CreateSensorDataDto
}