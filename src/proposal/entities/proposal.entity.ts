import { User } from 'src/user/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { BaseTableEntity } from 'src/common/entity/base-table.entity';

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
