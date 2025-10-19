import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { GreenhouseGateway } from './greenhouse.gateway';
import { TestNotificationsController } from './test-notifications.controller';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [JwtModule],
  controllers: [TestNotificationsController],
  providers: [GreenhouseGateway, NotificationsService, PrismaService],
  exports: [GreenhouseGateway],
})
export class WebsocketModule {}
