"use server";

import { getSession } from "./session";
import api from "@/lib/api";

export interface IrrigationFilters {
  greenhouseId?: string;
  type?: "manual" | "automatic" | "detected" | "rain";
  limit?: number;
  offset?: number;
}

export interface ConfirmIrrigationData {
  type: "manual" | "rain";
  waterAmount?: number;
  notes?: string;
}

export async function getIrrigations(filters: IrrigationFilters = {}) {
  try {
    const session = await getSession();

    if (!session.isLoggedIn) {
      throw new Error("Não autorizado");
    }

    const params = new URLSearchParams();
    if (filters.greenhouseId)
      params.append("greenhouseId", filters.greenhouseId);
    if (filters.type) params.append("type", filters.type);
    if (filters.limit) params.append("limit", filters.limit.toString());
    if (filters.offset) params.append("offset", filters.offset.toString());

    const response = await api.get(`/irrigation?${params.toString()}`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Error fetching irrigations:", error);
    throw new Error("Falha ao carregar irrigações");
  }
}

export async function confirmIrrigation(
  irrigationId: string,
  data: ConfirmIrrigationData
) {
  try {
    const session = await getSession();

    if (!session.isLoggedIn) {
      throw new Error("Não autorizado");
    }

    const response = await api.post(
      `/irrigation/${irrigationId}/confirm`,
      data
    );
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Error confirming irrigation:", error);
    throw new Error("Falha ao confirmar irrigação");
  }
}

export async function getIrrigationStats(greenhouseId?: string) {
  try {
    const session = await getSession();

    if (!session.isLoggedIn) {
      throw new Error("Não autorizado");
    }

    const params = greenhouseId ? `?greenhouseId=${greenhouseId}` : "";
    const response = await api.get(`/irrigation/stats/overview${params}`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Error fetching irrigation stats:", error);
    throw new Error("Falha ao carregar estatísticas de irrigação");
  }
}

export async function createIrrigation(data: {
  type: "manual" | "automatic" | "rain";
  waterAmount?: number;
  notes?: string;
  greenhouseId: string;
  plantId?: string;
}) {
  try {
    const session = await getSession();

    if (!session.isLoggedIn) {
      throw new Error("Não autorizado");
    }

    const response = await api.post("/irrigation", data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Error creating irrigation:", error);
    throw new Error("Falha ao criar irrigação");
  }
}
