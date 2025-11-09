import { Module, forwardRef } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationGeneratorService } from './notification-generator.service';
import { PrismaService } from '../prisma.service';
import { JwtService } from '@nestjs/jwt';
// import { PlantModule } from '../plant/plant.module'; // TEMPORARILY DISABLED
import { WebsocketModule } from '../websocket/websocket.module';

@Module({
  imports: [
    // PlantModule, // TEMPORARILY DISABLED
    forwardRef(() => WebsocketModule),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationGeneratorService,
    PrismaService,
    JwtService,
  ],
  exports: [NotificationsService, NotificationGeneratorService],
})
export class NotificationsModule {}
