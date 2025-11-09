import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  ParseUUIDPipe,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('generate/:userPlantId')
  @ApiOperation({ summary: 'Gerar relatório para uma planta' })
  @ApiParam({ name: 'userPlantId', description: 'ID da planta do usuário' })
  @ApiQuery({ 
    name: 'type', 
    description: 'Tipo do relatório', 
    enum: ['weekly', 'monthly', 'general'],
    required: true 
  })
  @ApiResponse({ status: 201, description: 'Relatório gerado com sucesso' })
  @ApiResponse({ status: 404, description: 'Planta não encontrada' })
  async generateReport(
    @Param('userPlantId', ParseUUIDPipe) userPlantId: string,
    @Query('type') type: 'weekly' | 'monthly' | 'general',
  ) {
    try {
      let report;
      
      switch (type) {
        case 'weekly':
          report = await this.analyticsService.generateWeeklyReport(userPlantId);
          break;
        case 'monthly':
          report = await this.analyticsService.generateMonthlyReport(userPlantId);
          break;
        case 'general':
          report = await this.analyticsService.generateGeneralReport(userPlantId);
          break;
        default:
          throw new HttpException('Tipo de relatório inválido', HttpStatus.BAD_REQUEST);
      }

      return {
        success: true,
        message: `Relatório ${type} gerado com sucesso`,
        data: report,
      };
    } catch (error) {
      throw new HttpException(
        `Erro ao gerar relatório: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('reports/:userPlantId')
  @ApiOperation({ summary: 'Listar relatórios de uma planta' })
  @ApiParam({ name: 'userPlantId', description: 'ID da planta do usuário' })
  @ApiQuery({ name: 'type', description: 'Filtrar por tipo de relatório', required: false })
  @ApiResponse({ status: 200, description: 'Lista de relatórios retornada com sucesso' })
  @ApiResponse({ status: 404, description: 'Planta não encontrada' })
  async getReports(
    @Param('userPlantId', ParseUUIDPipe) userPlantId: string,
    @Query('type') type?: string,
  ) {
    try {
      const reports = await this.analyticsService.getReports(userPlantId, type);

      return {
        success: true,
        data: reports,
        count: reports.length,
      };
    } catch (error) {
      throw new HttpException(
        `Erro ao buscar relatórios: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('report/:reportId')
  @ApiOperation({ summary: 'Buscar relatório específico por ID' })
  @ApiParam({ name: 'reportId', description: 'ID do relatório' })
  @ApiResponse({ status: 200, description: 'Relatório encontrado' })
  @ApiResponse({ status: 404, description: 'Relatório não encontrado' })
  async getReportById(@Param('reportId', ParseUUIDPipe) reportId: string) {
    try {
      const report = await this.analyticsService.getReportById(reportId);

      if (!report) {
        throw new HttpException('Relatório não encontrado', HttpStatus.NOT_FOUND);
      }

      return {
        success: true,
        data: report,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Erro ao buscar relatório: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('latest/:userPlantId')
  @ApiOperation({ summary: 'Buscar último relatório de um tipo específico' })
  @ApiParam({ name: 'userPlantId', description: 'ID da planta do usuário' })
  @ApiQuery({ 
    name: 'type', 
    description: 'Tipo do relatório', 
    enum: ['weekly', 'monthly', 'general'],
    required: true 
  })
  @ApiResponse({ status: 200, description: 'Último relatório encontrado' })
  @ApiResponse({ status: 404, description: 'Relatório não encontrado' })
  async getLatestReport(
    @Param('userPlantId', ParseUUIDPipe) userPlantId: string,
    @Query('type') type: 'weekly' | 'monthly' | 'general',
  ) {
    try {
      const report = await this.analyticsService.getLatestReport(userPlantId, type);

      if (!report) {
        throw new HttpException('Nenhum relatório encontrado', HttpStatus.NOT_FOUND);
      }

      return {
        success: true,
        data: report,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Erro ao buscar último relatório: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
