import { IsNotEmpty, IsNumber } from 'class-validator';

export class FindAllByCoordinateDto {
  @IsNumber()
  @IsNotEmpty()
  swLatitude: number;

  @IsNumber()
  @IsNotEmpty()
  swLongitude: number;

  @IsNumber()
  @IsNotEmpty()
  neLatitude: number;

  @IsNumber()
  @IsNotEmpty()
  neLongitude: number;
}
