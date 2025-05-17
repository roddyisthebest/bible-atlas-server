import {
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  JoinColumn,
  Column,
} from 'typeorm';
import { Place } from './place.entity';

@Entity()
@Unique(['parent', 'child']) // 중복 방지
export class PlaceRelation {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Place, (place) => place.parentRelations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'parent_id' })
  parent: Place;

  @ManyToOne(() => Place, (place) => place.childRelations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'child_id' })
  child: Place;

  @Column()
  possibility: number;
}
