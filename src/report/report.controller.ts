import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ReportService } from './report.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { UserId } from 'src/common/decorator/user-id.decorator';
import { Public } from 'src/auth/decorator/public.decorator';

@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Public()
  @Post()
  create(
    @Body() createReportDto: CreateReportDto,
    @UserId({ isPublic: true }) userId: number,
  ) {
    return this.reportService.create(createReportDto, userId);
  }

  @Get()
  findAll() {
    return this.reportService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reportService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateReportDto: UpdateReportDto) {
    return this.reportService.update(+id, updateReportDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.reportService.remove(+id);
  }
}
