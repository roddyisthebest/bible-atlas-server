import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { PlaceRelation } from './place-relation.entity';
import { PlaceStereo } from '../const/place.const';

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

  @Column()
  geoJsonText: string;

  @Column({ default: PlaceStereo.parent })
  stereo: PlaceStereo;

  @Column({ nullable: true })
  verse: string;

  @Column({ nullable: true })
  types: string;

  @OneToMany(() => PlaceRelation, (relation) => relation.parent)
  childRelations: PlaceRelation[];

  @OneToMany(() => PlaceRelation, (relation) => relation.child)
  parentRelations: PlaceRelation[];
}
