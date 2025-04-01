import { Injectable, Logger } from '@nestjs/common';

import { Cron } from '@nestjs/schedule';
import {
  DEFAULT_SYNC_LOCATION_LIKE_CRON,
  DEFAULT_SYNC_PROPOSAL_CRON,
} from './const/task.const';
import { Between, DataSource, Repository } from 'typeorm';

import { Proposal } from 'src/proposal/entities/proposal.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { UserLocationLike } from 'src/user/entities/user-location-like.entity';
import { Notification } from 'src/notification/entities/notification.entity';

import { Role, User } from 'src/user/entities/user.entity';

@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);

  constructor(
    @InjectRepository(Proposal)
    private readonly proposalRepository: Repository<Proposal>,
    @InjectRepository(UserLocationLike)
    private readonly userLocationLikeRepository: Repository<UserLocationLike>,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly dataSource: DataSource,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  @Cron(process.env.SYNC_PROPOSAL_CRON || DEFAULT_SYNC_PROPOSAL_CRON)
  async handleUpdateProposalCounts() {
    try {
      await this.proposalRepository.query(`
        UPDATE proposal p SET "agreeCount" = (
          SELECT count(*) FROM proposal_agreement pa
          WHERE p.id = pa."proposalId" AND pa."isAgree" = true
        )
      `);

      await this.proposalRepository.query(`
        UPDATE proposal p SET "disagreeCount" = (
          SELECT count(*) FROM proposal_agreement pa
          WHERE p.id = pa."proposalId" AND pa."isAgree" = false
        )
      `);

      this.logger.log('Proposal counts updated successfully');
    } catch (error) {
      this.logger.error('❌ Failed to update proposal counts:', error);
    }
  }

  @Cron(process.env.SYNC_LOCATION_LIKE_CRON || DEFAULT_SYNC_LOCATION_LIKE_CRON)
  async handleUpdateLocationLikeCount() {
    try {
      await this.userLocationLikeRepository.query(`
      UPDATE location lo SET "likeCount" = (
        SELECT count(*) FROM user_location_like ull
        WHERE lo.id = ull."locationId"
      )
      `);

      this.logger.log('location like counts updated successfully');
    } catch (error) {
      this.logger.error('❌ Failed to update location like counts:', error);
    }
  }

  async sendPushForNotification() {
    const now = new Date();
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);

    try {
      const recentNotifications = await this.notificationRepository.find({
        where: {
          createdAt: Between(fifteenMinutesAgo, now),
        },
        relations: ['user'],
      });

      if (recentNotifications.length === 0) {
        this.logger.log('No recent notifications to push');
        return;
      }

      const users = recentNotifications.map(
        (notification) => notification.user,
      );
      // TODO: 후에 푸시 알림 구현
    } catch (error) {
      this.logger.error('❌ Failed to send push notifications:', error);
    }
  }

  async sendPushForReportToAdmin() {
    const now = new Date();
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);

    try {
      const recentReports = await this.dataSource.query(
        `
  SELECT 
    id,
    'location' AS type,
    "userId",
    "createdAt"
  FROM user_location_report
  WHERE "createdAt" BETWEEN $1 AND $2

  UNION ALL

  SELECT 
    id,
    'proposal' AS type,
    "userId",
    "createdAt"
  FROM user_proposal_report
  WHERE "createdAt" BETWEEN $1 AND $2

  ORDER BY "createdAt" DESC
  LIMIT 10
`,
        [fifteenMinutesAgo, now],
      );

      if (recentReports?.length === 0) {
        this.logger.log('No recent reports to push');
        return;
      }

      const admin = await this.userRepository.findOne({
        where: { role: Role.SUPER },
      });

      // TODO: 후에 푸시 알림 구현
    } catch (error) {
      this.logger.error('❌ Failed to send push notifications:', error);
    }
  }
}
