'use server';

import { revalidatePath } from 'next/cache';
import api from '@/lib/api';

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
    if (filters?.greenhouseId) params.append('greenhouseId', filters.greenhouseId);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.limit) params.append('take', filters.limit.toString());

    const response = await api.get(`/irrigation?${params.toString()}`, {
      cache: 'no-store',
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching irrigations:', error);
    return { success: false, data: { irrigations: [] } };
  }
}

/**
 * Server Action para obter irrigação específica por ID
 */
export async function getIrrigationById(id: string) {
  try {
    const response = await api.get(`/irrigation/${id}`, {
      cache: 'no-store',
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching irrigation data:', error);
    return { success: false, message: 'Falha ao carregar dados da irrigação' };
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
    const response = await api.post('/test-irrigation', irrigationData);

    revalidatePath('/dashboard/irrigation');
    return response.data;
  } catch (error: any) {
    console.error('Error creating irrigation:', error);
    throw new Error(error.response?.data?.message || 'Falha ao criar irrigação');
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
    const response = await api.post(`/irrigation/${irrigationId}/confirm`, confirmationData);

    revalidatePath('/dashboard/irrigation');
    revalidatePath(`/dashboard/irrigation/confirm/${irrigationId}`);
    
    return response.data;
  } catch (error: any) {
    console.error('Error confirming irrigation:', error);
    return { 
      success: false, 
      message: error.response?.data?.message || 'Falha ao confirmar irrigação' 
    };
  }
}

/**
 * Server Action para obter estatísticas de irrigação
 */
export async function getIrrigationStats(filters?: {
  greenhouseId?: string;
  period?: string;
  hours?: number;
}) {
  try {
    const params = new URLSearchParams();
    if (filters?.greenhouseId) params.append('greenhouseId', filters.greenhouseId);
    if (filters?.period) params.append('period', filters.period);
    if (filters?.hours) params.append('hours', filters.hours.toString());

    const response = await api.get(`/irrigation/stats/overview?${params.toString()}`, {
      cache: 'no-store',
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching irrigation stats:', error);
    return { 
      success: false, 
      data: { 
        total: 0, 
        manual: 0, 
        rain: 0, 
        detected: 0,
        totalWater: 0,
        avgWaterPerIrrigation: 0 
      } 
    };
  }
}