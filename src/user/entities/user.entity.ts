import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  BeforeInsert,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Location } from 'src/location/entities/location.entity';
import { UserLocationLike } from './user-location-like.entity';
import { Proposal } from 'src/proposal/entities/proposal.entity';
import { UserLocationSave } from './user-location-save.entity';
import { ProposalAgreement } from 'src/proposal/entities/proposal-agreement.entity';
import { UserProposalReport } from './user-proposal-report.entity';
import { Notification } from 'src/notification/entities/notification.entity';
import { UserLocationReport } from './user-location-report.entity';
import { v4 as uuidv4 } from 'uuid';
import { BaseTableEntity } from 'src/common/entity/base-table.entity';

export enum Role {
  SUPER,
  POWER_EXPERT,
  EXPERT,
  USER,
}

@Entity()
export class User extends BaseTableEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    unique: true,
  })
  email: string;

  @Column({ nullable: true })
  @Exclude({ toPlainOnly: true })
  password: string;

  @Column({ enum: Role, default: Role.USER })
  role: Role;

  @Column({ nullable: true })
  avatar: string;

  @BeforeInsert()
  assignRandomAvatar() {
    const seed = uuidv4();
    this.avatar = `https://api.dicebear.com/9.x/dylan/svg?seed=${seed}`;
  }

  @Column({ nullable: true })
  @Exclude({ toPlainOnly: true })
  phoneToken: string;

  @OneToMany(() => Location, (location) => location.creator)
  locations: Location[];

  @OneToMany(() => Proposal, (proposal) => proposal.creator)
  proposals: Proposal[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];

  @OneToMany(() => UserLocationLike, (ull) => ull.location)
  likedLocations: UserLocationLike[];

  @OneToMany(() => UserLocationSave, (save) => save.location)
  savedLocations: UserLocationSave[];

  @OneToMany(
    () => ProposalAgreement,
    (proposalAgreement) => proposalAgreement.proposal,
  )
  proposalAgreements: ProposalAgreement[];

  @OneToMany(
    () => UserProposalReport,
    (userProposalReport) => userProposalReport.proposal,
  )
  proposalReports: UserProposalReport[];

  @OneToMany(
    () => UserLocationReport,
    (userLocationReport) => userLocationReport.location,
  )
  locationReports: UserLocationReport;
}
