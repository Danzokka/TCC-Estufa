import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class UpdateLocationDto {
  @IsString()
  @IsNotEmpty()
  location: string;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;
}
