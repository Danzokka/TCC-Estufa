"use server";

import { revalidatePath } from "next/cache";
import api from "@/lib/api";

/**
 * Server Action para obter irrigações
 */
export async function getIrrigations(filters?: {
  greenhouseId?: string;
  type?: string;
  limit?: number;
}) {
  try {
    const params = new URLSearchParams();
    if (filters?.greenhouseId)
      params.append("greenhouseId", filters.greenhouseId);
    if (filters?.type) params.append("type", filters.type);
    // Evita enviar limit para não quebrar validação do backend

    console.log("🔍 Buscando irrigações com filtros:", filters);
    console.log("📡 URL:", `/irrigation?${params.toString()}`);

    const response = await api.get(`/irrigation?${params.toString()}`);

    const payload = response.data?.data ?? response.data;

    console.log("✅ Dados recebidos:", payload);
    return payload;
  } catch (error: any) {
    console.error("❌ Erro ao buscar irrigações:", error);
    console.error("❌ Status:", error.response?.status);
    console.error("❌ Data:", error.response?.data);
    return { irrigations: [], total: 0, hasMore: false };
  }
}

/**
 * Server Action para obter irrigação específica por ID
 */
export async function getIrrigationById(id: string) {
  try {
    const response = await api.get(`/irrigation/${id}`);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching irrigation data:", error);
    return { success: false, message: "Falha ao carregar dados da irrigação" };
  }
}

/**
 * Server Action para criar nova irrigação
 */
export async function createIrrigation(irrigationData: {
  greenhouseId: string;
  type?: string;
  waterAmount?: number;
  notes?: string;
  userId?: string;
}) {
  try {
    const response = await fetch(`${API_BASE_URL}/test-irrigation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(irrigationData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || `Backend responded with status: ${response.status}`
      );
    }

    revalidatePath("/dashboard/irrigation");
    return await response.json();
  } catch (error) {
    console.error("Error creating irrigation:", error);
    throw new Error("Falha ao criar irrigação");
  }
}

/**
 * Server Action para confirmar irrigação
 */
export async function confirmIrrigation(
  irrigationId: string,
  confirmationData: {
    type?: string;
    waterAmount?: number;
    notes?: string;
    userId?: string;
  }
) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/irrigation/${irrigationId}/confirm`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(confirmationData),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Backend error:", errorData);
      return {
        success: false,
        message:
          errorData.message ||
          `Erro ${response.status}: Falha ao confirmar irrigação`,
      };
    }

    const result = await response.json();

    revalidatePath("/dashboard/irrigation");
    revalidatePath(`/dashboard/irrigation/confirm/${irrigationId}`);

    return result;
  } catch (error) {
    console.error("Error confirming irrigation:", error);
    return { success: false, message: "Falha ao confirmar irrigação" };
  }
}

/**
 * Server Action para obter estatísticas de irrigação
 */
export async function getIrrigationStats(filters?: {
  greenhouseId?: string;
  period?: "day" | "week" | "month" | "year" | "all";
}) {
  try {
    const params = new URLSearchParams();
    if (filters?.greenhouseId)
      params.append("greenhouseId", filters.greenhouseId);
    if (filters?.period) params.append("period", filters.period);

    console.log("📊 Buscando estatísticas de irrigação com filtros:", filters);

    const response = await api.get(
      `/irrigation/stats/overview?${params.toString()}`
    );

    const payload = response.data?.data ?? response.data;

    console.log("✅ Estatísticas recebidas:", payload);
    return payload;
  } catch (error: any) {
    console.error("❌ Erro ao buscar estatísticas:", error);
    console.error("❌ Status:", error.response?.status);
    console.error("❌ Data:", error.response?.data);
    return {
      period: filters?.period || "week",
      totalIrrigations: 0,
      totalWaterMl: 0,
      totalWaterLiters: "0.00",
      byType: [],
      recentIrrigations: [],
      pumpFlowRate: { mlPerSecond: 40, description: "40ml por segundo" },
    };
  }
}

export interface IrrigationHistoryItem {
  id: string;
  type: string;
  volumeMl: number;
  durationSeconds: number;
  timestamp: string;
  date: string;
}

export interface DailySummary {
  date: string;
  count: number;
  totalVolumeMl: number;
}

export interface IrrigationHistoryData {
  period: string;
  history: IrrigationHistoryItem[];
  dailySummary: DailySummary[];
  totalCount: number;
  totalVolumeMl: number;
}

/**
 * Server Action para obter histórico de irrigação para gráfico
 */
export async function getIrrigationHistory(filters?: {
  greenhouseId?: string;
  period?: "day" | "week" | "month" | "year" | "all";
}): Promise<IrrigationHistoryData> {
  try {
    const params = new URLSearchParams();
    if (filters?.greenhouseId)
      params.append("greenhouseId", filters.greenhouseId);
    if (filters?.period) params.append("period", filters.period);

    console.log("📈 Buscando histórico de irrigação:", filters);

    const response = await api.get(
      `/irrigation/stats/history?${params.toString()}`
    );

    const payload = response.data?.data ?? response.data;

    console.log("✅ Histórico recebido:", payload);
    return payload;
  } catch (error: any) {
    console.error("❌ Erro ao buscar histórico:", error);
    return {
      period: filters?.period || "week",
      history: [],
      dailySummary: [],
      totalCount: 0,
      totalVolumeMl: 0,
    };
  }
}
