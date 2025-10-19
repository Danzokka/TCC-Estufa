import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { GreenhouseGateway } from './greenhouse.gateway';

@Module({
  imports: [JwtModule],
  providers: [GreenhouseGateway],
  exports: [GreenhouseGateway],
})
export class WebsocketModule {}
