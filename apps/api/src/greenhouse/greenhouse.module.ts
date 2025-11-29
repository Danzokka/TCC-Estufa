import { Module } from '@nestjs/common';
import { GreenhouseService } from './greenhouse.service';
import { GreenhouseController } from './greenhouse.controller';
import { PrismaService } from '../prisma.service';
import { JwtModule } from '@nestjs/jwt';
import { GeocodingModule } from '../geocoding/geocoding.module';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'defaultSecret',
      signOptions: { expiresIn: '1d' },
    }),
    GeocodingModule,
  ],
  controllers: [GreenhouseController],
  providers: [GreenhouseService, PrismaService],
  exports: [GreenhouseService],
})
export class GreenhouseModule {}
