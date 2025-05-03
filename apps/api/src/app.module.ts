import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SensorModule } from './sensor/sensor.module';
import { PrismaService } from './prisma.service';
import { UserModule } from './user/user.module';
import { BlogModule } from './blog/blog.module';
import { PlantModule } from './plant/plant.module';

@Module({
  imports: [SensorModule, UserModule, BlogModule, PlantModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
