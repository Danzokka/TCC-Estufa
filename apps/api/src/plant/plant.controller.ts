import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { PlantService } from './plant.service';
import {
  CreatePlantDto,
  CreateUserPlantDto,
  UpdateUserPlantDto,
} from './dto/plant.dto';
import { AuthGuard, RequestAuthGuard } from 'src/auth/guards/auth.guard';

@Controller('plant')
export class PlantController {
  constructor(private readonly plantService: PlantService) {}

  @Get('data/:id')
  @UseGuards(AuthGuard)
  async getPlantData(@Param('id') id: string) {
    return this.plantService.getPlantData(id);
  }

  @Get('stats/:id')
  @UseGuards(AuthGuard)
  async getPlantStats(@Param('id') id: string) {
    return this.plantService.getPlantStats(id);
  }

  @Get('alerts/:id')
  @UseGuards(AuthGuard)
  async getPlantAlerts(@Param('id') id: string) {
    return this.plantService.getPlantAlerts(id);
  }

  @Get('types')
  async getPlantTypes() {
    return this.plantService.getPlantTypes();
  }

  @UseGuards(AuthGuard)
  @Get('/userplant')
  async getUserPlants(
    @Request()
    request: Request & { user: { id: RequestAuthGuard['user']['id'] } },
  ) {
    return this.plantService.getUserPlantsWithStats(request.user.id);
  }

  @UseGuards(AuthGuard)
  @Put('/userplant/:id')
  async updateUserPlant(
    @Param('id') id: string,
    @Body() updateUserPlantDto: UpdateUserPlantDto,
    @Request()
    request: Request & { user: { id: RequestAuthGuard['user']['id'] } },
  ) {
    return this.plantService.updateUserPlant(
      id,
      request.user.id,
      updateUserPlantDto,
    );
  }

  @UseGuards(AuthGuard)
  @Delete('/userplant/:id')
  async deleteUserPlant(
    @Param('id') id: string,
    @Request()
    request: Request & { user: { id: RequestAuthGuard['user']['id'] } },
  ) {
    return this.plantService.deleteUserPlant(id, request.user.id);
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
    return this.plantService.createUserPlant(
      request.user.id,
      createUserPlantDto,
    );
  }
}
