import { Module } from '@nestjs/common';
import { PlaceReportService } from './place-report.service';
import { PlaceReportController } from './place-report.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlaceReport } from './entities/place-report.entity';
import { Place } from 'src/place/entities/place.entity';

import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [TypeOrmModule.forFeature([PlaceReport, Place]), CommonModule],
  controllers: [PlaceReportController],
  providers: [PlaceReportService],
})
export class PlaceReportModule {}
