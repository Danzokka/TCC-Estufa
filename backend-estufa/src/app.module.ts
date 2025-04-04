import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SensorModule } from './sensor/sensor.module';
import { PrismaService } from './prisma.service';

@Module({
  imports: [SensorModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
