import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { ReportType } from '../entities/place-report.entity';

export class CreatePlaceReportDto {
  @IsString()
  @IsNotEmpty()
  placeId: string;

  @IsString()
  @IsOptional()
  reason: string;

  @IsEnum(ReportType)
  @IsNotEmpty()
  type: ReportType;
}
