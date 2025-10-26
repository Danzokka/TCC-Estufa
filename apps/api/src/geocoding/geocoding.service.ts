import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);
  private readonly BIGDATACLOUD_API = 'https://api.bigdatacloud.net/data/reverse-geocode-client';

  constructor(private readonly httpService: HttpService) {}

  async getStateFromCoordinates(latitude: number, longitude: number): Promise<string> {
    try {
      this.logger.log(`Buscando estado para coordenadas: ${latitude}, ${longitude}`);
      
      const response = await firstValueFrom(
        this.httpService.get(this.BIGDATACLOUD_API, {
          params: {
            latitude,
            longitude,
            localityLanguage: 'pt',
          },
        }),
      );

      const data = response.data;
      
      // Tentar diferentes campos para obter o estado
      let state = data.principalSubdivision || 
                  data.localityInfo?.administrative?.[1]?.name ||
                  data.localityInfo?.administrative?.[0]?.name;
      
      if (!state) {
        // Fallback para outros campos possíveis
        state = data.city || data.locality || data.countryName;
        this.logger.warn(`Estado não encontrado, usando fallback: ${state}`);
      }

      if (!state) {
        throw new Error('Estado não identificado');
      }

      this.logger.log(`Coordenadas (${latitude}, ${longitude}) -> Estado: ${state}`);
      return state;
    } catch (error) {
      this.logger.error(`Erro ao obter estado: ${error.message}`);
      throw new Error('Falha ao identificar estado a partir das coordenadas');
    }
  }
}
