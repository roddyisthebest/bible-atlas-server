import { BadRequestException, Injectable } from '@nestjs/common';
import { CreatePlaceTypeDto } from './dto/create-place-type.dto';
import { UpdatePlaceTypeDto } from './dto/update-place-type.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { PlaceType } from './entities/place-type.entity';
import { Not, Repository } from 'typeorm';
import { CommonService } from 'src/common/common.service';
import { PagePaginationDto } from 'src/common/dto/page-pagination.dto';
import { instanceToPlain } from 'class-transformer';

@Injectable()
export class PlaceTypeService {
  constructor(
    @InjectRepository(PlaceType)
    private readonly placeTypeRepository: Repository<PlaceType>,
    private readonly commonService: CommonService,
  ) {}

  async create(createPlaceTypeDto: CreatePlaceTypeDto) {
    const { name } = createPlaceTypeDto;

    const placeType = await this.placeTypeRepository.findOne({
      where: { name },
    });

    if (placeType) {
      throw new BadRequestException('이미 등록된 장소 타입입니다.');
    }

    const newPlaceType = await this.placeTypeRepository.save({ name });

    return newPlaceType;
  }

  async findAll(dto: PagePaginationDto) {
    const { limit, page } = dto;

    const qb = this.placeTypeRepository.createQueryBuilder('placeType');
    this.commonService.applyPagePaginationParamsToQb(qb, { limit, page });

    const [placeTypes, total] = await qb.getManyAndCount();

    const data = await Promise.all(
      placeTypes.map(async (placeType) => {
        const placeCount = await this.placeTypeRepository.query(
          `
          SELECT COUNT(*) as count
          FROM place_place_type ppt
          INNER JOIN place p ON p.id = ppt."placeId"
          WHERE ppt."placeTypeId" = $1 AND p."isModern" = false
          `,
          [placeType.id]
        );
        
        return {
          ...placeType,
          placeCount: parseInt(placeCount[0].count) || 0,
        };
      })
    );

    return {
      total,
      page,
      limit,
      data: instanceToPlain(data),
    };
  }

  delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async findOne(id: number) {
    const placeType = await this.placeTypeRepository.findOne({ where: { id } });

    if (!placeType) {
      throw new BadRequestException('등록된 장소 타입이 아닙니다.');
    }

    return placeType;
  }

  async update(id: number, updatePlaceTypeDto: UpdatePlaceTypeDto) {
    const { name } = updatePlaceTypeDto;

    const placeType = await this.findOne(id);

    const isNameUnchanged = placeType.name === name;

    if (isNameUnchanged) {
      throw new BadRequestException(
        '기존과 동일한 이름으로는 변경할 수 없습니다.',
      );
    }

    const duplicatedPlaceType = await this.placeTypeRepository.findOne({
      where: {
        name,
        id: Not(id),
      },
    });

    if (duplicatedPlaceType) {
      throw new BadRequestException('중복된 이름의 장소 타입이 존재합니다.');
    }

    await this.placeTypeRepository.update({ id }, { ...updatePlaceTypeDto });
    const updatedPlaceType = await this.findOne(id);
    return updatedPlaceType;
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.placeTypeRepository.delete({ id });

    return id;
  }
}
