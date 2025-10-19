"use server";
import api from "@/lib/api";
import { revalidatePath } from "next/cache";
import { NotificationType } from "@/data/notifications";
import { notifications } from "@/data/notifications";
import { PlantDays, PlantStats, UserPlant } from "@/@types/plant";

export async function getUserPlants(): Promise<UserPlant[]> {
  try {
    // O interceptor do Axios adicionará automaticamente o token da sessão
    const response = await api.get("/plant/userplant");
    return response.data;
  } catch (error) {
    console.error("Error fetching plant data:", error);
    throw new Error("Failed to fetch plant data");
  }
}

export async function getPlantData(plantId: string): Promise<PlantDays> {
  try {
    const response = await api.get(`/plant/data/${plantId}`);
    console.log("Plant data response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching plant data:", error);
    throw new Error("Failed to fetch plant data");
  }
}

export async function getPlantStats(plantId: string): Promise<PlantStats> {
  try {
    const response = await api.get(`/plant/stats/${plantId}`);
    console.log("Plant stats response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching plant stats:", error);
    throw new Error("Failed to fetch plant stats");
  }
}

export async function getPlantTypes(): Promise<string[]> {
  try {
    const response = await api.get("/plant/types");
    return response.data;
  } catch (error) {
    console.error("Error fetching plant types:", error);
    return [];
  }
}

/* export async function getAlerts(plantId: string) {
  try {
    const response = await api.get(`/plants/${plantId}/alerts`)
    return response.data
  } catch (error) {
    console.error("Error fetching plant alerts:", error)
    throw new Error("Failed to fetch plant alerts")
  }
}
*/

export async function getAlerts(): Promise<NotificationType[]> {
  return notifications.sort((a, b) => {
    return a.timestamp.getTime() - b.timestamp.getTime();
  });
}

export async function getNotifications(): Promise<NotificationType[]> {
  return notifications.sort((a, b) => {
    return a.timestamp.getTime() - b.timestamp.getTime();
  });
}

// New interfaces for plant management with stats
export interface PlantStatsDetailed {
  totalReadings: number;
  daysWithPlant: number;
  lastReading: {
    date: Date | null;
    status: "ativo" | "inativo";
    air_temperature: number | null;
    air_humidity: number | null;
    soil_moisture: number | null;
  };
}

export interface UserPlantWithStats {
  id: string;
  userId: string;
  plantId: string;
  nickname: string | null;
  dateAdded: Date;
  plant: {
    id: string;
    name: string;
    description: string;
  };
  stats: PlantStatsDetailed;
}

export async function getUserPlantsWithStats(): Promise<UserPlantWithStats[]> {
  try {
    const response = await api.get("/plant/userplant");
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar plantas:", error);
    throw new Error("Falha ao buscar plantas do usuário");
  }
}

export async function updatePlantNickname(
  id: string,
  nickname: string
): Promise<void> {
  try {
    await api.put(`/plant/userplant/${id}`, { nickname });
    revalidatePath("/plants");
    revalidatePath("/"); // Revalidate dashboard para atualizar PlantSelect
  } catch (error) {
    console.error("Erro ao atualizar planta:", error);
    throw new Error("Falha ao atualizar nome da planta");
  }
}

export async function deletePlant(id: string): Promise<void> {
  try {
    await api.delete(`/plant/userplant/${id}`);
    revalidatePath("/plants");
    revalidatePath("/"); // Revalidate dashboard para atualizar PlantSelect
  } catch (error) {
    console.error("Erro ao deletar planta:", error);
    throw new Error("Falha ao deletar planta");
  }
}
