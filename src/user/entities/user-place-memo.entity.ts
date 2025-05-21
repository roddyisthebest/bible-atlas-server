import { Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';
import { User } from './user.entity';
import { Place } from 'src/place/entities/place.entity';

@Entity()
export class UserPlaceMemo {
  @PrimaryColumn({
    name: 'userId',
    type: 'int8',
  })
  @ManyToOne(() => User, (user) => user.memoedPlaces, {
    onDelete: 'CASCADE',
  })
  user: User;

  @PrimaryColumn({
    name: 'placeId',
    type: 'int8',
  })
  @ManyToOne(() => Place, (place) => place.memoedUsers, {
    onDelete: 'CASCADE',
  })
  place: Place;

  @Column({
    name: 'text',
    type: 'text',
  })
  text: string;
}
