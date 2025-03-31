import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ReportType } from 'src/user/entities/user-proposal-report.entity';

export class CreateProposalReportDto {
  @IsEnum(ReportType)
  @IsNotEmpty()
  type: ReportType;

  @IsOptional()
  @IsString()
  reason: string;
}
