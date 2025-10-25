import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../prisma.service';
import { firstValueFrom } from 'rxjs';
import { WeatherData } from '@prisma/client';

export interface WeatherApiResponse {
  location: {
    name: string;
    region: string;
    country: string;
    lat: number;
    lon: number;
    tz_id: string;
    localtime_epoch: number;
    localtime: string;
  };
  forecast?: {
    forecastday: Array<{
      date: string;
      date_epoch: number;
      day: {
        maxtemp_c: number;
        mintemp_c: number;
        avgtemp_c: number;
        maxwind_kph: number;
        totalprecip_mm: number;
        avgvis_km: number;
        avghumidity: number;
        condition: {
          text: string;
          icon: string;
          code: number;
        };
        uv: number;
      };
      astro: {
        sunrise: string;
        sunset: string;
        moonrise: string;
        moonset: string;
        moon_phase: string;
        moon_illumination: string;
      };
    }>;
  };
  history?: {
    forecastday: Array<{
      date: string;
      date_epoch: number;
      day: {
        maxtemp_c: number;
        mintemp_c: number;
        avgtemp_c: number;
        maxwind_kph: number;
        totalprecip_mm: number;
        avgvis_km: number;
        avghumidity: number;
        condition: {
          text: string;
          icon: string;
          code: number;
        };
        uv: number;
      };
      astro: {
        sunrise: string;
        sunset: string;
        moonrise: string;
        moonset: string;
        moon_phase: string;
        moon_illumination: string;
      };
    }>;
  };
}

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);
  private readonly baseUrl = process.env.WEATHER_API_BASE_URL || 'http://api.weatherapi.com/v1';
  private readonly apiKey = process.env.WEATHER_API_KEY;

  constructor(
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Busca dados climáticos históricos para uma localização e data específica
   */
  async fetchHistoricalWeather(location: string, date: string): Promise<WeatherApiResponse> {
    try {
      const url = `${this.baseUrl}/history.json`;
      const params = {
        key: this.apiKey,
        q: location,
        dt: date,
      };

      this.logger.log(`Buscando dados históricos para ${location} em ${date}`);
      
      const response = await firstValueFrom(
        this.httpService.get(url, { params })
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Erro ao buscar dados históricos: ${error.message}`);
      throw error;
    }
  }

  /**
   * Busca previsão do tempo para uma localização
   */
  async fetchForecast(location: string, days: number = 3): Promise<WeatherApiResponse> {
    try {
      const url = `${this.baseUrl}/forecast.json`;
      const params = {
        key: this.apiKey,
        q: location,
        days: days.toString(),
      };

      this.logger.log(`Buscando previsão para ${location} (${days} dias)`);
      
      const response = await firstValueFrom(
        this.httpService.get(url, { params })
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Erro ao buscar previsão: ${error.message}`);
      throw error;
    }
  }

  /**
   * Salva dados climáticos no banco de dados
   */
  async saveWeatherData(greenhouseId: string, data: any): Promise<WeatherData> {
    try {
      // Verificar se a estufa existe
      const greenhouse = await this.prisma.greenhouse.findUnique({
        where: { id: greenhouseId },
      });

      if (!greenhouse) {
        throw new NotFoundException(`Estufa com ID ${greenhouseId} não encontrada`);
      }

      // Verificar se já existe dados para esta data
      const existingData = await this.prisma.weatherData.findUnique({
        where: {
          greenhouseId_date: {
            greenhouseId,
            date: new Date(data.date),
          },
        },
      });

      if (existingData) {
        this.logger.log(`Dados climáticos já existem para ${greenhouseId} em ${data.date}`);
        return existingData;
      }

      // Salvar novos dados
      const weatherData = await this.prisma.weatherData.create({
        data: {
          greenhouseId,
          date: new Date(data.date),
          maxTemp: data.maxTemp,
          minTemp: data.minTemp,
          avgTemp: data.avgTemp,
          maxHumidity: data.maxHumidity,
          minHumidity: data.minHumidity,
          avgHumidity: data.avgHumidity,
          totalPrecip: data.totalPrecip,
          avgWind: data.avgWind,
          maxWind: data.maxWind,
          condition: data.condition,
          sunrise: data.sunrise,
          sunset: data.sunset,
        },
      });

      this.logger.log(`Dados climáticos salvos para ${greenhouseId} em ${data.date}`);
      return weatherData;
    } catch (error) {
      this.logger.error(`Erro ao salvar dados climáticos: ${error.message}`);
      throw error;
    }
  }

  /**
   * Consulta dados climáticos para um período específico
   */
  async getWeatherDataForPeriod(
    greenhouseId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<WeatherData[]> {
    try {
      const weatherData = await this.prisma.weatherData.findMany({
        where: {
          greenhouseId,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: {
          date: 'asc',
        },
      });

      this.logger.log(`Encontrados ${weatherData.length} registros climáticos para o período`);
      return weatherData;
    } catch (error) {
      this.logger.error(`Erro ao buscar dados climáticos do período: ${error.message}`);
      throw error;
    }
  }

  /**
   * Sincroniza dados climáticos históricos para uma estufa
   */
  async syncHistoricalData(greenhouseId: string, days: number = 7): Promise<void> {
    try {
      const greenhouse = await this.prisma.greenhouse.findUnique({
        where: { id: greenhouseId },
      });

      if (!greenhouse) {
        throw new NotFoundException(`Estufa com ID ${greenhouseId} não encontrada`);
      }

      if (!greenhouse.location) {
        throw new Error(`Estufa ${greenhouseId} não possui localização configurada`);
      }

      this.logger.log(`Sincronizando dados históricos para ${greenhouse.location} (${days} dias)`);

      // Buscar dados dos últimos N dias
      for (let i = 1; i <= days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateString = date.toISOString().split('T')[0];

        try {
          const weatherResponse = await this.fetchHistoricalWeather(
            greenhouse.location,
            dateString,
          );

          if (weatherResponse.history?.forecastday?.[0]) {
            const dayData = weatherResponse.history.forecastday[0];
            const astro = dayData.astro;
            const day = dayData.day;

            await this.saveWeatherData(greenhouseId, {
              date: dateString,
              maxTemp: day.maxtemp_c,
              minTemp: day.mintemp_c,
              avgTemp: day.avgtemp_c,
              maxHumidity: day.avghumidity,
              minHumidity: day.avghumidity, // WeatherAPI não fornece min/max separados
              avgHumidity: day.avghumidity,
              totalPrecip: day.totalprecip_mm,
              avgWind: day.maxwind_kph,
              maxWind: day.maxwind_kph,
              condition: day.condition.text,
              sunrise: astro.sunrise,
              sunset: astro.sunset,
            });
          }
        } catch (error) {
          this.logger.warn(`Erro ao buscar dados para ${dateString}: ${error.message}`);
        }
      }

      this.logger.log(`Sincronização concluída para ${greenhouseId}`);
    } catch (error) {
      this.logger.error(`Erro na sincronização: ${error.message}`);
      throw error;
    }
  }

  /**
   * Processa dados da WeatherAPI e converte para formato do banco
   */
  private processWeatherApiData(apiData: WeatherApiResponse, date: string) {
    const dayData = apiData.history?.forecastday?.[0] || apiData.forecast?.forecastday?.[0];
    
    if (!dayData) {
      throw new Error('Dados do dia não encontrados na resposta da API');
    }

    const astro = dayData.astro;
    const day = dayData.day;

    return {
      date,
      maxTemp: day.maxtemp_c,
      minTemp: day.mintemp_c,
      avgTemp: day.avgtemp_c,
      maxHumidity: day.avghumidity,
      minHumidity: day.avghumidity,
      avgHumidity: day.avghumidity,
      totalPrecip: day.totalprecip_mm,
      avgWind: day.maxwind_kph,
      maxWind: day.maxwind_kph,
      condition: day.condition.text,
      sunrise: astro.sunrise,
      sunset: astro.sunset,
    };
  }
}
