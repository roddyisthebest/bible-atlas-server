import { Injectable, Logger } from '@nestjs/common';

import { Cron } from '@nestjs/schedule';
import {
  DEFAULT_SYNC_PLACE_LIKE_CRON,
  DEFAULT_SYNC_PROPOSAL_CRON,
} from './const/task.const';
import { Between, DataSource, Repository } from 'typeorm';

import { Proposal } from 'src/proposal/entities/proposal.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Notification } from 'src/notification/entities/notification.entity';

import { Role, User } from 'src/user/entities/user.entity';
import { Place } from 'src/place/entities/place.entity';

@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);

  constructor(
    @InjectRepository(Proposal)
    private readonly proposalRepository: Repository<Proposal>,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly dataSource: DataSource,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Place)
    private readonly placeRepository: Repository<Place>,
  ) {}

  //   @Cron(process.env.SYNC_PROPOSAL_CRON || DEFAULT_SYNC_PROPOSAL_CRON)
  //   async handleUpdateProposalCounts() {
  //     try {
  //       await this.proposalRepository.query(`
  //         UPDATE proposal p SET "agreeCount" = (
  //           SELECT count(*) FROM proposal_agreement pa
  //           WHERE p.id = pa."proposalId" AND pa."isAgree" = true
  //         )
  //       `);

  //       await this.proposalRepository.query(`
  //         UPDATE proposal p SET "disagreeCount" = (
  //           SELECT count(*) FROM proposal_agreement pa
  //           WHERE p.id = pa."proposalId" AND pa."isAgree" = false
  //         )
  //       `);

  //       this.logger.log('Proposal counts updated successfully');
  //     } catch (error) {
  //       this.logger.error('❌ Failed to update proposal counts:', error);
  //     }
  //   }

  @Cron(process.env.SYNC_PLACE_LIKE_COUNTS_CRON || DEFAULT_SYNC_PLACE_LIKE_CRON)
  async handleUpdatePlaceLikeCount() {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. 모든 likeCount를 0으로 초기화
      await queryRunner.query(`
        UPDATE place 
        SET "likeCount" = 0
        WHERE "likeCount" != 0
      `);

      // 2. user_place_like에 있는 count를 기반으로 업데이트
      await queryRunner.query(`
        UPDATE place p
        SET "likeCount" = sub.count
        FROM (
          SELECT "placeId", COUNT(*) AS count
          FROM user_place_like
          GROUP BY "placeId"
        ) sub
        WHERE p.id = sub."placeId" AND p."likeCount" != sub.count
      `);

      await queryRunner.commitTransaction();
      this.logger.log('✅ Place like counts updated successfully');
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('❌ Failed to update place like counts:', error);
    } finally {
      await queryRunner.release();
    }
  }

  //   async sendPushForNotification() {
  //     const now = new Date();
  //     const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);

  //     try {
  //       const recentNotifications = await this.notificationRepository.find({
  //         where: {
  //           createdAt: Between(fifteenMinutesAgo, now),
  //         },
  //         relations: ['user'],
  //       });

  //       if (recentNotifications.length === 0) {
  //         this.logger.log('No recent notifications to push');
  //         return;
  //       }

  //       const users = recentNotifications.map(
  //         (notification) => notification.user,
  //       );
  //       // TODO: 후에 푸시 알림 구현
  //     } catch (error) {
  //       this.logger.error('❌ Failed to send push notifications:', error);
  //     }
  //   }

  //   async sendPushForReportToAdmin() {
  //     const now = new Date();
  //     const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);

  //     try {
  //       const recentReports = await this.dataSource.query(
  //         `
  //   SELECT
  //     id,
  //     'location' AS type,
  //     "userId",
  //     "createdAt"
  //   FROM user_location_report
  //   WHERE "createdAt" BETWEEN $1 AND $2

  //   UNION ALL

  //   SELECT
  //     id,
  //     'proposal' AS type,
  //     "userId",
  //     "createdAt"
  //   FROM user_proposal_report
  //   WHERE "createdAt" BETWEEN $1 AND $2

  //   ORDER BY "createdAt" DESC
  //   LIMIT 10
  // `,
  //         [fifteenMinutesAgo, now],
  //       );

  //       if (recentReports?.length === 0) {
  //         this.logger.log('No recent reports to push');
  //         return;
  //       }

  //       const admin = await this.userRepository.findOne({
  //         where: { role: Role.SUPER },
  //       });

  //       // TODO: 후에 푸시 알림 구현
  //     } catch (error) {
  //       this.logger.error('❌ Failed to send push notifications:', error);
  //     }
  //   }
}
