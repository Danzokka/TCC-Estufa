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
import { WeatherService } from './weather.service';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';

@ApiTags('Weather')
@Controller('weather')
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Get('historical/:greenhouseId')
  @ApiOperation({ summary: 'Buscar dados climáticos históricos para uma estufa' })
  @ApiParam({ name: 'greenhouseId', description: 'ID da estufa' })
  @ApiQuery({ name: 'date', description: 'Data no formato YYYY-MM-DD', required: false })
  @ApiResponse({ status: 200, description: 'Dados climáticos históricos retornados com sucesso' })
  @ApiResponse({ status: 404, description: 'Estufa não encontrada' })
  async getHistoricalWeather(
    @Param('greenhouseId', ParseUUIDPipe) greenhouseId: string,
    @Query('date') date?: string,
  ) {
    try {
      // Se não fornecer data, usar ontem
      const targetDate = date || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      // Buscar estufa para obter localização
      const greenhouse = await this.weatherService['prisma'].greenhouse.findUnique({
        where: { id: greenhouseId },
      });

      if (!greenhouse) {
        throw new HttpException('Estufa não encontrada', HttpStatus.NOT_FOUND);
      }

      if (!greenhouse.location) {
        throw new HttpException('Estufa não possui localização configurada', HttpStatus.BAD_REQUEST);
      }

      const weatherData = await this.weatherService.fetchHistoricalWeather(
        greenhouse.location,
        targetDate,
      );

      return {
        success: true,
        data: weatherData,
        greenhouse: {
          id: greenhouse.id,
          name: greenhouse.name,
          location: greenhouse.location,
        },
        date: targetDate,
      };
    } catch (error) {
      throw new HttpException(
        `Erro ao buscar dados históricos: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('forecast/:greenhouseId')
  @ApiOperation({ summary: 'Buscar previsão do tempo para uma estufa' })
  @ApiParam({ name: 'greenhouseId', description: 'ID da estufa' })
  @ApiQuery({ name: 'days', description: 'Número de dias de previsão (máximo 3)', required: false })
  @ApiResponse({ status: 200, description: 'Previsão do tempo retornada com sucesso' })
  @ApiResponse({ status: 404, description: 'Estufa não encontrada' })
  async getForecast(
    @Param('greenhouseId', ParseUUIDPipe) greenhouseId: string,
    @Query('days') days?: string,
  ) {
    try {
      const daysNumber = days ? parseInt(days, 10) : 3;
      
      // Buscar estufa para obter localização
      const greenhouse = await this.weatherService['prisma'].greenhouse.findUnique({
        where: { id: greenhouseId },
      });

      if (!greenhouse) {
        throw new HttpException('Estufa não encontrada', HttpStatus.NOT_FOUND);
      }

      if (!greenhouse.location) {
        throw new HttpException('Estufa não possui localização configurada', HttpStatus.BAD_REQUEST);
      }

      const forecastData = await this.weatherService.fetchForecast(
        greenhouse.location,
        daysNumber,
      );

      return {
        success: true,
        data: forecastData,
        greenhouse: {
          id: greenhouse.id,
          name: greenhouse.name,
          location: greenhouse.location,
        },
        days: daysNumber,
      };
    } catch (error) {
      throw new HttpException(
        `Erro ao buscar previsão: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('period/:greenhouseId')
  @ApiOperation({ summary: 'Buscar dados climáticos de um período específico' })
  @ApiParam({ name: 'greenhouseId', description: 'ID da estufa' })
  @ApiQuery({ name: 'start', description: 'Data de início (YYYY-MM-DD)' })
  @ApiQuery({ name: 'end', description: 'Data de fim (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Dados climáticos do período retornados com sucesso' })
  @ApiResponse({ status: 404, description: 'Estufa não encontrada' })
  async getWeatherDataForPeriod(
    @Param('greenhouseId', ParseUUIDPipe) greenhouseId: string,
    @Query('start') start: string,
    @Query('end') end: string,
  ) {
    try {
      const startDate = new Date(start);
      const endDate = new Date(end);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new HttpException('Formato de data inválido. Use YYYY-MM-DD', HttpStatus.BAD_REQUEST);
      }

      if (startDate > endDate) {
        throw new HttpException('Data de início deve ser anterior à data de fim', HttpStatus.BAD_REQUEST);
      }

      const weatherData = await this.weatherService.getWeatherDataForPeriod(
        greenhouseId,
        startDate,
        endDate,
      );

      return {
        success: true,
        data: weatherData,
        period: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0],
        },
        count: weatherData.length,
      };
    } catch (error) {
      throw new HttpException(
        `Erro ao buscar dados do período: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('sync/:greenhouseId')
  @ApiOperation({ summary: 'Sincronizar dados climáticos históricos para uma estufa' })
  @ApiParam({ name: 'greenhouseId', description: 'ID da estufa' })
  @ApiQuery({ name: 'days', description: 'Número de dias para sincronizar (padrão: 7)', required: false })
  @ApiResponse({ status: 200, description: 'Sincronização iniciada com sucesso' })
  @ApiResponse({ status: 404, description: 'Estufa não encontrada' })
  async syncHistoricalData(
    @Param('greenhouseId', ParseUUIDPipe) greenhouseId: string,
    @Query('days') days?: string,
  ) {
    try {
      const daysNumber = days ? parseInt(days, 10) : 7;

      if (daysNumber < 1 || daysNumber > 7) {
        throw new HttpException('Número de dias deve estar entre 1 e 7', HttpStatus.BAD_REQUEST);
      }

      await this.weatherService.syncHistoricalData(greenhouseId, daysNumber);

      return {
        success: true,
        message: `Sincronização iniciada para ${daysNumber} dias`,
        greenhouseId,
        days: daysNumber,
      };
    } catch (error) {
      throw new HttpException(
        `Erro na sincronização: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
