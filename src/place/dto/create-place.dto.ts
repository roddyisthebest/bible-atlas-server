import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { PlaceStereo } from '../const/place.const';
import { PlaceType } from 'src/place-type/entities/place-type.entity';

export class CreatePlaceDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsBoolean()
  @IsNotEmpty()
  isModern: boolean = true;

  @IsString()
  @IsOptional()
  description: string;

  @IsEnum(PlaceStereo)
  @IsNotEmpty()
  stereo: PlaceStereo = PlaceStereo.parent;

  @IsString()
  @IsOptional()
  verse: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsNumber({}, { each: true })
  typeIds: number[];
}
