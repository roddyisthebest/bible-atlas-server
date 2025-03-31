import { Injectable } from '@nestjs/common';

import { Repository } from 'typeorm';
import { UserLocationReport } from 'src/user/entities/user-location-report.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { FindAllDto } from 'src/location/dto/find-all.dto';
import { CommonService } from 'src/common/common.service';
import { UserProposalReport } from 'src/user/entities/user-proposal-report.entity';
import { instanceToPlain } from 'class-transformer';

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(UserLocationReport)
    private readonly userLocationReportRepository: Repository<UserLocationReport>,
    private readonly commonService: CommonService,
    @InjectRepository(UserProposalReport)
    private readonly userProposalReportRepository: Repository<UserProposalReport>,
  ) {}

  async findLocationReports({ limit, page }: FindAllDto) {
    const qb = this.userLocationReportRepository.createQueryBuilder('ulr');

    this.commonService.applyPagePaginationParamsToQb(qb, { limit, page });

    qb.orderBy('ulr.createdAt', 'DESC');
    qb.leftJoinAndSelect('ulr.user', 'user').leftJoinAndSelect(
      'ulr.location',
      'location',
    );

    const [data, total] = await qb.getManyAndCount();

    return {
      total,
      page,
      limit,
      data: instanceToPlain(data),
    };
  }

  async findProposalReports({ limit, page }: FindAllDto) {
    const qb = this.userProposalReportRepository.createQueryBuilder('upr');
    this.commonService.applyPagePaginationParamsToQb(qb, { limit, page });
    qb.orderBy('upr.createdAt', 'DESC');
    qb.leftJoinAndSelect('upr.user', 'user').leftJoinAndSelect(
      'upr.proposal',
      'proposal',
    );

    const [data, total] = await qb.getManyAndCount();

    return {
      total,
      page,
      limit,
      data: instanceToPlain(data),
    };
  }
}
