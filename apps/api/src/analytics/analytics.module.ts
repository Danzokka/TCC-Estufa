import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { AiIntegrationService } from './ai-integration.service';
import { PrismaService } from '../prisma.service';
import { WeatherService } from '../weather/weather.service';
import { WeatherModule } from '../weather/weather.module';

@Module({
  imports: [
    HttpModule.register({
      timeout: 30000, // 30 segundos para chamadas de IA
      maxRedirects: 3,
    }),
    WeatherModule,
  ],
  controllers: [AnalyticsController],
  providers: [
    AnalyticsService,
    AiIntegrationService,
    PrismaService,
  ],
  exports: [AnalyticsService, AiIntegrationService],
})
export class AnalyticsModule {}
