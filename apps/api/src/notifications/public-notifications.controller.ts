import { Controller, Post, Body } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma.service';

@Controller('notifications/public')
export class PublicNotificationsController {
  constructor(
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

  // Endpoint público para salvar notificações (para testes)
  @Post('save')
  async saveNotification(
    @Body()
    body: {
      userId?: string;
      type: string;
      title: string;
      message: string;
      data?: any;
    },
  ) {
    // Obter um userId válido
    const userId = await this.getTestUserId();

    return this.notificationsService.createNotification({
      userId,
      type: body.type,
      title: body.title,
      message: body.message,
      data: body.data,
    });
  }
}
