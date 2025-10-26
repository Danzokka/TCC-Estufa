'use server';

import { revalidatePath } from 'next/cache';
import api from '@/lib/api';

/**
 * Server Action para obter notificações do usuário
 */
export async function getUserNotifications() {
  try {
    const response = await api.get('/notifications');
    return response.data;
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
    const response = await api.get('/notifications/unread-count');
    return response.data.count;
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
    const response = await api.put(`/notifications/${notificationId}/read`);
    revalidatePath('/dashboard');
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error('Error marking notification as read:', error);
    return { success: false, message: error.response?.data?.message || 'Falha ao marcar notificação como lida' };
  }
}

/**
 * Server Action para marcar todas as notificações como lidas
 */
export async function markAllNotificationsAsRead() {
  try {
    const response = await api.put('/notifications/mark-all-read');
    revalidatePath('/dashboard');
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error('Error marking all notifications as read:', error);
    return { success: false, message: error.response?.data?.message || 'Falha ao marcar todas as notificações como lidas' };
  }
}

/**
 * Server Action para deletar notificação
 */
export async function deleteNotification(notificationId: string) {
  try {
    const response = await api.delete(`/notifications/${notificationId}`);
    revalidatePath('/dashboard');
    return response.data;
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
    const response = await api.delete('/notifications/cleanup', {
      data: { daysOld }
    });
    revalidatePath('/dashboard');
    return response.data;
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
    const response = await api.delete('/notifications/clear-read');
    revalidatePath('/dashboard');
    return { success: true, count: response.data.count || 0, message: response.data.message };
  } catch (error: any) {
    console.error('Error clearing read notifications:', error);
    return { success: false, message: error.response?.data?.message || 'Falha ao limpar notificações lidas', count: 0 };
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
    const response = await api.post('/notifications', notificationData);
    revalidatePath('/dashboard');
    return response.data;
  } catch (error) {
    console.error('Error saving notification:', error);
    throw new Error('Falha ao salvar notificação');
  }
}