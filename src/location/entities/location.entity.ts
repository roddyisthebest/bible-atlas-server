import { BaseTableEntity } from 'src/common/entity/base-table.entity';
import { Proposal } from 'src/proposal/entities/proposal.entity';
import { UserLocationLike } from 'src/user/entities/user-location-like.entity';
import { UserLocationReport } from 'src/user/entities/user-location-report.entity';
import { UserLocationSave } from 'src/user/entities/user-location-save.entity';
import { User } from 'src/user/entities/user.entity';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

@Entity()
@Unique(['latitude', 'longitude'])
export class Location extends BaseTableEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'decimal', precision: 10, scale: 6 })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 6 })
  longitude: number;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column({ default: 0 })
  likeCount: number;

  @ManyToOne(() => User, (user) => user.id, {
    cascade: true,
    nullable: false,
    onDelete: 'CASCADE',
  })
  creator: User;

  @OneToMany(() => UserLocationLike, (ull) => ull.user)
  likedUsers: UserLocationLike[];

  @OneToMany(() => UserLocationSave, (save) => save.user)
  savedUsers: UserLocationSave[];

  @OneToMany(
    () => UserLocationReport,
    (userLocationReport) => userLocationReport.user,
  )
  reports: UserLocationReport[];

  @OneToMany(() => Proposal, (proposal) => proposal.location)
  proposals: Proposal[];
}
