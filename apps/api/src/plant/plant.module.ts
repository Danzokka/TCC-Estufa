import { Module } from '@nestjs/common';
import { PlantController } from './plant.controller';
import { PlantService } from './plant.service';
import { PlantMetricsService } from './plant-metrics.service';
import { PrismaService } from 'src/prisma.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  controllers: [PlantController],
  providers: [PlantService, PlantMetricsService, PrismaService, JwtService],
  exports: [PlantService, PlantMetricsService],
})
export class PlantModule {}
