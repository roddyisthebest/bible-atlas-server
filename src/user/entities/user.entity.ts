import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  BeforeInsert,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Proposal } from 'src/proposal/entities/proposal.entity';
import { Notification } from 'src/notification/entities/notification.entity';
import { v4 as uuidv4 } from 'uuid';
import { BaseTableEntity } from 'src/common/entity/base-table.entity';
import { UserPlaceLike } from './user-place-like.entity';
import { UserPlaceSave } from './user-place-save.entity';

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
    unique: false,
    nullable: true,
  })
  name: string;

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

  @OneToMany(() => Proposal, (proposal) => proposal.creator)
  proposals: Proposal[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];

  @OneToMany(() => UserPlaceLike, (upl) => upl.place)
  likedPlaces: UserPlaceLike[];

  @OneToMany(() => UserPlaceSave, (ups) => ups.place)
  savedPlaces: UserPlaceLike[];
}
