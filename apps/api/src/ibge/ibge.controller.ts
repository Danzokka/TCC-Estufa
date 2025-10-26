import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { IbgeService } from './ibge.service';
import { AuthGuard } from '../auth/guards/auth.guard';

@Controller('ibge')
@UseGuards(AuthGuard)
export class IbgeController {
  constructor(private readonly ibgeService: IbgeService) {}

  @Get('municipios')
  async searchMunicipios(@Query('search') search: string) {
    if (!search || search.trim().length < 2) {
      return [];
    }

    const municipios = await this.ibgeService.searchMunicipios(search.trim());
    
    // Retorna apenas os dados necessários para o frontend
    return municipios.map(municipio => ({
      id: municipio.id,
      nome: municipio.nome,
      uf: municipio.microrregiao.mesorregiao.UF.sigla,
      estado: municipio.microrregiao.mesorregiao.UF.nome,
      formatted: this.ibgeService.formatMunicipioForWeather(municipio),
    }));
  }

  @Get('municipios/uf/:uf')
  async getMunicipiosByUF(@Query('uf') uf: string) {
    if (!uf || uf.length !== 2) {
      return [];
    }

    const municipios = await this.ibgeService.getMunicipiosByUF(uf.toUpperCase());
    
    // Retorna apenas os dados necessários para o frontend
    return municipios.map(municipio => ({
      id: municipio.id,
      nome: municipio.nome,
      uf: municipio.microrregiao.mesorregiao.UF.sigla,
      estado: municipio.microrregiao.mesorregiao.UF.nome,
      formatted: this.ibgeService.formatMunicipioForWeather(municipio),
    }));
  }
}
