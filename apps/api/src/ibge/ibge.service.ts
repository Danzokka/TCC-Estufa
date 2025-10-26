import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface IBGEMunicipio {
  id: number;
  nome: string;
  microrregiao: {
    id: number;
    nome: string;
    mesorregiao: {
      id: number;
      nome: string;
      UF: {
        id: number;
        sigla: string;
        nome: string;
        regiao: {
          id: number;
          sigla: string;
          nome: string;
        };
      };
    };
  };
}

@Injectable()
export class IbgeService {
  private readonly logger = new Logger(IbgeService.name);
  private readonly IBGE_API_BASE_URL = 'https://servicodados.ibge.gov.br/api/v1/localidades';

  constructor(private readonly httpService: HttpService) {}

  /**
   * Busca municípios brasileiros por termo de pesquisa
   */
  async searchMunicipios(searchTerm: string): Promise<IBGEMunicipio[]> {
    try {
      this.logger.log(`Buscando municípios com termo: ${searchTerm}`);

      const response = await firstValueFrom(
        this.httpService.get(`${this.IBGE_API_BASE_URL}/municipios`, {
          params: {
            nome: searchTerm,
            orderBy: 'nome',
          },
        }),
      );

      const municipios = response.data as IBGEMunicipio[];
      
      this.logger.log(`Encontrados ${municipios.length} municípios`);
      return municipios;
    } catch (error) {
      this.logger.error(`Erro ao buscar municípios: ${error.message}`);
      throw new Error(`Falha ao buscar municípios: ${error.message}`);
    }
  }

  /**
   * Busca municípios por UF (estado)
   */
  async getMunicipiosByUF(ufSigla: string): Promise<IBGEMunicipio[]> {
    try {
      this.logger.log(`Buscando municípios do estado: ${ufSigla}`);

      const response = await firstValueFrom(
        this.httpService.get(`${this.IBGE_API_BASE_URL}/estados/${ufSigla}/municipios`),
      );

      const municipios = response.data as IBGEMunicipio[];
      
      this.logger.log(`Encontrados ${municipios.length} municípios no estado ${ufSigla}`);
      return municipios;
    } catch (error) {
      this.logger.error(`Erro ao buscar municípios por UF: ${error.message}`);
      throw new Error(`Falha ao buscar municípios do estado: ${error.message}`);
    }
  }

  /**
   * Formata nome do município para uso com APIs de clima
   */
  formatMunicipioForWeather(municipio: IBGEMunicipio): string {
    const nome = municipio.nome;
    const uf = municipio.microrregiao.mesorregiao.UF.sigla;
    return `${nome}, ${uf}`;
  }
}
