import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { Repository } from 'typeorm';
import { CommonService } from 'src/common/common.service';
import { PagePaginationDto } from 'src/common/dto/page-pagination.dto';
import { instanceToPlain } from 'class-transformer';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly commonService: CommonService,
  ) {}

  async create(createNotificationDto: CreateNotificationDto) {
    const newNotification = await this.notificationRepository.save({
      ...createNotificationDto,
    });

    return newNotification;
  }

  async findAll(dto: PagePaginationDto) {
    const { limit, page } = dto;

    const qb = this.notificationRepository
      .createQueryBuilder('noti')
      .leftJoinAndSelect('noti.user', 'user');

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
    const notification = await this.notificationRepository.findOne({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException('존재하지 않는 id값의 알림입니다.');
    }

    return notification;
  }

  remove(id: number) {
    return `This action removes a #${id} notification`;
  }
}
