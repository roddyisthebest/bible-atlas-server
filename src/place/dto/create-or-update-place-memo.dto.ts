import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateOrUpdatePlaceMemoDto {
  @IsString()
  @IsNotEmpty()
  text: string;
}
