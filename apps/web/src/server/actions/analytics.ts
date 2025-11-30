"use server";
import api from "@/lib/api";
import { revalidatePath } from "next/cache";

export interface Report {
  id: string;
  userPlantId: string;
  type: "weekly" | "monthly" | "general";
  startDate: string;
  endDate: string;
  totalReadings: number;
  totalIrrigations: number;
  avgGrowthRate?: number;
  summary?: string;
  aiInsights?: {
    summary: string;
    insights: Record<string, string>;
    recommendations: Array<{
      category: string;
      priority: "high" | "medium" | "low";
      description: string;
    }>;
    anomalies: Array<{
      type: string;
      description: string;
      severity: "high" | "medium" | "low";
    }>;
  };
  recommendations?: Array<{
    category: string;
    priority: "high" | "medium" | "low";
    description: string;
  }>;
  weatherSummary?: {
    daily?: Array<{
      date: string;
      maxTemp: number;
      minTemp: number;
      avgTemp: number;
      avgHumidity: number;
      totalPrecip: number;
      condition: string;
    }>;
    weekly?: Array<{
      weekNumber: number;
      startDate: string;
      endDate: string;
      avgTemp: number;
      avgHumidity: number;
      totalPrecip: number;
      dominantCondition: string;
    }>;
  };
  generatedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface GenerateReportData {
  userPlantId: string;
  type: "weekly" | "monthly" | "general";
}

export async function generateReport(
  data: GenerateReportData
): Promise<Report> {
  try {
    const response = await api.post(
      `/analytics/generate/${data.userPlantId}?type=${data.type}`
    );
    revalidatePath("/analytics");
    return response.data.data;
  } catch (error) {
    console.error("Erro ao gerar relatório:", error);
    throw new Error("Falha ao gerar relatório");
  }
}

export async function getLatestReport(
  userPlantId: string,
  type: string
): Promise<Report | null> {
  try {
    const response = await api.get(
      `/analytics/latest/${userPlantId}?type=${type}`
    );
    return response.data.data;
  } catch (error) {
    console.error("Erro ao buscar último relatório:", error);
    return null;
  }
}

export async function getReportById(reportId: string): Promise<Report | null> {
  try {
    const response = await api.get(`/analytics/report/${reportId}`);
    return response.data.data;
  } catch (error) {
    console.error("Erro ao buscar relatório:", error);
    return null;
  }
}

export async function getReportsList(
  userPlantId: string,
  type?: string
): Promise<Report[]> {
  try {
    const url = type
      ? `/analytics/reports/${userPlantId}?type=${type}`
      : `/analytics/reports/${userPlantId}`;

    const response = await api.get(url);
    return response.data.data;
  } catch (error) {
    console.error("Erro ao buscar lista de relatórios:", error);
    return [];
  }
}
