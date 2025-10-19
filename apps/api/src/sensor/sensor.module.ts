import { Module } from '@nestjs/common';
import { SensorController } from './sensor.controller';
import { SensorService } from './sensor.service';
import { PrismaService } from 'src/prisma.service';
import { IrrigationModule } from '../irrigation/irrigation.module';

@Module({
  imports: [IrrigationModule],
  controllers: [SensorController],
  providers: [SensorService, PrismaService],
  exports: [SensorService],
})
export class SensorModule {}
