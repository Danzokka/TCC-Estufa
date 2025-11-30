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
  IrrigationStatsQueryDto,
  AIIrrigationReportDto,
  AIPredictionNotificationDto,
} from './dto/irrigation.dto';
import { AuthGuard } from '../auth/guards/auth.guard';

@Controller('irrigation')
export class IrrigationController {
  constructor(private irrigationService: IrrigationService) {}

  /**
   * AI Service endpoint - Report automatic irrigation event
   * This endpoint is NOT protected by auth guard (internal use by AI service)
   */
  @Post('ai/report')
  async reportAIIrrigation(@Body() data: AIIrrigationReportDto) {
    return this.irrigationService.recordAIIrrigation(data);
  }

  /**
   * AI Service endpoint - Send LSTM prediction notification
   * This endpoint is NOT protected by auth guard (internal use by AI service)
   * Used when AI predicts soil will dry based on environmental trends
   */
  @Post('ai/prediction')
  async sendAIPrediction(@Body() data: AIPredictionNotificationDto) {
    return this.irrigationService.sendPredictionNotification(data);
  }

  // Criar nova irrigação
  @Post()
  @UseGuards(AuthGuard)
  async createIrrigation(@Body() data: CreateIrrigationDto, @Request() req) {
    // Se não tiver userId, usar o usuário logado
    if (!data.userId) {
      data.userId = req.user.sub;
    }

    return this.irrigationService.createIrrigation(data);
  }

  // Buscar todas as irrigações com filtros
  @Get()
  @UseGuards(AuthGuard)
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
  @UseGuards(AuthGuard)
  async getIrrigationById(@Param('id', ParseUUIDPipe) id: string) {
    return this.irrigationService.getIrrigationById(id);
  }

  // Atualizar irrigação
  @Put(':id')
  @UseGuards(AuthGuard)
  async updateIrrigation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: UpdateIrrigationDto,
  ) {
    return this.irrigationService.updateIrrigation(id, data);
  }

  // Deletar irrigação
  @Delete(':id')
  @UseGuards(AuthGuard)
  async deleteIrrigation(@Param('id', ParseUUIDPipe) id: string) {
    return this.irrigationService.deleteIrrigation(id);
  }

  // Estatísticas de irrigação com período
  @Get('stats/overview')
  @UseGuards(AuthGuard)
  async getIrrigationStats(
    @Query() query: IrrigationStatsQueryDto,
    @Request() req?: any,
  ) {
    return this.irrigationService.getIrrigationStats(
      query.greenhouseId,
      req?.user?.sub,
      query.period || 'week',
    );
  }

  // Histórico de irrigação para gráfico
  @Get('stats/history')
  @UseGuards(AuthGuard)
  async getIrrigationHistory(
    @Query() query: IrrigationStatsQueryDto,
    @Request() req?: any,
  ) {
    return this.irrigationService.getIrrigationHistory(
      query.greenhouseId,
      req?.user?.sub,
      query.period || 'week',
    );
  }

  // Confirmar irrigação detectada
  @Post(':id/confirm')
  @UseGuards(AuthGuard)
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
