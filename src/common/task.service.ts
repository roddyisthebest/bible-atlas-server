import { Injectable, Logger } from '@nestjs/common';

import { Cron } from '@nestjs/schedule';
import {
  DEFAULT_SYNC_LOCATION_LIKE_CRON,
  DEFAULT_SYNC_PROPOSAL_CRON,
} from './const/task.const';
import { Repository } from 'typeorm';

import { Proposal } from 'src/proposal/entities/proposal.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { UserLocationLike } from 'src/user/entities/user-location-like.entity';

@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);

  constructor(
    @InjectRepository(Proposal)
    private readonly proposalRepository: Repository<Proposal>,
    @InjectRepository(UserLocationLike)
    private readonly userLocationLikeRepository: Repository<UserLocationLike>,
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
}
