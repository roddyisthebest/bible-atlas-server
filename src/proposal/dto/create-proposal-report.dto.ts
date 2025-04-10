import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum ReportType {
  SPAM,
  INAPPROPRIATE,
  HATE_SPEECH,
  HARASSMENT,
  FALSE_INFORMATION,
  PERSONAL_INFO,
  ETC,
}

export class CreateProposalReportDto {
  @IsEnum(ReportType)
  @IsNotEmpty()
  type: ReportType;

  @IsOptional()
  @IsString()
  reason: string;
}
