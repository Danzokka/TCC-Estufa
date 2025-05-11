"use server";
import api from "@/lib/api";
import { NotificationType } from "@/data/notifications";
import { notifications } from "@/data/notifications";

export async function getPlantData(plantId: string) {
  try {
    const response = await api.get(`/plants/${plantId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching plant data:", error);
    throw new Error("Failed to fetch plant data");
  }
}

export async function getPlantStats(plantId: string) {
  try {
    const response = await api.get(`/plants/${plantId}/stats`);
    return response.data;
  } catch (error) {
    console.error("Error fetching plant stats:", error);
    throw new Error("Failed to fetch plant stats");
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
