import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { PlantService } from './plant.service';
import { CreatePlantDto, CreateUserPlantDto } from './dto/plant.dto';
import { AuthGuard, RequestAuthGuard } from 'src/auth/guards/auth.guard';

@Controller('plant')
export class PlantController {
  constructor(private readonly plantService: PlantService) {}

  @Get(':id/data')
  async getPlantData(@Param('id') id: string) {
    return this.plantService.getPlantData(id);
  }

  @Get(':id/stats')
  async getPlantStats(@Param('id') id: string) {
    return this.plantService.getPlantStats(id);
  }

  @Get(':id/alerts')
  async getPlantAlerts(@Param('id') id: string) {
    return this.plantService.getPlantAlerts(id);
  }

  @Post()
  async createPlant(@Body() plantData: CreatePlantDto) {
    // Implementar lógica para criar uma nova planta
    return this.plantService.createPlant(plantData);
  }

  @UseGuards(AuthGuard)
  @Post('userplant')
  async createUserPlant(
    @Body() createUserPlantDto: CreateUserPlantDto,
    @Request()
    request: Request & { user: { id: RequestAuthGuard['user']['id'] } },
  ) {

    console.log(request.user)
    console.log('User ID:', request.user.id);

    return this.plantService.createUserPlant(
      request.user.id,
      createUserPlantDto,
    );
  }
}
