import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { DataSource, Repository } from 'typeorm';
import { Location } from './entities/location.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { FindAllDto } from './dto/find-all.dto';
import { FindAllByCoordinateDto } from './dto/find-all-by-coordinate.dto';
import { Proposal, ProprosalType } from 'src/proposal/entities/proposal.entity';

@Injectable()
export class LocationService {
  constructor(
    @InjectRepository(Location)
    private readonly locationRepository: Repository<Location>,
    @InjectRepository(Proposal)
    private readonly proposalRepository: Repository<Proposal>,
    private readonly dataSource: DataSource,
  ) {}

  async create(proposalId: number) {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const proposal = await qr.manager.findOne(Proposal, {
        where: { id: proposalId, type: ProprosalType.CREATE },
      });

      if (!proposal) {
        throw new NotFoundException('존재하지 않는 id 값의 생성 제안 입니다.');
      }

      const { id: newLocationId } = await qr.manager.save(Location, {
        name: proposal.newLocationName,
        description: proposal.newLocationDescription,
        latitude: proposal.newLatitude,
        longitude: proposal.newLongitude,
        creator: {
          id: proposal.creator.id,
        },
      });

      await qr.manager.delete(Proposal, {
        id: proposalId,
      });

      await qr.commitTransaction();

      const location = this.locationRepository.findOne({
        where: { id: newLocationId },
      });

      return location;
    } catch (e) {
      await qr.rollbackTransaction();
      throw e;
    } finally {
      await qr.release();
    }
  }

  async findAll({ page, limit, query }: FindAllDto) {
    const qb = this.locationRepository.createQueryBuilder('location');

    if (query) {
      qb.where('location.name ILIKE :query', { query: `%${query}%` });
    }

    qb.skip(page * limit).take(limit);

    qb.orderBy('location.createdAt', 'DESC');

    const [data, total] = await qb.getManyAndCount();

    return {
      total,
      page,
      limit,
      data,
    };
  }

  async findAllByCoordinate(findAllByCoordinateDto: FindAllByCoordinateDto) {
    const { swLatitude, swLongitude, neLatitude, neLongitude } =
      findAllByCoordinateDto;

    const qb = this.locationRepository.createQueryBuilder('location');

    qb.where('location.latitude BETWEEN :swLatitude AND :neLatitude', {
      swLatitude,
      neLatitude,
    });

    if (swLongitude <= neLongitude) {
      // 일반적인 경우
      qb.andWhere('location.longitude BETWEEN :swLongitude AND :neLongitude', {
        swLongitude,
        neLongitude,
      });
    } else {
      // 날짜변경선 넘어간 경우 (예: 170 → -170)
      qb.andWhere(
        '(location.longitude BETWEEN :swLongitude AND 180 OR location.longitude BETWEEN -180 AND :neLongitude)',
        {
          swLongitude,
          neLongitude,
        },
      );
    }

    const [data, total] = await qb.getManyAndCount();

    return { data, total };
  }

  async findOne(id: number) {
    const location = await this.locationRepository.findOne({ where: { id } });

    if (!location) {
      throw new NotFoundException('존재하지 않은 지역입니다.');
    }

    return location;
  }

  update(id: number, updateLocationDto: UpdateLocationDto) {
    return `This action updates a #${id} location`;
  }

  remove(id: number) {
    return `This action removes a #${id} location`;
  }
}
