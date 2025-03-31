import { Controller, Get, Query } from '@nestjs/common';
import { ReportService } from './report.service';

import { FindAllDto } from 'src/location/dto/find-all.dto';

@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('location')
  findLocationReports(@Query() findAllDto: FindAllDto) {
    return this.reportService.findLocationReports(findAllDto);
  }

  @Get('location')
  findProposalReports(@Query() findAllDto: FindAllDto) {
    return this.reportService.findProposalReports(findAllDto);
  }
}
