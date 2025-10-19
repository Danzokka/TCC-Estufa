import { Module } from '@nestjs/common';
import { IrrigationController } from './irrigation.controller';
import { IrrigationService } from './irrigation.service';

@Module({
  controllers: [IrrigationController],
  providers: [IrrigationService],
  exports: [IrrigationService],
})
export class IrrigationModule {}
