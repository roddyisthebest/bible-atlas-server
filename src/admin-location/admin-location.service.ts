import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateAdminLocationDto } from './dto/create-admin-location.dto';
import { UpdateAdminLocationDto } from './dto/update-admin-location.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Location } from 'src/location/entities/location.entity';

@Injectable()
export class AdminLocationService {
  constructor(
    @InjectRepository(Location)
    private readonly locationRepository: Repository<Location>,
  ) {}

  async create(
    createAdminLocationDto: CreateAdminLocationDto,
    creatorId: number,
  ) {
    const { longitude, latitude, name } = createAdminLocationDto;

    const location = await this.locationRepository
      .createQueryBuilder('location')
      .where(
        '(location.longitude = :longitude AND location.latitude = :latitude)',
        {
          longitude,
          latitude,
        },
      )
      .orWhere('location.name = :name', {
        name,
      })
      .getOne();

    if (location) {
      throw new BadRequestException({
        message: '이미 등록된 지역입니다.',
        location,
      });
    }

    const newLocation = await this.locationRepository.save({
      ...createAdminLocationDto,
      creator: { id: creatorId },
    });

    return newLocation;
  }

  async update(id: number, updateAdminLocationDto: UpdateAdminLocationDto) {
    const location = await this.locationRepository.findOne({ where: { id } });

    if (!location) {
      throw new NotFoundException('존재하지 않는 id 값의 지역입니다.');
    }

    await this.locationRepository.update({ id }, { ...updateAdminLocationDto });

    const updatedLocation = await this.locationRepository.findOne({
      where: { id },
    });

    return updatedLocation;
  }

  async remove(id: number) {
    const location = await this.locationRepository.findOne({ where: { id } });

    if (!location) {
      throw new NotFoundException('존재하지 않는 지역입니다!');
    }

    await this.locationRepository.delete({ id });

    return id;
  }
}
