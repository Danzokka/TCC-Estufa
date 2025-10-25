import { IsString, IsOptional, IsUUID } from 'class-validator';

export class LinkPlantDto {
  @IsUUID()
  plantId: string;

  @IsUUID()
  greenhouseId: string;

  @IsOptional()
  @IsString()
  nickname?: string;
}
