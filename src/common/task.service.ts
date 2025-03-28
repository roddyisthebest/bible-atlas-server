import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import {
  DEFAULT_PARALLEL_LIMIT,
  DEFAULT_SYNC_PROPOSAL_CRON,
} from './const/task.const';
import { Between, DataSource } from 'typeorm';
import { ProposalAgreement } from 'src/proposal/entities/proposal-agreement.entity';
import { Proposal } from 'src/proposal/entities/proposal.entity';

@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
  ) {}

  @Cron(process.env.SYNC_PROPOSAL_CRON || DEFAULT_SYNC_PROPOSAL_CRON)
  async handleUpdateProposalCounts() {
    const now = new Date();
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      // 1. 최근 10분간 업데이트된 ProposalAgreement 찾기
      const recentAgreements = await qr.manager.find(ProposalAgreement, {
        where: {
          updatedAt: Between(tenMinutesAgo, now),
        },
        relations: ['proposal'],
      });

      // 2. proposalId 중복 제거
      const proposalIds = Array.from(
        new Set(recentAgreements.map((a) => a.proposal?.id).filter(Boolean)),
      );

      if (proposalIds.length === 0) {
        await qr.commitTransaction();
        this.logger.log('ℹ️ No proposals to update.');
        return;
      }

      // 3. 집계 쿼리 - 한 번에 count
      const results: {
        proposalId: number;
        agreeCount: string;
        disagreeCount: string;
      }[] = await qr.manager.query(
        `
       SELECT
         "proposalId",
         SUM(CASE WHEN "isAgree" = true THEN 1 ELSE 0 END) AS "agreeCount",
         SUM(CASE WHEN "isAgree" = false THEN 1 ELSE 0 END) AS "disagreeCount"
       FROM proposal_agreement
       WHERE "proposalId" = ANY($1)
       GROUP BY "proposalId"
       `,
        [proposalIds],
      );

      const { default: pLimit } = await import('p-limit');
      const limit = pLimit(DEFAULT_PARALLEL_LIMIT); // 동시에 10개씩만 실행

      await Promise.all(
        results.map((row) =>
          limit(() =>
            qr.manager.update(Proposal, row.proposalId, {
              agreeCount: Number(row.agreeCount),
              disagreeCount: Number(row.disagreeCount),
            }),
          ),
        ),
      );

      await qr.commitTransaction();
      this.logger.log(`✅ Synced proposals: ${proposalIds.length} updated.`);
    } catch (err) {
      this.logger.log('❌ Failed to sync proposals:', err);
      await qr.rollbackTransaction();
    } finally {
      await qr.release();
    }
  }
}
