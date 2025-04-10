import { PlacePlaceType } from 'src/place/entities/place-place-type.entity';
import { Place } from 'src/place/entities/place.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class PlaceType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @OneToMany(() => PlacePlaceType, (ppt) => ppt.placeType)
  places: Place[];
}
