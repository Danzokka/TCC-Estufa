import { Module } from '@nestjs/common';
import { IbgeService } from './ibge.service';
import { IbgeController } from './ibge.controller';
import { HttpModule } from '@nestjs/axios';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [HttpModule, AuthModule],
  providers: [IbgeService],
  controllers: [IbgeController],
  exports: [IbgeService],
})
export class IbgeModule {}
