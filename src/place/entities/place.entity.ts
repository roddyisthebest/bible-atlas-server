import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { PlaceRelation } from './place-relation.entity';
import { PlaceStereo } from '../const/place.const';
import { Proposal } from 'src/proposal/entities/proposal.entity';

@Unique(['name', 'isModern'])
@Entity()
export class Place {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  name: string;

  @Column({ default: false })
  isModern: boolean;

  @Column({ nullable: true })
  description: string;

  @Column({ default: PlaceStereo.parent })
  stereo: PlaceStereo;

  @Column({ nullable: true })
  verse: string;

  @OneToMany(() => Proposal, (proposal) => proposal.place)
  proposals: Proposal[];

  @OneToMany(() => PlaceRelation, (relation) => relation.parent)
  childRelations: PlaceRelation[];

  @OneToMany(() => PlaceRelation, (relation) => relation.child)
  parentRelations: PlaceRelation[];
}
