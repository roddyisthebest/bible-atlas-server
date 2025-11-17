import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ReportType } from '../entities/report.entity';

export class CreateReportDto {
  @IsEnum(ReportType)
  type: ReportType;

  @IsString()
  comment: string;
}
