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
import { Place } from 'src/place/entities/place.entity';

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
  comment: string;

  @ManyToOne(() => User, (user) => user.id, {
    cascade: true,
    nullable: false,
    onDelete: 'CASCADE',
  })
  creator: User;

  @JoinColumn({ name: 'placeId' })
  @ManyToOne(() => Place, (place) => place.proposals, {
    cascade: true,
    nullable: true,
    onDelete: 'CASCADE',
  })
  place: Place;
}
