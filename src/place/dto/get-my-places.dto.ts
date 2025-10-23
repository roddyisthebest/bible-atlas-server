import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { PagePaginationDto } from 'src/common/dto/page-pagination.dto';
import { PlaceFilter } from '../const/place.const';

export class GetMyPlacesDto extends PagePaginationDto {
  @IsNotEmpty()
  @IsEnum(PlaceFilter)
  filter: PlaceFilter = PlaceFilter.like;
}
