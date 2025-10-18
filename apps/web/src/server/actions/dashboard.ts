"use server";

import api from "@/lib/api";

export interface SensorReading {
  id: string;
  air_temperature: number;
  air_humidity: number;
  soil_temperature: number;
  soil_moisture: number;
  light_intensity: number;
  water_level: number;
  water_reserve: number;
  timecreated: string;
}

export interface DashboardData {
  latest: SensorReading | null;
  history: SensorReading[];
  kpis: DashboardKPIs;
}

export interface DashboardKPIs {
  avgTemperature: number;
  avgHumidity: number;
  avgSoilMoisture: number;
  avgWaterLevel: number;
  maxTemperature: number;
  minTemperature: number;
  maxHumidity: number;
  minHumidity: number;
  totalReadings: number;
  lastUpdated: string | null;
}

export interface DashboardFilters {
  plantId?: string;
  period: "today" | "week" | "month";
  startDate?: string;
  endDate?: string;
}

/**
 * Get dashboard data with sensor readings and KPIs
 */
export async function getDashboardData(
  plantId: string,
  filters?: DashboardFilters
): Promise<DashboardData> {
  try {
    // Get latest sensor reading
    const latestResponse = await api.get(`/sensor`);
    const allReadings = latestResponse.data.data as SensorReading[];

    // Filter by plant if needed
    const plantReadings = plantId
      ? allReadings.filter((r: any) => r.userPlantId === plantId)
      : allReadings;

    const latest = plantReadings[0] || null;

    // Get sensor history based on filters
    const history = await getSensorHistory(plantId, filters);

    // Calculate KPIs
    const kpis = calculateKPIs(history, latest);

    return {
      latest,
      history,
      kpis,
    };
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    throw new Error("Failed to fetch dashboard data");
  }
}

/**
 * Get sensor history for a specific period
 */
export async function getSensorHistory(
  plantId: string,
  filters?: DashboardFilters
): Promise<SensorReading[]> {
  try {
    const response = await api.get(`/sensor`);
    const allReadings = response.data.data as SensorReading[];

    // Filter by plant
    let readings = plantId
      ? allReadings.filter((r: any) => r.userPlantId === plantId)
      : allReadings;

    // Apply time filters
    if (filters?.period) {
      const now = new Date();
      let startDate = new Date();

      switch (filters.period) {
        case "today":
          startDate.setHours(0, 0, 0, 0);
          break;
        case "week":
          startDate.setDate(now.getDate() - 7);
          break;
        case "month":
          startDate.setMonth(now.getMonth() - 1);
          break;
      }

      readings = readings.filter((r) => {
        const readingDate = new Date(r.timecreated);
        return readingDate >= startDate;
      });
    }

    // Sort by date descending
    readings.sort(
      (a, b) =>
        new Date(b.timecreated).getTime() - new Date(a.timecreated).getTime()
    );

    return readings;
  } catch (error) {
    console.error("Error fetching sensor history:", error);
    throw new Error("Failed to fetch sensor history");
  }
}

/**
 * Calculate KPIs from sensor readings
 */
function calculateKPIs(
  readings: SensorReading[],
  latest: SensorReading | null
): DashboardKPIs {
  if (readings.length === 0) {
    return {
      avgTemperature: latest?.air_temperature || 0,
      avgHumidity: latest?.air_humidity || 0,
      avgSoilMoisture: latest?.soil_moisture || 0,
      avgWaterLevel: latest?.water_level || 0,
      maxTemperature: latest?.air_temperature || 0,
      minTemperature: latest?.air_temperature || 0,
      maxHumidity: latest?.air_humidity || 0,
      minHumidity: latest?.air_humidity || 0,
      totalReadings: 0,
      lastUpdated: latest?.timecreated || null,
    };
  }

  const temperatures = readings.map((r) => r.air_temperature);
  const humidities = readings.map((r) => r.air_humidity);
  const soilMoistures = readings.map((r) => r.soil_moisture);
  const waterLevels = readings.map((r) => r.water_level);

  return {
    avgTemperature:
      temperatures.reduce((a, b) => a + b, 0) / temperatures.length,
    avgHumidity: humidities.reduce((a, b) => a + b, 0) / humidities.length,
    avgSoilMoisture:
      soilMoistures.reduce((a, b) => a + b, 0) / soilMoistures.length,
    avgWaterLevel: waterLevels.reduce((a, b) => a + b, 0) / waterLevels.length,
    maxTemperature: Math.max(...temperatures),
    minTemperature: Math.min(...temperatures),
    maxHumidity: Math.max(...humidities),
    minHumidity: Math.min(...humidities),
    totalReadings: readings.length,
    lastUpdated: readings[0]?.timecreated || null,
  };
}

/**
 * Get aggregated hourly data for charts
 */
export async function getHourlyAggregatedData(
  plantId: string,
  filters?: DashboardFilters
): Promise<SensorReading[]> {
  try {
    const readings = await getSensorHistory(plantId, filters);

    // Group by hour
    const hourlyMap = new Map<string, SensorReading[]>();

    readings.forEach((reading) => {
      const hour = new Date(reading.timecreated);
      hour.setMinutes(0, 0, 0);
      const hourKey = hour.toISOString();

      if (!hourlyMap.has(hourKey)) {
        hourlyMap.set(hourKey, []);
      }
      hourlyMap.get(hourKey)!.push(reading);
    });

    // Calculate average for each hour
    const aggregated: SensorReading[] = Array.from(hourlyMap.entries()).map(
      ([hourKey, hourReadings]) => {
        const avg = {
          id: hourKey,
          air_temperature:
            hourReadings.reduce((sum, r) => sum + r.air_temperature, 0) /
            hourReadings.length,
          air_humidity:
            hourReadings.reduce((sum, r) => sum + r.air_humidity, 0) /
            hourReadings.length,
          soil_temperature:
            hourReadings.reduce((sum, r) => sum + r.soil_temperature, 0) /
            hourReadings.length,
          soil_moisture:
            hourReadings.reduce((sum, r) => sum + r.soil_moisture, 0) /
            hourReadings.length,
          light_intensity:
            hourReadings.reduce((sum, r) => sum + r.light_intensity, 0) /
            hourReadings.length,
          water_level:
            hourReadings.reduce((sum, r) => sum + r.water_level, 0) /
            hourReadings.length,
          water_reserve:
            hourReadings.reduce((sum, r) => sum + r.water_reserve, 0) /
            hourReadings.length,
          timecreated: hourKey,
        };
        return avg;
      }
    );

    // Sort by time ascending for charts
    aggregated.sort(
      (a, b) =>
        new Date(a.timecreated).getTime() - new Date(b.timecreated).getTime()
    );

    return aggregated;
  } catch (error) {
    console.error("Error fetching hourly aggregated data:", error);
    throw new Error("Failed to fetch hourly aggregated data");
  }
}
