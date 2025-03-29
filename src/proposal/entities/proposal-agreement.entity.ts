import { User } from 'src/user/entities/user.entity';
import {
  Column,
  Entity,
  Index,
  IsNull,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Proposal } from './proposal.entity';
import { BaseTableEntity } from 'src/common/entity/base-table.entity';

@Index('idx_proposal_agreement_updated_at', ['updatedAt'])
@Entity()
export class ProposalAgreement extends BaseTableEntity {
  @PrimaryColumn({
    name: 'userId',
    type: 'int8',
  })
  @ManyToOne(() => User, (user) => user.proposalAgreements)
  user: User;

  @PrimaryColumn({
    name: 'proposalId',
    type: 'int8',
  })
  @ManyToOne(() => Proposal, (proposal) => proposal.proposalAgreements)
  proposal: Proposal;

  @Column({ default: true })
  isAgree: boolean;
}
