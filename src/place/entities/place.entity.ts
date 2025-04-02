import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { PlaceRelation } from './place-relation.entity';

export const enum PlaceStereo {
  parent = 'parent',
  child = 'child',
}
@Entity()
export class Place {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, nullable: false })
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  geoJsonText: string;

  @Column({ default: PlaceStereo.parent })
  stereo: PlaceStereo;

  @OneToMany(() => PlaceRelation, (relation) => relation.parent)
  childRelations: PlaceRelation[];

  @OneToMany(() => PlaceRelation, (relation) => relation.child)
  parentRelations: PlaceRelation[];
}
