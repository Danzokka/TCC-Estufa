import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { SensorService } from './sensor.service';
import { CreateSensorDataDto } from './dto/CreateSensorDataDto';
import { PlantHealthDto } from './dto/PlantHealthDto';
import { GetAggregatedDataDto } from './dto/GetAggregatedDataDto';

@Controller('sensor')
export class SensorController {
  constructor(private readonly sensorService: SensorService) {}

  @Post()
  async sendData(@Body() data: CreateSensorDataDto) {
    try {
      const result = await this.sensorService.sendData(data);
      return { message: 'Data sent successfully', data: result };
    } catch (error) {
      console.error('Error sending data:', error);
      return { message: 'Error sending data', error: error.message };
    }
  }

  /**
   * Endpoint para AI Service enviar análise de saúde da planta
   */
  @Post('health-status')
  async updateHealthStatus(@Body() healthDto: PlantHealthDto) {
    try {
      const result = await this.sensorService.updatePlantHealthScore(healthDto);
      return {
        message: 'Plant health status updated successfully',
        data: result,
      };
    } catch (error) {
      console.error('Error updating health status:', error);
      return { message: 'Error updating health status', error: error.message };
    }
  }

  @Get()
  async getData() {
    try {
      const data = await this.sensorService.getData();
      return { message: 'Data retrieved successfully', data };
    } catch (error) {
      console.error('Error retrieving data:', error);
      return { message: 'Error retrieving data', error: error.message };
    }
  }

  /**
   * Endpoint de debug para testar filtros
   */
  @Get('debug-filters')
  async debugFilters(@Query() filters: GetAggregatedDataDto) {
    const now = new Date();
    const hoursAgo = filters.hours
      ? new Date(now.getTime() - filters.hours * 60 * 60 * 1000)
      : null;

    return {
      receivedFilters: filters,
      types: {
        plantId: typeof filters.plantId,
        period: typeof filters.period,
        hours: typeof filters.hours,
      },
      calculations: {
        now: now.toISOString(),
        hoursAgo: hoursAgo?.toISOString(),
        hoursDiff: filters.hours,
      },
    };
  }

  /**
   * Endpoint otimizado para dados agregados do dashboard
   * Retorna dados com agregação inteligente baseada no período/horas
   * Query SQL otimizada executada diretamente no banco
   */
  @Get('aggregated')
  async getAggregatedData(@Query() filters: GetAggregatedDataDto) {
    try {
      console.log('=== AGGREGATED ENDPOINT CALLED ===');
      console.log('Received filters:', JSON.stringify(filters, null, 2));
      console.log('Filter types:', {
        plantId: typeof filters.plantId,
        period: typeof filters.period,
        hours: typeof filters.hours,
      });

      const data = await this.sensorService.getAggregatedData(filters);

      console.log(`Returning ${data.data.length} aggregated data points`);

      return {
        message: 'Aggregated data retrieved successfully',
        data,
        filters: {
          plantId: filters.plantId,
          period: filters.period,
          hours: filters.hours,
          intervalMinutes: data.intervalMinutes,
        },
      };
    } catch (error) {
      console.error('Error retrieving aggregated data:', error);
      return {
        message: 'Error retrieving aggregated data',
        error: error.message,
      };
    }
  }

  /**
   * Endpoint para dados completos do dashboard com KPIs
   * Inclui última leitura, histórico e KPIs calculados
   */
  @Get('dashboard')
  async getDashboardData(@Query() filters: GetAggregatedDataDto) {
    try {
      const data = await this.sensorService.getDashboardData(filters);
      return {
        message: 'Dashboard data retrieved successfully',
        data,
      };
    } catch (error) {
      console.error('Error retrieving dashboard data:', error);
      return {
        message: 'Error retrieving dashboard data',
        error: error.message,
      };
    }
  }

  /**
   * Endpoint para obter a última leitura de uma greenhouse específica
   * Usado pelo sistema de irrigação automática (AI)
   */
  @Get('greenhouse/:greenhouseId/latest')
  async getLatestReading(@Param('greenhouseId') greenhouseId: string) {
    try {
      const data = await this.sensorService.getLatestReading(greenhouseId);
      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('Error retrieving latest reading:', error);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Endpoint para verificar se a irrigação é necessária e retornar recomendação
   * Usado pelo sistema de irrigação automática
   */
  @Get('greenhouse/:greenhouseId/irrigation-check')
  async checkIrrigationNeeded(
    @Param('greenhouseId') greenhouseId: string,
    @Query('threshold') threshold?: string,
  ) {
    try {
      const thresholdValue = threshold ? parseInt(threshold, 10) : 30;
      const data = await this.sensorService.checkIrrigationNeeded(
        greenhouseId,
        thresholdValue,
      );
      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('Error checking irrigation:', error);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Endpoint para obter histórico de leituras para o modelo LSTM
   * Usado pelo sistema de irrigação automática com IA
   */
  @Get('greenhouse/:greenhouseId/history')
  async getHistoricalReadings(
    @Param('greenhouseId') greenhouseId: string,
    @Query('hours') hours?: string,
    @Query('limit') limit?: string,
  ) {
    try {
      const hoursValue = hours ? parseInt(hours, 10) : 24;
      const limitValue = limit ? parseInt(limit, 10) : 100;
      const data = await this.sensorService.getHistoricalReadings(
        greenhouseId,
        hoursValue,
        limitValue,
      );
      return {
        success: true,
        data,
        count: data.length,
      };
    } catch (error) {
      console.error('Error getting historical readings:', error);
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
