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
  reading_count?: number; // Quantidade de leituras agregadas neste ponto
}

export interface DashboardData {
  latest: SensorReading | null;
  history: SensorReading[];
  kpis: DashboardKPIs;
  intervalMinutes?: number; // Intervalo de agregação usado
  startDate?: string;
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
  hours?: number;
  startDate?: string;
  endDate?: string;
}

/**
 * Get dashboard data with sensor readings and KPIs
 * Usa endpoint otimizado do backend NestJS com agregação SQL
 */
export async function getDashboardData(
  plantId: string,
  filters?: DashboardFilters
): Promise<DashboardData> {
  try {
    // Construir query params para o backend
    const params = new URLSearchParams();
    if (plantId) params.append("plantId", plantId);
    if (filters?.period) params.append("period", filters.period);
    if (filters?.hours) params.append("hours", filters.hours.toString());

    // Chamar endpoint otimizado do backend
    const response = await api.get(`/sensor/dashboard?${params.toString()}`);

    if (response.data && response.data.data) {
      return response.data.data;
    }

    throw new Error("Invalid response format from backend");
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    throw new Error("Failed to fetch dashboard data");
  }
}

/**
 * Get aggregated data for charts
 * Usa endpoint otimizado com agregação SQL no backend
 */
export async function getHourlyAggregatedData(
  plantId: string,
  filters?: DashboardFilters
): Promise<SensorReading[]> {
  try {
    // Construir query params
    const params = new URLSearchParams();
    if (plantId) params.append("plantId", plantId);
    if (filters?.period) params.append("period", filters.period);
    if (filters?.hours) params.append("hours", filters.hours.toString());

    // Chamar endpoint otimizado
    const response = await api.get(`/sensor/aggregated?${params.toString()}`);

    if (response.data && response.data.data && response.data.data.data) {
      return response.data.data.data;
    }

    return [];
  } catch (error) {
    console.error("Error fetching aggregated data:", error);
    throw new Error("Failed to fetch aggregated data");
  }
}
