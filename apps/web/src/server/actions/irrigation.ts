'use server';

import { revalidatePath } from 'next/cache';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

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

    const response = await fetch(`${API_BASE_URL}/irrigation?${params.toString()}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error('Backend error:', response.status);
      return { success: false, data: { irrigations: [] } };
    }

    return await response.json();
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
    const response = await fetch(`${API_BASE_URL}/irrigation/${id}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error('Backend error:', response.status);
      return { success: false, message: 'Irrigação não encontrada' };
    }

    return await response.json();
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

    const response = await fetch(`${API_BASE_URL}/irrigation/stats/overview?${params.toString()}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error('Backend error:', response.status);
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

    return await response.json();
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