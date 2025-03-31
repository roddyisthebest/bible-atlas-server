import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';
import { Proposal } from 'src/proposal/entities/proposal.entity';
import { BaseTableEntity } from 'src/common/entity/base-table.entity';

// TODO: 공통화 필요
export enum ReportType {
  SPAM,
  INAPPROPRIATE,
  HATE_SPEECH,
  HARASSMENT,
  FALSE_INFORMATION,
  PERSONAL_INFO,
  ETC,
}

@Entity()
export class UserProposalReport extends BaseTableEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: 'userId',
    type: 'int8',
  })
  @ManyToOne(() => User, (user) => user.proposalReports)
  user: User;

  @Column({
    name: 'proposalId',
    type: 'int8',
  })
  @ManyToOne(() => Proposal, (proposal) => proposal.reports)
  proposal: Proposal;

  @Column({ default: ReportType.FALSE_INFORMATION })
  type: ReportType;

  @Column({ nullable: true })
  reason: string;
}
