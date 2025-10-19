import { Controller, Get, Post, Body, Param, Put } from '@nestjs/common';
import { IrrigationService } from './irrigation.service';
import { PrismaService } from '../prisma.service';

@Controller('irrigation/public')
export class PublicIrrigationController {
  constructor(
    private readonly irrigationService: IrrigationService,
    private readonly prisma: PrismaService,
  ) {}

  // Buscar todas as irrigações (público para teste)
  @Get()
  async getAllIrrigations() {
    return this.irrigationService.getAllIrrigations({
      limit: 20,
    });
  }

  // Buscar irrigação por ID (público para teste)
  @Get(':id')
  async getIrrigationById(@Param('id') id: string) {
    return this.irrigationService.getIrrigationById(id);
  }

  // Confirmar irrigação detectada (público para teste)
  @Put(':id/confirm')
  async confirmIrrigation(
    @Param('id') id: string,
    @Body()
    data: {
      type: 'manual' | 'rain';
      waterAmount?: number;
      notes?: string;
    },
  ) {
    // Usar usuário de teste
    const testUserId = await this.getTestUserId();

    return this.irrigationService.confirmDetectedIrrigation(id, {
      ...data,
      userId: testUserId,
    });
  }

  // Criar irrigação (público para teste)
  @Post()
  async createIrrigation(
    @Body()
    data: {
      type: 'manual' | 'automatic' | 'detected' | 'rain';
      waterAmount?: number;
      notes?: string;
      greenhouseId: string;
      userId?: string;
    },
  ) {
    // Usar usuário de teste se não fornecido
    if (!data.userId) {
      data.userId = await this.getTestUserId();
    }

    return this.irrigationService.createIrrigation(data);
  }

  // Método auxiliar para obter ID do usuário de teste
  private async getTestUserId(): Promise<string> {
    let testUser = await this.prisma.user.findFirst({
      where: { username: 'test-user' },
    });

    if (!testUser) {
      testUser = await this.prisma.user.create({
        data: {
          username: 'test-user',
          name: 'Test User',
          email: 'test@example.com',
          image: '',
          password: 'test-password',
        },
      });
    }

    return testUser.id;
  }
}
