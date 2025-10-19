import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateIrrigationDto, UpdateIrrigationDto } from './dto/irrigation.dto';

@Injectable()
export class IrrigationService {
  constructor(private prisma: PrismaService) {}

  // Criar nova irrigação
  async createIrrigation(data: CreateIrrigationDto) {
    return this.prisma.irrigation.create({
      data: {
        type: data.type,
        waterAmount: data.waterAmount,
        notes: data.notes,
        greenhouseId: data.greenhouseId,
        userId: data.userId,
        plantId: data.plantId,
        sensorId: data.sensorId,
      },
      include: {
        greenhouse: {
          select: {
            id: true,
            name: true,
            ownerId: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        plant: {
          select: {
            id: true,
            name: true,
          },
        },
        sensor: {
          select: {
            id: true,
            timestamp: true,
            soilMoisture: true,
            airTemperature: true,
          },
        },
      },
    });
  }

  // Buscar todas as irrigações com filtros
  async getAllIrrigations(filters: {
    greenhouseId?: string;
    userId?: string;
    type?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filters.greenhouseId) {
      where.greenhouseId = filters.greenhouseId;
    }

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    const [irrigations, total] = await Promise.all([
      this.prisma.irrigation.findMany({
        where,
        include: {
          greenhouse: {
            select: {
              id: true,
              name: true,
              ownerId: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
          plant: {
            select: {
              id: true,
              name: true,
            },
          },
          sensor: {
            select: {
              id: true,
              timestamp: true,
              soilMoisture: true,
              airTemperature: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: filters.limit || 50,
        skip: filters.offset || 0,
      }),
      this.prisma.irrigation.count({ where }),
    ]);

    return {
      irrigations,
      total,
      hasMore: (filters.offset || 0) + (filters.limit || 50) < total,
    };
  }

  // Buscar irrigação por ID
  async getIrrigationById(id: string) {
    return this.prisma.irrigation.findUnique({
      where: { id },
      include: {
        greenhouse: {
          select: {
            id: true,
            name: true,
            ownerId: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        plant: {
          select: {
            id: true,
            name: true,
          },
        },
        sensor: {
          select: {
            id: true,
            timestamp: true,
            soilMoisture: true,
            airTemperature: true,
          },
        },
      },
    });
  }

  // Atualizar irrigação
  async updateIrrigation(id: string, data: UpdateIrrigationDto) {
    return this.prisma.irrigation.update({
      where: { id },
      data: {
        type: data.type,
        waterAmount: data.waterAmount,
        notes: data.notes,
        plantId: data.plantId,
      },
      include: {
        greenhouse: {
          select: {
            id: true,
            name: true,
            ownerId: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        plant: {
          select: {
            id: true,
            name: true,
          },
        },
        sensor: {
          select: {
            id: true,
            timestamp: true,
            soilMoisture: true,
            airTemperature: true,
          },
        },
      },
    });
  }

  // Deletar irrigação
  async deleteIrrigation(id: string) {
    return this.prisma.irrigation.delete({
      where: { id },
    });
  }

  // Estatísticas de irrigação
  async getIrrigationStats(greenhouseId?: string, userId?: string) {
    const where: any = {};

    if (greenhouseId) {
      where.greenhouseId = greenhouseId;
    }

    if (userId) {
      where.userId = userId;
    }

    const [totalIrrigations, totalWater, byType, recentIrrigations] =
      await Promise.all([
        // Total de irrigações
        this.prisma.irrigation.count({ where }),

        // Total de água utilizada
        this.prisma.irrigation.aggregate({
          where: {
            ...where,
            waterAmount: { not: null },
          },
          _sum: {
            waterAmount: true,
          },
        }),

        // Irrigações por tipo
        this.prisma.irrigation.groupBy({
          by: ['type'],
          where,
          _count: {
            id: true,
          },
          _sum: {
            waterAmount: true,
          },
        }),

        // Irrigações recentes (últimos 7 dias)
        this.prisma.irrigation.findMany({
          where: {
            ...where,
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
          include: {
            greenhouse: {
              select: {
                id: true,
                name: true,
              },
            },
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        }),
      ]);

    return {
      totalIrrigations,
      totalWater: totalWater._sum.waterAmount || 0,
      byType,
      recentIrrigations,
    };
  }

  // Confirmar irrigação detectada (quando usuário preenche o formulário)
  async confirmDetectedIrrigation(
    irrigationId: string,
    data: {
      type: 'manual' | 'rain';
      waterAmount?: number;
      notes?: string;
      userId: string;
    },
  ) {
    return this.prisma.irrigation.update({
      where: { id: irrigationId },
      data: {
        type: data.type,
        waterAmount: data.waterAmount,
        notes: data.notes,
        userId: data.userId,
      },
      include: {
        greenhouse: {
          select: {
            id: true,
            name: true,
            ownerId: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        plant: {
          select: {
            id: true,
            name: true,
          },
        },
        sensor: {
          select: {
            id: true,
            timestamp: true,
            soilMoisture: true,
            airTemperature: true,
          },
        },
      },
    });
  }

  // Detectar irrigação baseada em mudança de umidade
  async detectMoistureIrrigation(
    greenhouseId: string,
    sensorReadingId: string,
  ) {
    try {
      // Buscar a leitura do sensor atual
      const currentReading =
        await this.prisma.greenhouseSensorReading.findUnique({
          where: { id: sensorReadingId },
        });

      if (!currentReading) {
        return null;
      }

      // Buscar leitura anterior (última leitura antes da atual)
      const previousReading =
        await this.prisma.greenhouseSensorReading.findFirst({
          where: {
            greenhouseId,
            timestamp: {
              lt: currentReading.timestamp,
            },
          },
          orderBy: {
            timestamp: 'desc',
          },
        });

      if (!previousReading) {
        return null;
      }

      // Calcular aumento de umidade
      const moistureIncrease =
        currentReading.soilMoisture - previousReading.soilMoisture;

      // Se houve aumento significativo de umidade (mais de 15%)
      if (moistureIncrease > 15) {
        // Verificar se já existe uma irrigação detectada recente (últimas 2 horas)
        const recentDetectedIrrigation = await this.prisma.irrigation.findFirst(
          {
            where: {
              greenhouseId,
              type: 'detected',
              createdAt: {
                gte: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 horas atrás
              },
            },
          },
        );

        // Se não há irrigação detectada recente, criar uma nova
        if (!recentDetectedIrrigation) {
          const irrigation = await this.prisma.irrigation.create({
            data: {
              type: 'detected',
              notes: `Aumento de umidade detectado: +${moistureIncrease}%`,
              greenhouseId,
              sensorId: sensorReadingId,
            },
            include: {
              greenhouse: {
                select: {
                  id: true,
                  name: true,
                  ownerId: true,
                },
              },
              sensor: {
                select: {
                  id: true,
                  timestamp: true,
                  soilMoisture: true,
                  airTemperature: true,
                },
              },
            },
          });

          return irrigation;
        }
      }

      return null;
    } catch (error) {
      console.error('Erro ao detectar irrigação por umidade:', error);
      return null;
    }
  }
}
