import { User } from 'src/user/entities/user.entity';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ProposalAgreement } from './proposal-agreement.entity';
import { UserProposalReport } from 'src/user/entities/user-proposal-report.entity';
import { BaseTableEntity } from 'src/common/entity/base-table.entity';

export enum ProprosalType {
  CREATE,
  UPDATE,
  DELETE,
}

@Entity()
export class Proposal extends BaseTableEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  type: ProprosalType;

  @Column({ nullable: false })
  newLocationName: string;

  @Column({ nullable: false })
  newLocationDescription: string;

  @Column()
  comment: string;

  @Column({ default: 0 })
  agreeCount: number;

  @Column({ default: 0 })
  disagreeCount: number;

  @Column()
  newLatitude: number;

  @Column()
  newLongitude: number;

  @ManyToOne(() => User, (user) => user.id, {
    cascade: true,
    nullable: false,
    onDelete: 'CASCADE',
  })
  creator: User;

  @OneToMany(
    () => ProposalAgreement,
    (proposalAgreement) => proposalAgreement.user,
  )
  proposalAgreements: ProposalAgreement[];

  @OneToMany(
    () => UserProposalReport,
    (userProposalReport) => userProposalReport.user,
  )
  reports: UserProposalReport[];
}
