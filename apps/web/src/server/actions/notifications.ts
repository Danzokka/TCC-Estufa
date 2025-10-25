"use server";

import { getSession } from "./session";
import api from "@/lib/api";

export async function markNotificationAsRead(notificationId: string) {
  try {
    const session = await getSession();

    if (!session.isLoggedIn) {
      throw new Error("Não autorizado");
    }

    const response = await api.put(`/notifications/${notificationId}/read`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw new Error("Falha ao marcar notificação como lida");
  }
}

export async function markAllNotificationsAsRead() {
  try {
    const session = await getSession();

    if (!session.isLoggedIn) {
      throw new Error("Não autorizado");
    }

    const response = await api.put("/notifications/mark-all-read");
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    throw new Error("Falha ao marcar todas as notificações como lidas");
  }
}

export async function getNotifications(limit: number = 50) {
  try {
    const session = await getSession();

    if (!session.isLoggedIn) {
      throw new Error("Não autorizado");
    }

    const response = await api.get(`/notifications?limit=${limit}`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Error fetching notifications:", error);
    throw new Error("Falha ao carregar notificações");
  }
}

export async function getUnreadCount() {
  try {
    const session = await getSession();

    if (!session.isLoggedIn) {
      throw new Error("Não autorizado");
    }

    const response = await api.get("/notifications/unread-count");
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Error fetching unread count:", error);
    throw new Error("Falha ao carregar contagem de não lidas");
  }
}

export async function clearReadNotifications() {
  try {
    const session = await getSession();

    if (!session.isLoggedIn) {
      throw new Error("Não autorizado");
    }

    const response = await api.delete("/notifications/clear-read");
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Error clearing read notifications:", error);
    throw new Error("Falha ao limpar notificações lidas");
  }
}
