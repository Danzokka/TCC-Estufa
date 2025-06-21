import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SensorModule } from './sensor/sensor.module';
import { PrismaService } from './prisma.service';
import { UserModule } from './user/user.module';
import { BlogModule } from './blog/blog.module';
import { PlantModule } from './plant/plant.module';
import { AuthModule } from './auth/auth.module';
import { PumpModule } from './pump/pump.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    SensorModule,
    UserModule,
    BlogModule,
    PlantModule,
    AuthModule,
    PumpModule,
    ConfigModule.forRoot({
      isGlobal: true, // Makes the configuration available globally
      envFilePath: '.env', // Path to your .env file
    }),
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
