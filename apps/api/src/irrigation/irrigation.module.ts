import { Module } from '@nestjs/common';
import { IrrigationController } from './irrigation.controller';
import { PublicIrrigationController } from './public-irrigation.controller';
import { IrrigationService } from './irrigation.service';
import { PrismaService } from 'src/prisma.service';
import { AuthModule } from '../auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import { WebsocketModule } from '../websocket/websocket.module';

@Module({
  imports: [
    AuthModule,
    WebsocketModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'defaultSecret',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [
    IrrigationController,
    PublicIrrigationController,
  ],
  providers: [IrrigationService, PrismaService],
  exports: [IrrigationService],
})
export class IrrigationModule {}
