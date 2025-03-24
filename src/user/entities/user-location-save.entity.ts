import { Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';
import { Location } from 'src/location/entities/location.entity';
import { User } from 'src/user/entities/user.entity';

@Entity()
export class UserLocationSave {
  @PrimaryColumn({
    name: 'userId',
    type: 'int8',
  })
  @ManyToOne(() => User, (user) => user.savedLocations, {
    onDelete: 'CASCADE',
  })
  user: User;

  @PrimaryColumn({
    name: 'locationId',
    type: 'int8',
  })
  @ManyToOne(() => Location, (location) => location.likedUsers, {
    onDelete: 'CASCADE',
  })
  location: Location;
}
