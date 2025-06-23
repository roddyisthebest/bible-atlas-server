import {
  Column,
  Entity,
  OneToMany,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { PlaceRelation } from './place-relation.entity';
import { PlaceStereo } from '../const/place.const';
import { Proposal } from 'src/proposal/entities/proposal.entity';
import { PlacePlaceType } from './place-place-type.entity';
import { PlaceType } from 'src/place-type/entities/place-type.entity';
import { UserPlaceLike } from 'src/user/entities/user-place-like.entity';
import { UserPlaceSave } from 'src/user/entities/user-place-save.entity';
import { UserPlaceMemo } from 'src/user/entities/user-place-memo.entity';

@Unique(['name', 'isModern'])
@Entity()
export class Place {
  @PrimaryColumn()
  id: string;

  @Column({ nullable: false })
  name: string;

  @Column({ default: false })
  isModern: boolean;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  koreanDescription: string;

  @Column({ nullable: true })
  imageTitle: string;

  @Column({ default: PlaceStereo.parent })
  stereo: PlaceStereo;

  @Column({ nullable: true })
  verse: string;

  @Column({ default: 0 })
  likeCount: number;

  @Column({ nullable: true })
  unknownPlacePossibility: number;

  @Column({ type: 'double precision', nullable: true })
  latitude: number;

  @Column({ type: 'double precision', nullable: true })
  longitude: number;

  @OneToMany(() => Proposal, (proposal) => proposal.place)
  proposals: Proposal[];

  @OneToMany(() => PlaceRelation, (relation) => relation.parent)
  childRelations: PlaceRelation[];

  @OneToMany(() => PlaceRelation, (relation) => relation.child)
  parentRelations: PlaceRelation[];

  @OneToMany(() => PlacePlaceType, (ppt) => ppt.place)
  types: PlacePlaceType[];

  @OneToMany(() => UserPlaceLike, (upl) => upl.user)
  likedUsers: UserPlaceLike[];

  @OneToMany(() => UserPlaceSave, (ups) => ups.user)
  savedUsers: UserPlaceLike[];

  @OneToMany(() => UserPlaceMemo, (ups) => ups.user)
  memoedUsers: UserPlaceMemo[];
}
