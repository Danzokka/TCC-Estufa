import { Module } from '@nestjs/common';
import { SensorController } from './sensor.controller';
import { SensorService } from './sensor.service';
import { PrismaService } from 'src/prisma.service';

@Module({
  controllers: [SensorController],
  providers: [SensorService, PrismaService]
})
export class SensorModule {}
