import { Injectable, Logger } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import {
  PlantMetricsService,
  PlantAlert,
} from '../plant/plant-metrics.service';
import { GreenhouseGateway } from '../websocket/greenhouse.gateway';

@Injectable()
export class NotificationGeneratorService {
  private readonly logger = new Logger(NotificationGeneratorService.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly plantMetricsService: PlantMetricsService,
    private readonly greenhouseGateway: GreenhouseGateway,
  ) {}

  /**
   * Gera notificações baseadas em alertas de métricas da planta
   */
  async generateMetricNotifications(userId: string): Promise<number> {
    try {
      const plantsMetrics =
        await this.plantMetricsService.analyzeUserPlants(userId);
      let notificationsCreated = 0;

      for (const plantMetrics of plantsMetrics) {
        for (const alert of plantMetrics.alerts) {
          await this.createAlertNotification(
            userId,
            plantMetrics.plantId,
            alert,
          );
          notificationsCreated++;
        }
      }

      if (notificationsCreated > 0) {
        this.logger.log(
          `Created ${notificationsCreated} metric notifications for user ${userId}`,
        );
      }

      return notificationsCreated;
    } catch (error) {
      this.logger.error('Error generating metric notifications:', error);
      return 0;
    }
  }

  /**
   * Cria notificação de alerta específico
   */
  private async createAlertNotification(
    userId: string,
    plantId: string,
    alert: PlantAlert,
  ): Promise<void> {
    try {
      // Verificar se já existe notificação similar recente (últimas 2 horas)
      const recentNotifications =
        await this.notificationsService.getUserNotifications(userId, 20);

      const hasRecentSimilar = recentNotifications.some(
        (notif) =>
          notif.type === alert.type &&
          notif.data?.plantId === plantId &&
          new Date(notif.createdAt).getTime() > Date.now() - 2 * 60 * 60 * 1000,
      );

      if (hasRecentSimilar) {
        this.logger.debug(
          `Skipping duplicate notification of type ${alert.type} for plant ${plantId}`,
        );
        return;
      }

      const title = this.getAlertTitle(alert.type);
      const data = {
        plantId,
        alertType: alert.type,
        severity: alert.severity,
        currentValue: alert.currentValue,
        idealMin: alert.idealMin,
        idealMax: alert.idealMax,
      };

      await this.notificationsService.createNotification({
        userId,
        type: alert.type,
        title,
        message: alert.message,
        data,
      });

      this.logger.log(
        `Created ${alert.type} notification for user ${userId}, plant ${plantId}`,
      );
    } catch (error) {
      this.logger.error('Error creating alert notification:', error);
    }
  }

  /**
   * Cria notificação de irrigação detectada
   */
  async createIrrigationDetectedNotification(
    userId: string,
    irrigationId: string,
    greenhouseId: string,
    moistureIncrease: number,
  ): Promise<void> {
    try {
      const title = 'Irrigação Detectada';
      const message = `Uma irrigação foi detectada com aumento de ${moistureIncrease.toFixed(1)}% na umidade do solo. Por favor, confirme os dados.`;

      const notificationData = {
        irrigationId,
        greenhouseId,
        moistureIncrease,
        timestamp: new Date().toISOString(),
      };

      await this.notificationsService.createNotification({
        userId,
        type: 'irrigation_detected',
        title,
        message,
        data: notificationData,
      });

      // Enviar notificação em tempo real via WebSocket
      this.greenhouseGateway.notifyIrrigationDetected(userId, greenhouseId, {
        id: irrigationId,
        ...notificationData,
      });

      this.logger.log(
        `Created irrigation_detected notification for user ${userId}, irrigation ${irrigationId}`,
      );
    } catch (error) {
      this.logger.error(
        'Error creating irrigation detected notification:',
        error,
      );
    }
  }

  /**
   * Cria notificação de bomba ativada
   */
  async createPumpActivatedNotification(
    userId: string,
    pumpOperationId: string,
    greenhouseId: string,
    duration: number,
    waterAmount?: number,
  ): Promise<void> {
    try {
      const title = 'Bomba Ativada';
      const message = waterAmount
        ? `Bomba ativada para irrigar ${waterAmount}L durante ${duration} segundos.`
        : `Bomba ativada por ${duration} segundos.`;

      await this.notificationsService.createNotification({
        userId,
        type: 'pump_activated',
        title,
        message,
        data: {
          pumpOperationId,
          greenhouseId,
          duration,
          waterAmount,
          timestamp: new Date().toISOString(),
        },
      });

      this.logger.log(
        `Created pump_activated notification for user ${userId}, operation ${pumpOperationId}`,
      );
    } catch (error) {
      this.logger.error('Error creating pump activated notification:', error);
    }
  }

  /**
   * Retorna título baseado no tipo de alerta
   */
  private getAlertTitle(alertType: string): string {
    const titles = {
      temperature_alert: 'Alerta de Temperatura',
      humidity_alert: 'Alerta de Umidade do Ar',
      soil_moisture_alert: 'Alerta de Umidade do Solo',
      water_level_low: 'Nível de Água Baixo',
    };

    return titles[alertType] || 'Alerta do Sistema';
  }
}
