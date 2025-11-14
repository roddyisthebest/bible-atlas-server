import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { Report } from './entities/report.entity';
import { MinimumRole } from 'src/auth/decorator/minimun-role.decorator';
import { Role } from 'src/user/entities/user.entity';

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
  ) {}

  async create(createReportDto: CreateReportDto, userId?: number) {
    const report = this.reportRepository.create({
      ...createReportDto,
      creator: userId ? { id: userId } as any : null,
    });

    return await this.reportRepository.save(report);
  }

  @MinimumRole(Role.SUPER)
  async findAll() {
    return await this.reportRepository.find({
      relations: ['creator'],
      order: { createdAt: 'DESC' },
    });
  }

  @MinimumRole(Role.SUPER)
  async findOne(id: number) {
    const report = await this.reportRepository.findOne({
      where: { id },
      relations: ['creator'],
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    return report;
  }

  @MinimumRole(Role.SUPER)
  async update(id: number, updateReportDto: UpdateReportDto) {
    const report = await this.findOne(id);
    
    Object.assign(report, updateReportDto);
    return await this.reportRepository.save(report);
  }

  @MinimumRole(Role.SUPER)
  async remove(id: number) {
    const report = await this.findOne(id);
    await this.reportRepository.remove(report);
    return { id };
  }
}