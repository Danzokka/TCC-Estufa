import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { WeatherService } from './weather.service';
import { WeatherController } from './weather.controller';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000, // 10 segundos
      maxRedirects: 3,
    }),
  ],
  controllers: [WeatherController],
  providers: [WeatherService, PrismaService],
  exports: [WeatherService],
})
export class WeatherModule {}
