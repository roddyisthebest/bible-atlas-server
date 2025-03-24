import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity()
@Unique(['latitude', 'longitude'])
export class Location {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  latitude: number;

  @Column()
  longitude: number;

  @Column()
  title: string;

  @Column()
  content: string;

  @Column({ default: 0 })
  likeCount: number;
}
