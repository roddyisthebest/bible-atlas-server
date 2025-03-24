import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Exclude } from 'class-transformer';
import { Location } from 'src/location/entities/location.entity';
import { UserLocationLike } from './user-location-like.entity';
import { Proposal } from 'src/proposal/entities/proposal.entity';
import { UserLocationSave } from './user-location-save.entity';
import { ProposalAgreement } from 'src/proposal/entities/proposal-agreement.entity';

export enum Role {
  SUPER,
  POWER_EXPERT,
  EXPERT,
  USER,
}

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    unique: true,
  })
  email: string;

  @Column()
  @Exclude({ toPlainOnly: true })
  password: string;

  @Column({ enum: Role, default: Role.USER })
  role: Role;

  @Column()
  avatar: string;

  @Column()
  @Exclude({ toPlainOnly: true })
  phoneToken: string;

  @OneToMany(() => Location, (location) => location.creator)
  locations: Location[];

  @OneToMany(() => Proposal, (proposal) => proposal.creator)
  proposals: Proposal[];

  @OneToMany(() => UserLocationLike, (ull) => ull.location)
  likedLocations: UserLocationLike[];

  @OneToMany(() => UserLocationSave, (save) => save.location)
  savedLocations: UserLocationSave[];

  @OneToMany(
    () => ProposalAgreement,
    (proposalAgreement) => proposalAgreement.proposal,
  )
  proposalAgreements: ProposalAgreement[];
}
