'use server';

import { revalidatePath } from 'next/cache';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/**
 * Server Action para obter notificações do usuário
 */
export async function getUserNotifications() {
  try {
    const response = await fetch(`${API_BASE_URL}/notifications`, {
      headers: {
        'Authorization': `Bearer ${process.env.API_TOKEN || ''}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching user notifications:', error);
    throw new Error('Falha ao carregar notificações');
  }
}

/**
 * Server Action para obter contagem de notificações não lidas
 */
export async function getUnreadCount() {
  try {
    const response = await fetch(`${API_BASE_URL}/notifications/unread-count`, {
      headers: {
        'Authorization': `Bearer ${process.env.API_TOKEN || ''}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    return data.count;
  } catch (error) {
    console.error('Error fetching unread count:', error);
    throw new Error('Falha ao carregar contagem de notificações');
  }
}

/**
 * Server Action para marcar notificação como lida
 */
export async function markNotificationAsRead(notificationId: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error:', errorText);
      return { success: false, message: `Erro ao marcar como lida: ${response.status}` };
    }

    const data = await response.json();
    revalidatePath('/dashboard');
    return { success: true, data };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { success: false, message: 'Falha ao marcar notificação como lida' };
  }
}

/**
 * Server Action para marcar todas as notificações como lidas
 */
export async function markAllNotificationsAsRead() {
  try {
    const response = await fetch(`${API_BASE_URL}/notifications/mark-all-read`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error:', errorText);
      return { success: false, message: `Erro ao marcar todas como lidas: ${response.status}` };
    }

    const data = await response.json();
    revalidatePath('/dashboard');
    return { success: true, data };
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return { success: false, message: 'Falha ao marcar todas as notificações como lidas' };
  }
}

/**
 * Server Action para deletar notificação
 */
export async function deleteNotification(notificationId: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${process.env.API_TOKEN || ''}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    revalidatePath('/dashboard');
    return await response.json();
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw new Error('Falha ao deletar notificação');
  }
}

/**
 * Server Action para limpar notificações antigas
 */
export async function cleanupOldNotifications(daysOld: number = 30) {
  try {
    const response = await fetch(`${API_BASE_URL}/notifications/cleanup`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${process.env.API_TOKEN || ''}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ daysOld }),
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    revalidatePath('/dashboard');
    return await response.json();
  } catch (error) {
    console.error('Error cleaning up old notifications:', error);
    throw new Error('Falha ao limpar notificações antigas');
  }
}

/**
 * Server Action para limpar notificações lidas
 */
export async function clearReadNotifications() {
  try {
    const response = await fetch(`${API_BASE_URL}/notifications/clear-read`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error:', errorText);
      return { success: false, message: `Erro ao limpar notificações: ${response.status}`, count: 0 };
    }

    const data = await response.json();
    revalidatePath('/dashboard');
    return { success: true, count: data.count || 0, message: data.message };
  } catch (error) {
    console.error('Error clearing read notifications:', error);
    return { success: false, message: 'Falha ao limpar notificações lidas', count: 0 };
  }
}

/**
 * Server Action para salvar notificação (endpoint público para testes)
 */
export async function saveNotification(notificationData: {
  userId?: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}) {
  try {
    const response = await fetch(`${API_BASE_URL}/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notificationData),
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    revalidatePath('/dashboard');
    return await response.json();
  } catch (error) {
    console.error('Error saving notification:', error);
    throw new Error('Falha ao salvar notificação');
  }
}