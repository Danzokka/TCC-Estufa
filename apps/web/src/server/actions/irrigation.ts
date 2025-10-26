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

    console.log('🔍 Buscando irrigações com filtros:', filters);
    console.log('📡 URL:', `/irrigation?${params.toString()}`);

    const response = await api.get(`/irrigation?${params.toString()}`);
    
    console.log('✅ Dados recebidos:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Erro ao buscar irrigações:', error);
    console.error('❌ Status:', error.response?.status);
    console.error('❌ Data:', error.response?.data);
    return { success: false, data: { irrigations: [] } };
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
    const response = await fetch(`${API_BASE_URL}/test-irrigation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(irrigationData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || `Backend responded with status: ${response.status}`
      );
    }

    revalidatePath('/dashboard/irrigation');
    return await response.json();
  } catch (error) {
    console.error('Error creating irrigation:', error);
    throw new Error('Falha ao criar irrigação');
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
    const response = await fetch(`${API_BASE_URL}/irrigation/${irrigationId}/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(confirmationData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Backend error:', errorData);
      return { 
        success: false, 
        message: errorData.message || `Erro ${response.status}: Falha ao confirmar irrigação` 
      };
    }

    const result = await response.json();
    
    revalidatePath('/dashboard/irrigation');
    revalidatePath(`/dashboard/irrigation/confirm/${irrigationId}`);
    
    return result;
  } catch (error) {
    console.error('Error confirming irrigation:', error);
    return { success: false, message: 'Falha ao confirmar irrigação' };
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

    console.log('📊 Buscando estatísticas de irrigação com filtros:', filters);
    
    const response = await api.get(`/irrigation/stats/overview?${params.toString()}`);
    
    console.log('✅ Estatísticas recebidas:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Erro ao buscar estatísticas:', error);
    console.error('❌ Status:', error.response?.status);
    console.error('❌ Data:', error.response?.data);
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