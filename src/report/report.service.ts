import { Injectable } from '@nestjs/common';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { Repository } from 'typeorm';
import { UserLocationReport } from 'src/user/entities/user-location-report.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { FindAllDto } from 'src/location/dto/find-all.dto';
import { CommonService } from 'src/common/common.service';

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(UserLocationReport)
    private readonly userLocationReportRepository: Repository<UserLocationReport>,
    private readonly commonService: CommonService,
  ) {}

  create(createReportDto: CreateReportDto) {
    return 'This action adds a new report';
  }

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
      data,
    };
  }

  findOne(id: number) {
    return `This action returns a #${id} report`;
  }

  update(id: number, updateReportDto: UpdateReportDto) {
    return `This action updates a #${id} report`;
  }

  remove(id: number) {
    return `This action removes a #${id} report`;
  }
}
