import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { IrrigationService } from './irrigation.service';
import {
  CreateIrrigationDto,
  UpdateIrrigationDto,
  ConfirmIrrigationDto,
  IrrigationFiltersDto,
} from './dto/irrigation.dto';
import { AuthGuard } from '../auth/guards/auth.guard';

@Controller('irrigation')
@UseGuards(AuthGuard)
export class IrrigationController {
  constructor(private irrigationService: IrrigationService) {}

  // Criar nova irrigação
  @Post()
  async createIrrigation(@Body() data: CreateIrrigationDto, @Request() req) {
    // Se não tiver userId, usar o usuário logado
    if (!data.userId) {
      data.userId = req.user.sub;
    }

    return this.irrigationService.createIrrigation(data);
  }

  // Buscar todas as irrigações com filtros
  @Get()
  async getAllIrrigations(
    @Query() filters: IrrigationFiltersDto,
    @Request() req,
  ) {
    // Se não especificar userId, usar o usuário logado
    if (!filters.userId) {
      filters.userId = req.user.sub;
    }

    return this.irrigationService.getAllIrrigations(filters);
  }

  // Buscar irrigação por ID
  @Get(':id')
  async getIrrigationById(@Param('id', ParseUUIDPipe) id: string) {
    return this.irrigationService.getIrrigationById(id);
  }

  // Atualizar irrigação
  @Put(':id')
  async updateIrrigation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: UpdateIrrigationDto,
  ) {
    return this.irrigationService.updateIrrigation(id, data);
  }

  // Deletar irrigação
  @Delete(':id')
  async deleteIrrigation(@Param('id', ParseUUIDPipe) id: string) {
    return this.irrigationService.deleteIrrigation(id);
  }

  // Estatísticas de irrigação
  @Get('stats/overview')
  async getIrrigationStats(
    @Query('greenhouseId') greenhouseId?: string,
    @Request() req?: any,
  ) {
    return this.irrigationService.getIrrigationStats(
      greenhouseId,
      req?.user?.sub,
    );
  }

  // Confirmar irrigação detectada
  @Post(':id/confirm')
  async confirmDetectedIrrigation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: ConfirmIrrigationDto,
    @Request() req,
  ) {
    return this.irrigationService.confirmDetectedIrrigation(id, {
      ...data,
      userId: req.user.sub,
    });
  }
}
