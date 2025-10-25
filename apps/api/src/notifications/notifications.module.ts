import { Module, forwardRef } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { PublicNotificationsController } from './public-notifications.controller';
import { NotificationGeneratorService } from './notification-generator.service';
import { PrismaService } from '../prisma.service';
import { JwtService } from '@nestjs/jwt';
import { PlantModule } from '../plant/plant.module';
import { WebsocketModule } from '../websocket/websocket.module';

@Module({
  imports: [PlantModule, forwardRef(() => WebsocketModule)],
  controllers: [NotificationsController, PublicNotificationsController],
  providers: [
    NotificationsService,
    NotificationGeneratorService,
    PrismaService,
    JwtService,
  ],
  exports: [NotificationsService, NotificationGeneratorService],
})
export class NotificationsModule {}
