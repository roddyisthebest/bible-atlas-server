import { Module } from '@nestjs/common';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserLocationReport } from 'src/user/entities/user-location-report.entity';
import { CommonModule } from 'src/common/common.module';
import { UserProposalReport } from 'src/user/entities/user-proposal-report.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserLocationReport, UserProposalReport]),
    CommonModule,
  ],
  controllers: [ReportController],
  providers: [ReportService],
})
export class ReportModule {}
