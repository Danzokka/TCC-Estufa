import { Module } from '@nestjs/common';
import { PlantController } from './plant.controller';
import { PlantService } from './plant.service';
import { PrismaService } from 'src/prisma.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  controllers: [PlantController],
  providers: [PlantService, PrismaService, JwtService],
  exports: [PlantService],
})
export class PlantModule {}
