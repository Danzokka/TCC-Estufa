import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateIrrigationDto, UpdateIrrigationDto } from './dto/irrigation.dto';
import { NotificationGeneratorService } from '../notifications/notification-generator.service';

@Injectable()
export class IrrigationService {
  private readonly logger = new Logger(IrrigationService.name);

  constructor(
    private prisma: PrismaService,
    private notificationGenerator: NotificationGeneratorService,
  ) {}

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

  // Estatísticas de irrigação com período
  async getIrrigationStats(
    greenhouseId?: string,
    userId?: string,
    period: 'day' | 'week' | 'month' | 'year' | 'all' = 'week',
  ) {
    const where: any = {};
    const PUMP_FLOW_RATE_ML_PER_SECOND = 40; // Taxa da bomba: 40ml/s

    if (greenhouseId) {
      where.greenhouseId = greenhouseId;
    }

    if (userId) {
      where.userId = userId;
    }

    // Calcular data de início baseado no período
    const now = new Date();
    let startDate: Date | undefined;
    switch (period) {
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
      default:
        startDate = undefined;
    }

    if (startDate) {
      where.createdAt = { gte: startDate };
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

        // Irrigações recentes (últimas 10)
        this.prisma.irrigation.findMany({
          where,
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

    // Calcular volume estimado para irrigações que não têm waterAmount
    // Extrai duração do campo notes (formato: "...X.Xs total...")
    let estimatedVolumeMl = 0;
    for (const irrigation of recentIrrigations) {
      if (irrigation.notes) {
        const durationMatch = irrigation.notes.match(/(\d+\.?\d*)s\s*total/i);
        if (durationMatch) {
          const durationSeconds = parseFloat(durationMatch[1]);
          estimatedVolumeMl += durationSeconds * PUMP_FLOW_RATE_ML_PER_SECOND;
        }
      }
    }

    // Se temos waterAmount salvo, usar esse valor (está em litros)
    const recordedWaterLiters = totalWater._sum.waterAmount || 0;
    const totalWaterMl = recordedWaterLiters * 1000 + estimatedVolumeMl;

    return {
      period,
      totalIrrigations,
      totalWaterMl: Math.round(totalWaterMl),
      totalWaterLiters: (totalWaterMl / 1000).toFixed(2),
      byType: byType.map((t) => ({
        type: t.type,
        count: t._count.id,
        waterMl: (t._sum.waterAmount || 0) * 1000,
      })),
      recentIrrigations: recentIrrigations.map((irr) => ({
        id: irr.id,
        type: irr.type,
        waterAmount: irr.waterAmount,
        notes: irr.notes,
        createdAt: irr.createdAt,
        greenhouse: irr.greenhouse,
        user: irr.user,
      })),
      pumpFlowRate: {
        mlPerSecond: PUMP_FLOW_RATE_ML_PER_SECOND,
        description: '40ml por segundo',
      },
    };
  }

  // Histórico de irrigação para gráfico
  async getIrrigationHistory(
    greenhouseId?: string,
    userId?: string,
    period: 'day' | 'week' | 'month' | 'year' | 'all' = 'week',
  ) {
    const where: any = {};
    const PUMP_FLOW_RATE_ML_PER_SECOND = 40;

    if (greenhouseId) {
      where.greenhouseId = greenhouseId;
    }

    if (userId) {
      where.userId = userId;
    }

    // Calcular data de início baseado no período
    const now = new Date();
    let startDate: Date;
    switch (period) {
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
      default:
        startDate = new Date(0);
    }

    where.createdAt = { gte: startDate };

    const irrigations = await this.prisma.irrigation.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        type: true,
        waterAmount: true,
        notes: true,
        createdAt: true,
      },
    });

    // Processar para formato de gráfico
    const history = irrigations.map((irr) => {
      let volumeMl = 0;
      let durationSeconds = 0;

      // Se tem waterAmount, usar (está em litros)
      if (irr.waterAmount) {
        volumeMl = irr.waterAmount * 1000;
      }

      // Tentar extrair duração do notes
      if (irr.notes) {
        const durationMatch = irr.notes.match(/(\d+\.?\d*)s\s*total/i);
        if (durationMatch) {
          durationSeconds = parseFloat(durationMatch[1]);
          // Se não tinha waterAmount, calcular volume estimado
          if (!irr.waterAmount) {
            volumeMl = durationSeconds * PUMP_FLOW_RATE_ML_PER_SECOND;
          }
        }
      }

      return {
        id: irr.id,
        type: irr.type,
        volumeMl: Math.round(volumeMl),
        durationSeconds,
        timestamp: irr.createdAt.toISOString(),
        date: irr.createdAt.toISOString().split('T')[0],
      };
    });

    // Agrupar por dia para o gráfico
    const dailyStats = new Map<
      string,
      { date: string; count: number; totalVolumeMl: number }
    >();

    for (const item of history) {
      const existing = dailyStats.get(item.date);
      if (existing) {
        existing.count += 1;
        existing.totalVolumeMl += item.volumeMl;
      } else {
        dailyStats.set(item.date, {
          date: item.date,
          count: 1,
          totalVolumeMl: item.volumeMl,
        });
      }
    }

    return {
      period,
      history,
      dailySummary: Array.from(dailyStats.values()),
      totalCount: irrigations.length,
      totalVolumeMl: history.reduce((sum, h) => sum + h.volumeMl, 0),
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
              notes: `Aumento de umidade detectado: +${moistureIncrease.toFixed(1)}%`,
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

          // Criar notificação de irrigação detectada
          if (irrigation.greenhouse.ownerId) {
            await this.notificationGenerator.createIrrigationDetectedNotification(
              irrigation.greenhouse.ownerId,
              irrigation.id,
              greenhouseId,
              moistureIncrease,
            );
            this.logger.log(
              `Notification created for detected irrigation: ${irrigation.id}`,
            );
          }

          return irrigation;
        }
      }

      return null;
    } catch (error) {
      console.error('Erro ao detectar irrigação por umidade:', error);
      return null;
    }
  }

  /**
   * Record an automatic irrigation event reported by the AI service
   * This is called when the AI system activates the pump
   */
  async recordAIIrrigation(data: {
    greenhouseId: string;
    status: 'success' | 'failed';
    durationMs: number;
    pulseCount?: number;
    moistureBefore?: number;
    moistureAfter?: number;
    targetMoisture?: number;
    errorMessage?: string;
    plantType?: string;
    esp32Ip?: string;
  }) {
    try {
      // Get greenhouse with owner info
      const greenhouse = await this.prisma.greenhouse.findUnique({
        where: { id: data.greenhouseId },
        include: {
          owner: true,
          activeUserPlant: {
            include: { plant: true },
          },
        },
      });

      if (!greenhouse) {
        this.logger.error(`Greenhouse not found: ${data.greenhouseId}`);
        return { success: false, error: 'Greenhouse not found' };
      }

      // Calculate water amount estimation (pump rate: 40ml per second)
      const durationSeconds = data.durationMs / 1000;
      const estimatedWaterAmount = durationSeconds * 0.04; // ~40ml/second = 0.04L/s

      // Create irrigation record
      const irrigation = await this.prisma.irrigation.create({
        data: {
          greenhouseId: data.greenhouseId,
          type: 'automatic',
          waterAmount: estimatedWaterAmount,
          notes:
            data.status === 'success'
              ? `AI automatic irrigation: ${data.pulseCount || 1} pulse(s), ${durationSeconds.toFixed(1)}s total. ` +
                `Target: ${data.targetMoisture || 'N/A'}%, Before: ${data.moistureBefore?.toFixed(1) || 'N/A'}%`
              : `AI irrigation FAILED: ${data.errorMessage || 'Unknown error'}`,
        },
      });

      this.logger.log(
        `AI irrigation recorded: ${irrigation.id} (${data.status}) for greenhouse ${data.greenhouseId}`,
      );

      // Send notification to greenhouse owner
      if (greenhouse.ownerId) {
        if (data.status === 'success') {
          // Success notification
          await this.notificationGenerator.createPumpActivatedNotification(
            greenhouse.ownerId,
            irrigation.id,
            data.greenhouseId,
            Math.round(durationSeconds),
            estimatedWaterAmount,
          );
        } else {
          // Failure notification - create a custom one with user-friendly message
          const userFriendlyMessage = data.errorMessage?.includes(
            'Failed to establish',
          )
            ? 'Não foi possível conectar ao dispositivo ESP32. Verifique se o dispositivo está ligado e conectado à rede.'
            : data.errorMessage?.includes('timeout')
              ? 'O dispositivo ESP32 não respondeu a tempo. Tente novamente.'
              : data.errorMessage?.includes('refused')
                ? 'Conexão recusada pelo dispositivo ESP32. Verifique se o dispositivo está funcionando corretamente.'
                : 'Ocorreu um erro ao tentar irrigar. Verifique o sistema e tente novamente.';

          await this.prisma.notification.create({
            data: {
              userId: greenhouse.ownerId,
              type: 'pump_error',
              title: '⚠️ Falha na Irrigação Automática',
              message: userFriendlyMessage,
              data: {
                irrigationId: irrigation.id,
                greenhouseId: data.greenhouseId,
                plantType: data.plantType,
                esp32Ip: data.esp32Ip,
                targetMoisture: data.targetMoisture,
                moistureBefore: data.moistureBefore,
                timestamp: new Date().toISOString(),
              },
            },
          });
        }
      }

      return {
        success: true,
        irrigationId: irrigation.id,
        status: data.status,
        waterAmount: estimatedWaterAmount,
        durationSeconds,
      };
    } catch (error) {
      this.logger.error('Error recording AI irrigation:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send AI prediction notification based on LSTM model forecasts
   * Creates a notification when AI predicts environmental changes that may affect the plant
   */
  async sendPredictionNotification(data: {
    greenhouseId: string;
    predictionType:
      | 'moisture_drop'
      | 'temperature_rise'
      | 'humidity_drop'
      | 'optimal_conditions';
    currentMoisture: number;
    predictedMoisture: number;
    confidence: number;
    hoursAhead: number;
    plantType?: string;
    currentTemperature?: number;
    predictedTemperature?: number;
    currentHumidity?: number;
    predictedHumidity?: number;
    recommendation?: string;
  }) {
    try {
      // Find the greenhouse and owner
      const greenhouse = await this.prisma.greenhouse.findUnique({
        where: { id: data.greenhouseId },
        select: { id: true, name: true, ownerId: true },
      });

      if (!greenhouse) {
        this.logger.warn(
          `Greenhouse ${data.greenhouseId} not found for prediction notification`,
        );
        return { success: false, error: 'Greenhouse not found' };
      }

      // Check for recent similar notifications (avoid spamming - 2 hour cooldown)
      const recentNotification = await this.prisma.notification.findFirst({
        where: {
          userId: greenhouse.ownerId,
          type: 'ai_prediction',
          createdAt: { gte: new Date(Date.now() - 2 * 60 * 60 * 1000) }, // Last 2 hours
        },
        orderBy: { createdAt: 'desc' },
      });

      if (recentNotification) {
        this.logger.debug(
          'Skipping prediction notification - recent one exists',
        );
        return {
          success: true,
          skipped: true,
          reason: 'Recent notification exists',
        };
      }

      // Generate notification content based on prediction type
      const { title, message, icon } = this.generatePredictionContent(data);

      // Create the notification
      const notification = await this.prisma.notification.create({
        data: {
          userId: greenhouse.ownerId,
          type: 'ai_prediction',
          title,
          message,
          data: {
            greenhouseId: data.greenhouseId,
            greenhouseName: greenhouse.name,
            predictionType: data.predictionType,
            currentMoisture: data.currentMoisture,
            predictedMoisture: data.predictedMoisture,
            confidence: data.confidence,
            hoursAhead: data.hoursAhead,
            plantType: data.plantType,
            currentTemperature: data.currentTemperature,
            predictedTemperature: data.predictedTemperature,
            currentHumidity: data.currentHumidity,
            predictedHumidity: data.predictedHumidity,
            recommendation: data.recommendation,
            timestamp: new Date().toISOString(),
          },
        },
      });

      this.logger.log(
        `Created AI prediction notification for user ${greenhouse.ownerId}`,
      );

      return {
        success: true,
        notificationId: notification.id,
        type: data.predictionType,
      };
    } catch (error) {
      this.logger.error('Error sending prediction notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate user-friendly notification content based on prediction type
   */
  private generatePredictionContent(data: {
    predictionType: string;
    currentMoisture: number;
    predictedMoisture: number;
    confidence: number;
    hoursAhead: number;
    plantType?: string;
    predictedTemperature?: number;
    predictedHumidity?: number;
    recommendation?: string;
  }): { title: string; message: string; icon: string } {
    const plantName = data.plantType || 'sua planta';
    const moistureDrop = data.currentMoisture - data.predictedMoisture;
    const hoursText =
      data.hoursAhead === 1 ? '1 hora' : `${data.hoursAhead} horas`;

    switch (data.predictionType) {
      case 'moisture_drop':
        return {
          title: '🌡️ Previsão: Solo Vai Secar',
          message: `A IA prevê que a umidade do solo de ${plantName} vai cair de ${data.currentMoisture.toFixed(0)}% para ${data.predictedMoisture.toFixed(0)}% nas próximas ${hoursText}. ${data.predictedTemperature ? `Temperatura prevista: ${data.predictedTemperature.toFixed(0)}°C. ` : ''}${data.predictedHumidity ? `Umidade do ar: ${data.predictedHumidity.toFixed(0)}%. ` : ''}${data.recommendation || 'Considere irrigar preventivamente.'}`,
          icon: '🌡️',
        };

      case 'temperature_rise':
        return {
          title: '☀️ Previsão: Temperatura em Alta',
          message: `A IA detectou que a temperatura vai subir para ${data.predictedTemperature?.toFixed(0) || 'níveis elevados'}°C. Isso pode acelerar a evaporação da água no solo. A umidade atual de ${data.currentMoisture.toFixed(0)}% pode cair para ${data.predictedMoisture.toFixed(0)}%. ${data.recommendation || 'Monitore sua planta com atenção.'}`,
          icon: '☀️',
        };

      case 'humidity_drop':
        return {
          title: '💨 Previsão: Ar Mais Seco',
          message: `A IA prevê que a umidade do ar vai diminuir${data.predictedHumidity ? ` para ${data.predictedHumidity.toFixed(0)}%` : ''}. Isso pode afetar a transpiração de ${plantName} e aumentar a necessidade de água. Umidade do solo atual: ${data.currentMoisture.toFixed(0)}% → prevista: ${data.predictedMoisture.toFixed(0)}%. ${data.recommendation || ''}`,
          icon: '💨',
        };

      case 'optimal_conditions':
        return {
          title: '✅ Condições Favoráveis',
          message: `A IA prevê condições ideais para ${plantName} nas próximas ${hoursText}. A umidade do solo está em ${data.currentMoisture.toFixed(0)}% e deve se manter estável. Continue monitorando!`,
          icon: '✅',
        };

      default:
        return {
          title: '🤖 Previsão da IA',
          message: `Previsão de condições para ${plantName}: umidade do solo ${data.currentMoisture.toFixed(0)}% → ${data.predictedMoisture.toFixed(0)}% em ${hoursText}. ${data.recommendation || ''}`,
          icon: '🤖',
        };
    }
  }
}
