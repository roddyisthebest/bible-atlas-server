import { Injectable, NotFoundException } from '@nestjs/common';

import { DataSource, Repository } from 'typeorm';
import { Location } from './entities/location.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { FindAllDto } from './dto/find-all.dto';
import { FindAllByCoordinateDto } from './dto/find-all-by-coordinate.dto';
import { Proposal, ProposalType } from 'src/proposal/entities/proposal.entity';
import { CommonService } from 'src/common/common.service';
import { UserLocationLike } from 'src/user/entities/user-location-like.entity';
import { UserLocationSave } from 'src/user/entities/user-location-save.entity';

import { UserLocationReport } from 'src/user/entities/user-location-report.entity';
import { CreateLocationReportDto } from './dto/create-location-report.dto';
import { CreateNotificationDto } from 'src/notification/dto/create-notification.dto';
import {
  Notification,
  NotificationType,
} from 'src/notification/entities/notification.entity';

@Injectable()
export class LocationService {
  constructor(
    @InjectRepository(Location)
    private readonly locationRepository: Repository<Location>,
    private readonly dataSource: DataSource,
    private readonly commonService: CommonService,
    @InjectRepository(UserLocationLike)
    private readonly userLocationLikeRepository: Repository<UserLocationLike>,
    @InjectRepository(UserLocationSave)
    private readonly userLocationSaveRepository: Repository<UserLocationSave>,
    @InjectRepository(UserLocationReport)
    private readonly userLocationReportRepository: Repository<UserLocationReport>,
  ) {}

  async create(proposalId: number) {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const proposal = await qr.manager.findOne(Proposal, {
        where: { id: proposalId, type: ProposalType.CREATE },
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

      const createNotificationDto: CreateNotificationDto = {
        title: '생성 제안 승인',
        content: '생성 제안 승인 완료! 새로운 지역이 생성되었어요.',
        type: NotificationType.APPROVED,
        userId: proposal.creator.id,
        redirectUrl: `location/${newLocationId}`,
      };

      await qr.manager.save(Notification, createNotificationDto);

      await qr.manager.update(
        Proposal,
        { id: proposal.id },
        { location: { id: newLocationId } },
      );

      await qr.manager.softDelete(Proposal, {
        id: proposalId,
      });

      await qr.commitTransaction();

      const newLocation = this.locationRepository.findOne({
        where: { id: newLocationId },
      });

      return newLocation;
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

    this.commonService.applyPagePaginationParamsToQb(qb, { limit, page });

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

  async update(proposalId: number) {
    const qr = this.dataSource.createQueryRunner();

    await qr.connect();
    await qr.startTransaction();

    try {
      const proposal = await qr.manager.findOne(Proposal, {
        where: { id: proposalId, type: ProposalType.UPDATE },
      });

      if (!proposal) {
        throw new NotFoundException('존재하지 않는 id 값의 수정 제안 입니다.');
      }

      const location = await qr.manager.findOne(Location, {
        where: { id: proposal.location.id },
      });

      if (!proposal.location || !location) {
        throw new NotFoundException('관련된 지역 데이터가 없습니다.');
      }

      await qr.manager.update(
        Location,
        { id: location.id },
        {
          name: proposal.newLocationName,
          description: proposal.newLocationDescription,
          latitude: proposal.newLatitude,
          longitude: proposal.newLongitude,
        },
      );
      const notifications: CreateNotificationDto[] = [
        {
          title: '수정 제안 승인',
          content: `수정 제안 승인 완료! 지역 ${location.name}의 정보가 수정되었습니다.`,
          type: NotificationType.APPROVED,
          userId: proposal.creator.id,
          redirectUrl: `location/${location.id}`,
        },
        {
          title: '수정 제안 승인',
          content: `수정 제안 승인 완료! 지역 ${location.name}의 정보가 수정되었습니다.`,
          type: NotificationType.APPROVED,
          userId: location.creator.id,
          redirectUrl: `location/${location.id}`,
        },
      ];

      await qr.manager.save(Notification, notifications);

      await qr.manager.softDelete(Proposal, { id: proposal.id });
      await qr.commitTransaction();

      const updatedLocation = this.locationRepository.findOne({
        where: { id: location.id },
      });

      return updatedLocation;
    } catch (e) {
      await qr.rollbackTransaction();
      throw e;
    } finally {
      await qr.release();
    }
  }

  async remove(proposalId: number) {
    const qr = this.dataSource.createQueryRunner();

    await qr.connect();
    await qr.startTransaction();
    try {
      const proposal = await qr.manager.findOne(Proposal, {
        where: { id: proposalId, type: ProposalType.DELETE },
      });

      if (!proposal) {
        throw new NotFoundException('존재하지 않는 id 값의 삭제 제안 입니다.');
      }

      const location = await qr.manager.findOne(Location, {
        where: { id: proposal.location.id },
      });

      if (!proposal.location || !location) {
        throw new NotFoundException('관련된 지역 데이터가 없습니다.');
      }

      await qr.manager.softDelete(Location, { id: location.id });
      await qr.manager.softDelete(Proposal, { id: proposal.id });

      const notifications: CreateNotificationDto[] = [
        {
          title: '삭제 제안 승인',
          content: `삭제 제안 승인 완료! 지역 ${location.name}의 정보가 삭제되었습니다.`,
          type: NotificationType.APPROVED,
          userId: proposal.creator.id,
        },
        {
          title: '삭제 제안 승인',
          content: `삭제 제안 승인 완료! 지역 ${location.name}의 정보가 삭제되었습니다.`,
          type: NotificationType.APPROVED,
          userId: location.creator.id,
        },
      ];

      await qr.manager.save(Notification, notifications);

      await qr.commitTransaction();

      const deletedLocation = this.locationRepository.findOne({
        where: { id: location.id },
        withDeleted: true,
      });

      return deletedLocation;
    } catch (e) {
      await qr.rollbackTransaction();
      throw e;
    } finally {
      await qr.release();
    }
  }

  async likeLocation(id: number, userId: number) {
    const location = await this.locationRepository.findOne({ where: { id } });

    if (!location) {
      throw new NotFoundException('존재하지 않은 지역입니다.');
    }

    const likeRecord = await this.userLocationLikeRepository
      .createQueryBuilder('ull')
      .leftJoinAndSelect('ull.user', 'user')
      .leftJoinAndSelect('ull.location', 'location')
      .where('user.id = :userId', { userId })
      .andWhere('location.id = :locationId', { locationId: location.id })
      .getOne();

    const primaryKey = {
      location,
      user: { id: userId },
    };

    if (!likeRecord) {
      const like = await this.userLocationLikeRepository.save({
        ...primaryKey,
      });

      return { message: 'location liked', like };
    }

    await this.userLocationLikeRepository.delete({
      ...primaryKey,
    });

    return { message: 'location unLiked' };
  }

  async saveLocation(id: number, userId: number) {
    const location = await this.locationRepository.findOne({ where: { id } });

    if (!location) {
      throw new NotFoundException('존재하지 않은 지역입니다.');
    }

    const saveRecord = await this.userLocationSaveRepository
      .createQueryBuilder('uls')
      .leftJoinAndSelect('uls.user', 'user')
      .leftJoinAndSelect('uls.location', 'location')
      .where('user.id = :userId', { userId })
      .andWhere('location.id = :locationId', { locationId: location.id })
      .getOne();

    const primaryKey = {
      location,
      user: { id: userId },
    };

    if (!saveRecord) {
      const save = await this.userLocationSaveRepository.save({
        ...primaryKey,
      });

      return { message: 'location saved', save };
    }

    await this.userLocationSaveRepository.delete({
      ...primaryKey,
    });

    return { message: 'location unsaved' };
  }

  async reportLocation(
    id: number,
    createReportDto: CreateLocationReportDto,
    userId: number,
  ) {
    const location = await this.locationRepository.findOne({ where: { id } });

    if (!location) {
      throw new NotFoundException('존재하지 않는 id 값의 지역입니다.');
    }

    const newReport = await this.userLocationReportRepository.save({
      location,
      user: { id: userId },
      ...createReportDto,
    });

    return newReport;
  }
}
