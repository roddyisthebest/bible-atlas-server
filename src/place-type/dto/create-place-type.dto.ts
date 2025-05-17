import { IsNotEmpty, IsString } from 'class-validator';

export class CreatePlaceTypeDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}
