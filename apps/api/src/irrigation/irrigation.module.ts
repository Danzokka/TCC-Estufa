import { Module, forwardRef } from '@nestjs/common';
import { IrrigationController } from './irrigation.controller';
import { IrrigationService } from './irrigation.service';
import { PrismaService } from 'src/prisma.service';
import { AuthModule } from '../auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import { WebsocketModule } from '../websocket/websocket.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    AuthModule,
    WebsocketModule,
    forwardRef(() => NotificationsModule),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'defaultSecret',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [IrrigationController],
  providers: [IrrigationService, PrismaService],
  exports: [IrrigationService],
})
export class IrrigationModule {}
