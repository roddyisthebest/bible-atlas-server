import { Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';
import { User } from './user.entity';
import { Proposal } from 'src/proposal/entities/proposal.entity';

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
export class UserProposalReport {
  @PrimaryColumn({
    name: 'userId',
    type: 'int8',
  })
  @ManyToOne(() => User, (user) => user.proposalReports)
  user: User;

  @PrimaryColumn({
    name: 'proposalId',
    type: 'int8',
  })
  @ManyToOne(() => Proposal, (proposal) => proposal.proposalAgreements)
  proposal: Proposal;

  @Column({ default: ReportType.FALSE_INFORMATION })
  type: ReportType;

  @Column()
  reason: string;
}
