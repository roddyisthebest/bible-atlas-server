import { Column, Entity, Index, ManyToOne, PrimaryColumn } from 'typeorm';
import { User } from './user.entity';
import { Place } from 'src/place/entities/place.entity';

@Entity()
// @Index('idx_user_place_user_id', ['user'])
// @Index('idx_user_place_place_id', ['place'])
export class UserPlaceLike {
  @PrimaryColumn({
    name: 'userId',
    type: 'int8',
  })
  @ManyToOne(() => User, (user) => user.likedPlaces, {
    onDelete: 'CASCADE',
  })
  user: User;

  @PrimaryColumn({
    name: 'placeId',
    type: 'int8',
  })
  @ManyToOne(() => Place, (place) => place.likedUsers, {
    onDelete: 'CASCADE',
  })
  place: Place;
}
