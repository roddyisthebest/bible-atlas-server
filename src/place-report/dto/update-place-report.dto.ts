import { PartialType } from '@nestjs/mapped-types';
import { CreatePlaceReportDto } from './create-place-report.dto';

export class UpdatePlaceReportDto extends PartialType(CreatePlaceReportDto) {}
