import { Module } from '@nestjs/common';
import { PumpController } from './pump.controller';
import { PumpService } from './pump.service';
import { PrismaService } from '../prisma.service';
import { WebsocketModule } from '../websocket/websocket.module';

@Module({
  imports: [WebsocketModule],
  controllers: [PumpController],
  providers: [PumpService, PrismaService],
  exports: [PumpService],
})
export class PumpModule {}
