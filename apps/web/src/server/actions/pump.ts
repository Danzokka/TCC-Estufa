"use server";

import api from "@/lib/api";
import { revalidateTag } from "next/cache";
import { AxiosError } from "axios";

export interface PumpActivationParams {
  greenhouseId: string;
  duration?: number; // em segundos
  waterAmount?: number; // em mililitros
  notes?: string;
}

export interface PumpStatus {
  id: string;
  greenhouseId: string;
  isActive: boolean;
  remainingTime?: number;
  targetWaterAmount?: number;
  currentWaterAmount?: number;
  startTime?: Date;
  endTime?: Date;
  notes?: string;
  deviceStatus: "online" | "offline" | "error";
  lastUpdate: Date;
}

export interface PumpOperation {
  id: string;
  greenhouseId: string;
  deviceId: string;
  operationType: "time_based" | "quantity_based";
  targetDuration?: number;
  targetWaterAmount?: number;
  actualDuration?: number;
  actualWaterAmount?: number;
  status: "pending" | "active" | "completed" | "failed" | "cancelled";
  startedAt?: Date;
  completedAt?: Date;
  notes?: string;
  errorMessage?: string;
}

export interface DeviceRegistration {
  id: string;
  deviceId: string;
  name: string;
  greenhouseId: string;
  ipAddress: string;
  description?: string;
  isActive: boolean;
  lastSeen?: Date;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    return error.response?.data?.message || error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Erro desconhecido";
}

/**
 * Ativa a bomba d'água com parâmetros específicos
 */
export async function activatePump(params: PumpActivationParams): Promise<{
  success: boolean;
  operationId?: string;
  message: string;
  data?: PumpOperation;
}> {
  try {
    const response = await api.post("/pump/activate", params);

    // Revalidate pump status cache
    revalidateTag(`pump-status-${params.greenhouseId}`);
    revalidateTag("pump-operations");

    return {
      success: true,
      operationId: response.data.id,
      message: "Bomba ativada com sucesso",
      data: response.data,
    };
  } catch (error: unknown) {
    console.error("Erro ao ativar bomba:", error);

    return {
      success: false,
      message: getErrorMessage(error),
    };
  }
}

/**
 * Obtém o status atual da bomba para uma estufa
 */
export async function getPumpStatus(greenhouseId: string): Promise<{
  success: boolean;
  data?: PumpStatus;
  message?: string;
}> {
  try {
    const response = await api.get(`/pump/status/${greenhouseId}`);

    return {
      success: true,
      data: response.data,
    };
  } catch (error: unknown) {
    console.error("Erro ao obter status da bomba:", error);

    return {
      success: false,
      message: getErrorMessage(error),
    };
  }
}

/**
 * Para a bomba d'água em execução
 */
export async function stopPump(greenhouseId: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    await api.post(`/pump/stop`, { greenhouseId });

    // Revalidate pump status cache
    revalidateTag(`pump-status-${greenhouseId}`);
    revalidateTag("pump-operations");

    return {
      success: true,
      message: "Bomba parada com sucesso",
    };
  } catch (error: unknown) {
    console.error("Erro ao parar bomba:", error);

    return {
      success: false,
      message: getErrorMessage(error),
    };
  }
}

/**
 * Obtém o histórico de operações da bomba
 */
export async function getPumpHistory(
  greenhouseId: string,
  page: number = 1,
  limit: number = 10
): Promise<{
  success: boolean;
  data?: {
    operations: PumpOperation[];
    total: number;
    page: number;
    totalPages: number;
  };
  message?: string;
}> {
  try {
    const response = await api.get(`/pump/history/${greenhouseId}`, {
      params: { page, limit },
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error: unknown) {
    console.error("Erro ao obter histórico da bomba:", error);

    return {
      success: false,
      message: getErrorMessage(error),
    };
  }
}

/**
 * Registra um novo dispositivo ESP32 no sistema
 */
export async function registerPumpDevice(deviceData: {
  deviceId: string;
  name: string;
  greenhouseId: string;
  ipAddress: string;
  description?: string;
}): Promise<{
  success: boolean;
  message: string;
  data?: DeviceRegistration;
}> {
  try {
    const response = await api.post("/pump/device/register", deviceData);

    // Revalidate device list cache
    revalidateTag("pump-devices");

    return {
      success: true,
      message: "Dispositivo registrado com sucesso",
      data: response.data,
    };
  } catch (error: unknown) {
    console.error("Erro ao registrar dispositivo:", error);

    return {
      success: false,
      message: getErrorMessage(error),
    };
  }
}
