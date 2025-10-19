import { Controller, Post, Get, Body } from '@nestjs/common';
import { GreenhouseGateway } from './greenhouse.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma.service';

@Controller('test-notifications')
export class TestNotificationsController {
  constructor(
    private greenhouseGateway: GreenhouseGateway,
    private notificationsService: NotificationsService,
    private prisma: PrismaService,
  ) {}

  // Função para obter ou criar usuário de teste
  private async getTestUserId(): Promise<string> {
    try {
      // Tentar encontrar um usuário existente
      const existingUser = await this.prisma.user.findFirst();
      if (existingUser) {
        return existingUser.id;
      }

      // Se não existir, criar um usuário de teste
      const testUser = await this.prisma.user.create({
        data: {
          username: 'test-user',
          name: 'Usuário de Teste',
          email: 'test@example.com',
          image: '',
          password: 'test-password',
        },
      });
      return testUser.id;
    } catch (error) {
      console.error('Erro ao obter usuário de teste:', error);
      // Fallback para um ID fixo se houver erro
      return 'test-user-id';
    }
  }

  @Post('pump-activated')
  async testPumpNotification(@Body() data: any) {
    const notificationData = {
      type: 'pump_activated',
      title: 'Bomba Ativada',
      message: `Bomba ativada por ${data.duration || 45}s, liberando ${data.waterAmount || 3.0}L de água`,
      data: {
        id: data.id || `pump-${Date.now()}`,
        duration: data.duration || 45,
        waterAmount: data.waterAmount || 3.0,
        reason: data.reason || 'Teste de irrigação automática',
        greenhouseId: data.greenhouseId || 'test-greenhouse',
        timestamp: new Date().toISOString(),
        userId: data.userId || 'test-user-id',
      },
      timestamp: new Date().toISOString(),
    };

    // Apenas emitir via WebSocket - o frontend fará o sync automático
    this.greenhouseGateway.server.emit('notification', notificationData);

    return {
      success: true,
      message: 'Notificação de bomba enviada via WebSocket',
      notification: notificationData,
    };
  }

  @Post('irrigation-detected')
  async testIrrigationDetected(@Body() data: any) {
    const notificationData = {
      type: 'irrigation_detected',
      title: 'Irrigação Detectada',
      message: `Detectado aumento de ${data.moistureIncrease || 22.5}% na umidade do solo`,
      data: {
        id: data.id || `irrigation-${Date.now()}`,
        moistureIncrease: data.moistureIncrease || 22.5,
        previousMoisture: data.previousMoisture || 28.0,
        currentMoisture: data.currentMoisture || 50.5,
        greenhouseId: data.greenhouseId || 'test-greenhouse',
        timestamp: new Date().toISOString(),
        userId: data.userId || 'test-user-id',
      },
      timestamp: new Date().toISOString(),
      requiresAction: true,
      actionUrl: `/dashboard/irrigation/confirm/${data.id || `irrigation-${Date.now()}`}`,
    };

    // Apenas emitir via WebSocket - o frontend fará o sync automático
    this.greenhouseGateway.server.emit('notification', notificationData);

    return {
      success: true,
      message: 'Notificação de irrigação detectada enviada via WebSocket',
      notification: notificationData,
    };
  }

  @Get('load-test')
  async loadTestNotifications() {
    try {
      // Buscar notificações do usuário de teste
      const testUserId = await this.getTestUserId();
      const notifications =
        await this.notificationsService.getUserNotifications(testUserId);

      return {
        success: true,
        notifications: notifications,
        count: notifications.length,
        unreadCount: notifications.filter((n) => !n.isRead).length,
      };
    } catch (error) {
      console.error('Erro ao carregar notificações de teste:', error);
      return {
        success: false,
        notifications: [],
        count: 0,
        unreadCount: 0,
      };
    }
  }

  @Post('irrigation-confirmed')
  async testIrrigationConfirmed(@Body() data: any) {
    const notificationData = {
      type: 'irrigation_confirmed',
      title: 'Irrigação Confirmada',
      message: `Irrigação manual confirmada: ${data.waterAmount || 4.0}L de água`,
      data: {
        id: data.id || `irrigation-${Date.now()}`,
        waterAmount: data.waterAmount || 4.0,
        notes: data.notes || 'Teste de confirmação manual',
        greenhouseId: data.greenhouseId || 'test-greenhouse',
        timestamp: new Date().toISOString(),
        userId: data.userId || 'test-user-id',
      },
      timestamp: new Date().toISOString(),
    };

    // Apenas emitir via WebSocket - o frontend fará o sync automático
    this.greenhouseGateway.server.emit('notification', notificationData);

    return {
      success: true,
      message: 'Notificação de confirmação enviada via WebSocket',
      notification: notificationData,
    };
  }
}
