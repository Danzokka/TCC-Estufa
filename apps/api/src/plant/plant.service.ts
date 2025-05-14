import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreatePlantDto, CreateUserPlantDto } from './dto/plant.dto';

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
        ...userPlantData
      },
    });
    return userPlant;
  }

  async getPlantData(plantId: string) {
    // Retorna dias e status da planta
    const plant = await this.prisma.plant.findUnique({
      where: { id: plantId },
    });
    if (!plant) return null;
    // Exemplo: dias desde o dateadded
    const days = Math.floor(
      (Date.now() - new Date(plant.dateadded).getTime()) /
        (1000 * 60 * 60 * 24),
    );
    // Status pode ser calculado conforme sua lógica, aqui um exemplo simples
    const status = plant.air_humidity_final > 50 ? 'Saudável' : 'Atenção';
    return { days, status };
  }

  async getPlantStats(plantId: string) {
    // Busca o último dado do sensor relacionado à planta
    const userPlant = await this.prisma.userPlant.findFirst({
      where: { plantId },
    });
    if (!userPlant) return null;
    const sensor = await this.prisma.sensor.findFirst({
      where: { userPlantId: userPlant.id },
      orderBy: { timecreated: 'desc' },
    });
    if (!sensor) return null;
    return {
      nivelAgua: sensor.water_level,
      umidadeAr: sensor.air_humidity,
      temperaturaAr: sensor.air_temperature,
      umidadeSolo: sensor.soil_moisture,
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
}
