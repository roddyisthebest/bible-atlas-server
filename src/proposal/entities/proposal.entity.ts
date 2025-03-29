import { User } from 'src/user/entities/user.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ProposalAgreement } from './proposal-agreement.entity';
import { UserProposalReport } from 'src/user/entities/user-proposal-report.entity';
import { BaseTableEntity } from 'src/common/entity/base-table.entity';
import { Location } from 'src/location/entities/location.entity';

export enum ProposalType {
  CREATE,
  UPDATE,
  DELETE,
}

@Entity()
export class Proposal extends BaseTableEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  type: ProposalType;

  @Column({ nullable: true })
  newLocationName: string;

  @Column({ nullable: true })
  newLocationDescription: string;

  @Column({ nullable: true })
  comment: string;

  @Column({ default: 0 })
  agreeCount: number;

  @Column({ default: 0 })
  disagreeCount: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 6,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
    nullable: true,
  })
  newLatitude: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 6,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
    nullable: true,
  })
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

  @JoinColumn({ name: 'locationId' })
  @ManyToOne(() => Location, (location) => location.proposals, {
    cascade: true,
    nullable: true,
    onDelete: 'CASCADE',
  })
  location: Location;
}
