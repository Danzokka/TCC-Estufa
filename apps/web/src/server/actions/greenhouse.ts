"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import api from "@/lib/api";

export interface IBGEMunicipio {
  id: number;
  nome: string;
  uf: string;
  estado: string;
  formatted: string;
}

export interface UpdateLocationData {
  greenhouseId: string;
  location: string;
}

export interface ForecastData {
  id: string;
  date: string;
  maxTemp: number;
  minTemp: number;
  avgTemp: number;
  avgHumidity: number;
  totalPrecip: number;
  condition: string;
}

/**
 * Busca dados de uma estufa específica
 */
export async function getGreenhouseById(greenhouseId: string): Promise<{
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  isOnline: boolean;
} | null> {
  try {
    console.log(`Buscando estufa com ID: ${greenhouseId}`);
    const response = await api.get(`/greenhouses/${greenhouseId}`);
    console.log(`Dados da estufa:`, response.data);
    
    // Verificar se os dados estão corretos
    if (!response.data) {
      console.warn("Resposta vazia da API");
      return null;
    }
    
    return {
      id: response.data.id,
      name: response.data.name,
      description: response.data.description,
      location: response.data.location,
      latitude: response.data.latitude,
      longitude: response.data.longitude,
      isOnline: response.data.isOnline,
    };
  } catch (error: any) {
    console.error("Erro ao buscar estufa:", error);
    console.error("Status:", error.response?.status);
    console.error("Data:", error.response?.data);
    
    // Se for erro 404, a estufa não existe
    if (error.response?.status === 404) {
      console.warn("Estufa não encontrada");
      return null;
    }
    
    // Se for erro 401/403, problema de autenticação/autorização
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.warn("Problema de autenticação/autorização");
      return null;
    }
    
    return null;
  }
}

/**
 * Busca municípios brasileiros usando a API do IBGE
 */
export async function searchIBGECities(search: string): Promise<IBGEMunicipio[]> {
  try {
    if (!search || search.trim().length < 2) {
      return [];
    }

    const response = await api.get(`/ibge/municipios?search=${encodeURIComponent(search.trim())}`);
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar municípios:", error);
    return [];
  }
}

/**
 * Atualiza a localização de uma estufa
 */
export async function updateGreenhouseLocation(data: UpdateLocationData): Promise<{ success: boolean; message: string }> {
  try {
    await api.patch(`/greenhouses/${data.greenhouseId}/location`, {
      location: data.location,
    });

    // Revalidar páginas relacionadas
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/settings");
    
    return {
      success: true,
      message: "Localização atualizada com sucesso!",
    };
  } catch (error: any) {
    console.error("Erro ao atualizar localização:", error);
    return {
      success: false,
      message: error.response?.data?.message || error.message || "Erro desconhecido ao atualizar localização",
    };
  }
}

/**
 * Atualiza a localização de uma estufa usando coordenadas
 */
export async function updateGreenhouseLocationFromCoords(
  greenhouseId: string,
  latitude: number,
  longitude: number
): Promise<{ success: boolean; stateName?: string; latitude?: number; longitude?: number; message: string }> {
  try {
    const response = await api.post(`/greenhouses/${greenhouseId}/location/from-coords`, {
      latitude,
      longitude,
    });

    // Revalidar páginas relacionadas
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/settings");
    
    return {
      success: true,
      stateName: response.data.location,
      latitude: response.data.latitude,
      longitude: response.data.longitude,
      message: "Localização atualizada com sucesso!",
    };
  } catch (error: any) {
    console.error("Erro ao atualizar localização:", error);
    return {
      success: false,
      message: error.response?.data?.message || error.message || "Erro desconhecido",
    };
  }
}

/**
 * Busca previsão semanal (segunda a domingo) para o dashboard
 */
export async function getWeeklyForecast(greenhouseId: string): Promise<ForecastData[]> {
  try {
    const response = await api.get(`/weather/weekly/${greenhouseId}`);
    return response.data.data || [];
  } catch (error) {
    console.error("Erro ao buscar previsão semanal:", error);
    return [];
  }
}
