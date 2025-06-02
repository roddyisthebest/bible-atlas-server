import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { PagePaginationDto } from 'src/common/dto/page-pagination.dto';
import { PlaceStereo } from '../const/place.const';

export class GetPlacesDto extends PagePaginationDto {
  @IsString()
  @IsOptional()
  name: string;

  @IsBoolean()
  @IsOptional()
  isModern: boolean;

  @IsEnum(PlaceStereo)
  stereo: PlaceStereo = PlaceStereo.parent;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  typeIds: number[];

  @IsString()
  @IsOptional()
  prefix: string;
}
