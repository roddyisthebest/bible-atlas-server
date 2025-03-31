import { User } from 'src/user/entities/user.entity';
import { Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';
import { Proposal } from './proposal.entity';

@Entity()
export class ProposalAgreement {
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
