import { Module, forwardRef } from '@nestjs/common';
import { SensorController } from './sensor.controller';
import { SensorService } from './sensor.service';
import { PrismaService } from 'src/prisma.service';
import { IrrigationModule } from '../irrigation/irrigation.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    forwardRef(() => IrrigationModule),
    forwardRef(() => NotificationsModule),
  ],
  controllers: [SensorController],
  providers: [SensorService, PrismaService],
  exports: [SensorService],
})
export class SensorModule {}
