import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePlaceReportDto } from './dto/create-place-report.dto';
import { UpdatePlaceReportDto } from './dto/update-place-report.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { PlaceReport } from './entities/place-report.entity';
import { Repository } from 'typeorm';
import { Place } from 'src/place/entities/place.entity';
import { PagePaginationDto } from 'src/common/dto/page-pagination.dto';
import { CommonService } from 'src/common/common.service';
import { instanceToPlain } from 'class-transformer';
import { MinimumRole } from 'src/auth/decorator/minimun-role.decorator';
import { Role } from 'src/user/entities/user.entity';

@Injectable()
export class PlaceReportService {
  constructor(
    @InjectRepository(PlaceReport)
    private readonly placeReportRepository: Repository<PlaceReport>,
    @InjectRepository(Place)
    private readonly placeRepository: Repository<Place>,
    private readonly commonService: CommonService,
  ) {}

  async create(createPlaceReportDto: CreatePlaceReportDto, userId: number) {
    const { placeId, type, reason } = createPlaceReportDto;

    const place = await this.placeRepository.findOne({
      where: { id: placeId },
    });

    if (!place) {
      throw new NotFoundException('존재하지 않은 장소입니다.');
    }

    const report = await this.placeReportRepository.save({
      type,
      reason,
      place,
      creator: { id: userId },
    });

    return report.id;
  }

  async findAll(dto: PagePaginationDto) {
    const { limit, page } = dto;

    const qb = this.placeReportRepository
      .createQueryBuilder('placeReport')
      .leftJoinAndSelect('placeReport.creator', 'user')
      .leftJoinAndSelect('placeReport.place', 'place');

    this.commonService.applyPagePaginationParamsToQb(qb, { limit, page });
    let [data, total] = await qb.getManyAndCount();

    return {
      total,
      page,
      limit,
      data: instanceToPlain(data),
    };
  }

  async findOne(id: number) {
    const placeReport = await this.placeReportRepository.findOne({
      where: { id },
    });

    if (!placeReport) {
      throw new NotFoundException('존재하지 않는 장소 리포트입니다.');
    }

    return placeReport;
  }

  async update(id: number, updatePlaceReportDto: UpdatePlaceReportDto) {
    const place = await this.placeRepository.findOne({
      where: { id: updatePlaceReportDto.placeId },
    });

    if (!place) {
      throw new NotFoundException('존재하지 않은 장소입니다.');
    }

    await this.findOne(id);

    await this.placeReportRepository.update(id, { ...updatePlaceReportDto });

    const updatedPlaceReport = await this.findOne(id);

    return updatedPlaceReport;
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.placeReportRepository.delete({ id });

    return id;
  }
}
