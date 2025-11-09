import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  CreatePlantDto,
  CreateUserPlantDto,
  UpdateUserPlantDto,
  UserPlantWithStatsDto,
} from './dto/plant.dto';

@Injectable()
export class PlantService {
  constructor(private readonly prisma: PrismaService) {}

  async createPlant(plantData: CreatePlantDto) {
    // Cria uma nova planta no banco de dados
    const plant = await this.prisma.plant.create({
      data: plantData,
    });
    return plant;
  }

  async createUserPlant(userId: string, userPlantData: CreateUserPlantDto) {
    // Cria uma nova relação entre o usuário e a planta
    const userPlant = await this.prisma.userPlant.create({
      data: {
        userId,
        ...userPlantData,
      },
    });
    return userPlant;
  }

  async getPlantData(plantId: string) {
    // Retorna dias e status da planta
    const plant = await this.prisma.userPlant.findUnique({
      where: { id: plantId },
      include: { plant: true },
    });
    if (!plant) return null;
    // Exemplo: dias desde o dateadded
    const days = Math.floor(
      (Date.now() - new Date(plant.plant.dateadded).getTime()) /
        (1000 * 60 * 60 * 24),
    );
    // Status pode ser calculado conforme sua lógica, aqui um exemplo simples
    const status = plant.plant.air_humidity_final > 50 ? 'Saudável' : 'Atenção';
    return { days, status };
  }

  async getPlantStats(plantId: string) {
    // Busca o último dado do sensor relacionado à planta

    console.log('PlantId:', plantId);

    const userPlant = await this.prisma.userPlant.findFirst({
      where: { id: plantId },
      include: { plant: true },
    });

    console.log('UserPlant:', userPlant);

    if (!userPlant) return null;

    const sensor = await this.prisma.sensor.findFirst({
      where: { userPlantId: userPlant.id },
      orderBy: { timecreated: 'desc' },
    });

    if (!sensor) return null;
    return {
      water_level: sensor.water_level,
      air_humidity: sensor.air_humidity,
      air_temperature: sensor.air_temperature,
      soil_moisture: sensor.soil_moisture,
    };
  }

  async getUserPlants(userId: string) {
    // Busca todas as plantas do usuário
    const userPlants = await this.prisma.userPlant.findMany({
      where: { userId },
      include: { plant: true },
    });
    return userPlants;
  }

  async getPlantAlerts(plantId: string) {
    // Exemplo: retorna alertas fictícios, adapte conforme sua lógica
    const alerts = [
      {
        id: '1',
        title: 'Baixo nível de água',
        description: 'O nível de água está abaixo do recomendado.',
        timestamp: new Date(),
        type: 'warning',
      },
    ];
    return alerts;
  }

  async getUserPlantsWithStats(
    userId: string,
  ): Promise<UserPlantWithStatsDto[]> {
    const userPlants = await this.prisma.userPlant.findMany({
      where: { userId },
      include: {
        plant: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    return Promise.all(
      userPlants.map(async (userPlant) => {
        // Conta total de leituras
        const totalReadings = await this.prisma.sensor.count({
          where: { userPlantId: userPlant.id },
        });

        // Calcula dias com a planta
        const daysWithPlant = Math.floor(
          (Date.now() - new Date(userPlant.dateAdded).getTime()) /
            (1000 * 60 * 60 * 24),
        );

        // Busca última leitura
        const lastSensorReading = await this.prisma.sensor.findFirst({
          where: { userPlantId: userPlant.id },
          orderBy: { timecreated: 'desc' },
          select: {
            timecreated: true,
            air_temperature: true,
            air_humidity: true,
            soil_moisture: true,
          },
        });

        // Calcula status baseado na última leitura
        const status = this.calculatePlantStatus(lastSensorReading);

        return {
          id: userPlant.id,
          userId: userPlant.userId,
          plantId: userPlant.plantId,
          nickname: userPlant.nickname,
          dateAdded: userPlant.dateAdded,
          plant: userPlant.plant,
          stats: {
            totalReadings,
            daysWithPlant,
            lastReading: {
              date: lastSensorReading?.timecreated || null,
              status,
              air_temperature: lastSensorReading?.air_temperature || null,
              air_humidity: lastSensorReading?.air_humidity || null,
              soil_moisture: lastSensorReading?.soil_moisture || null,
            },
          },
        };
      }),
    );
  }

  private calculatePlantStatus(
    reading: {
      timecreated: Date;
    } | null,
  ): 'ativo' | 'inativo' {
    if (!reading) return 'inativo';

    // Calcular diferença em dias entre agora e última medição
    const now = new Date();
    const lastReading = new Date(reading.timecreated);
    const daysDifference = Math.floor(
      (now.getTime() - lastReading.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Ativo se medição nos últimos 7 dias
    return daysDifference <= 7 ? 'ativo' : 'inativo';
  }

  async updateUserPlant(id: string, userId: string, dto: UpdateUserPlantDto) {
    // Verifica se a planta existe e pertence ao usuário
    const userPlant = await this.prisma.userPlant.findFirst({
      where: { id, userId },
    });

    if (!userPlant) {
      throw new NotFoundException('Planta não encontrada');
    }

    // Atualiza o apelido
    return this.prisma.userPlant.update({
      where: { id },
      data: { nickname: dto.nickname },
    });
  }

  async deleteUserPlant(id: string, userId: string) {
    // Verifica se a planta existe e pertence ao usuário
    const userPlant = await this.prisma.userPlant.findFirst({
      where: { id, userId },
    });

    if (!userPlant) {
      throw new NotFoundException('Planta não encontrada');
    }

    // Deleta a planta (o cascade irá deletar as leituras de sensores)
    return this.prisma.userPlant.delete({
      where: { id },
    });
  }

  async getPlantTypes(): Promise<string[]> {
    // Busca todos os tipos únicos de plantas cadastradas
    const plants = await this.prisma.plant.findMany({
      select: {
        name: true,
      },
      distinct: ['name'],
      orderBy: {
        name: 'asc',
      },
    });

    return plants.map((plant) => plant.name);
  }

  /**
   * Vincula uma planta existente ao usuário e estufa
   */
  async linkPlantToUser(
    userId: string,
    plantId: string,
    greenhouseId: string,
    nickname?: string,
  ) {
    // Verificar se a planta existe
    const plant = await this.prisma.plant.findUnique({
      where: { id: plantId },
    });

    if (!plant) {
      throw new NotFoundException('Planta não encontrada');
    }

    // Verificar se a estufa existe e pertence ao usuário
    const greenhouse = await this.prisma.greenhouse.findFirst({
      where: { id: greenhouseId, ownerId: userId },
    });

    if (!greenhouse) {
      throw new NotFoundException('Estufa não encontrada ou não pertence ao usuário');
    }

    // Verificar se já existe uma vinculação desta planta para este usuário
    const existingUserPlant = await this.prisma.userPlant.findFirst({
      where: {
        userId,
        plantId,
      },
    });

    if (existingUserPlant) {
      throw new ForbiddenException('Usuário já possui esta planta vinculada');
    }

    // Criar nova vinculação
    const userPlant = await this.prisma.userPlant.create({
      data: {
        userId,
        plantId,
        greenhouseId,
        nickname,
      },
      include: {
        plant: true,
        greenhouse: true,
      },
    });

    return userPlant;
  }

  /**
   * Busca todas as plantas disponíveis para vinculação
   */
  async getAvailablePlants() {
    return this.prisma.plant.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        air_temperature_initial: true,
        air_temperature_final: true,
        air_humidity_initial: true,
        air_humidity_final: true,
        soil_moisture_initial: true,
        soil_moisture_final: true,
        soil_temperature_initial: true,
        soil_temperature_final: true,
        light_intensity_initial: true,
        light_intensity_final: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  /**
   * Busca estufas do usuário para vinculação
   */
  async getUserGreenhouses(userId: string) {
    return this.prisma.greenhouse.findMany({
      where: { ownerId: userId },
      select: {
        id: true,
        name: true,
        description: true,
        location: true,
        isOnline: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }
}
