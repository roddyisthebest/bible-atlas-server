import { Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';
import { User } from './user.entity';
import { Place } from 'src/place/entities/place.entity';

@Entity()
export class UserPlaceSave {
  @PrimaryColumn({
    name: 'userId',
    type: 'int8',
  })
  @ManyToOne(() => User, (user) => user.savedPlaces, {
    onDelete: 'CASCADE',
  })
  user: User;

  @PrimaryColumn({
    name: 'placeId',
    type: 'int8',
  })
  @ManyToOne(() => Place, (place) => place.savedUsers, {
    onDelete: 'CASCADE',
  })
  place: Place;
}
