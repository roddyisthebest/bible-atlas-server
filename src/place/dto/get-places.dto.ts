import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { PagePaginationDto } from 'src/common/dto/page-pagination.dto';
import {
  BibleBook,
  PlaceSort,
  PlaceStereo,
  PlaceType,
} from '../const/place.const';
import { Transform } from 'class-transformer';

export class GetPlacesDto extends PagePaginationDto {
  @IsString()
  @IsOptional()
  name: string;

  @IsBoolean()
  @IsOptional()
  isModern: boolean = false;

  @IsEnum(PlaceStereo)
  @IsOptional()
  stereo: PlaceStereo;

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @IsEnum(PlaceType, { each: true })
  placeTypes: PlaceType[];

  @IsString()
  @IsOptional()
  prefix: string;

  @IsEnum(PlaceSort)
  sort: PlaceSort = PlaceSort.asc;

  @IsOptional()
  @IsEnum(BibleBook)
  bibleBook: BibleBook;
}
