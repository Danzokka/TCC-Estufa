import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SensorModule } from './sensor/sensor.module';
import { PrismaService } from './prisma.service';
import { UserModule } from './user/user.module';
import { BlogModule } from './blog/blog.module';
import { PlantModule } from './plant/plant.module';
import { AuthModule } from './auth/auth.module';
// import { PumpModule } from './pump/pump.module'; // TEMPORARILY DISABLED - Schema migration needed
// import { GreenhouseModule } from './greenhouse/greenhouse.module'; // TEMPORARILY DISABLED - Schema migration needed
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { IrrigationModule } from './irrigation/irrigation.module';
import { WebsocketModule } from './websocket/websocket.module';
import { NotificationsModule } from './notifications/notifications.module';
import { WeatherModule } from './weather/weather.module';
// import { AnalyticsModule } from './analytics/analytics.module'; // TEMPORARILY DISABLED - Schema migration needed
import { IbgeModule } from './ibge/ibge.module';
import { GeocodingModule } from './geocoding/geocoding.module';
@Module({
  imports: [
    SensorModule,
    UserModule,
    BlogModule,
    PlantModule,
    AuthModule,
    // PumpModule, // TEMPORARILY DISABLED
    // GreenhouseModule, // TEMPORARILY DISABLED
    ConfigModule.forRoot({
      isGlobal: true, // Makes the configuration available globally
      envFilePath: '.env', // Path to your .env file
    }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1 segundo
        limit: 3, // 3 requests por segundo
      },
      {
        name: 'medium',
        ttl: 10000, // 10 segundos
        limit: 20, // 20 requests por 10 segundos
      },
      {
        name: 'long',
        ttl: 60000, // 1 minuto
        limit: 100, // 100 requests por minuto
      },
    ]),
    IrrigationModule,
    WebsocketModule,
    NotificationsModule,
    WeatherModule,
    // AnalyticsModule, // TEMPORARILY DISABLED
    IbgeModule,
    GeocodingModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
