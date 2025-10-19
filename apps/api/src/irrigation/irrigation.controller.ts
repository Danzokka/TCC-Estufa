import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  UseGuards,
  Put,
} from '@nestjs/common';
import { IrrigationService } from './irrigation.service';
import { CreateIrrigationDto } from './dto/create-irrigation.dto';
import { ConfirmIrrigationDto } from './dto/confirm-irrigation.dto';
import { AuthGuard } from '../auth/auth.guard';

@Controller('irrigation')
@UseGuards(AuthGuard)
export class IrrigationController {
  constructor(private readonly irrigationService: IrrigationService) {}

  @Post('manual')
  async createManualIrrigation(
    @Body() createIrrigationDto: CreateIrrigationDto,
  ) {
    return this.irrigationService.createManualIrrigation(createIrrigationDto);
  }

  @Post('detect/:sensorId')
  async detectIrrigation(@Param('sensorId') sensorId: string) {
    return this.irrigationService.detectIrrigation(sensorId);
  }

  @Get('history/:greenhouseId')
  async getIrrigationHistory(@Param('greenhouseId') greenhouseId: string) {
    return this.irrigationService.getIrrigationHistory(greenhouseId);
  }

  @Put('confirm')
  async confirmIrrigation(@Body() confirmIrrigationDto: ConfirmIrrigationDto) {
    return this.irrigationService.confirmIrrigation(confirmIrrigationDto);
  }
}
