import { Entity, ManyToOne, PrimaryColumn } from 'typeorm';

import { PlaceType } from 'src/place-type/entities/place-type.entity';
import { Place } from './place.entity';

@Entity()
export class PlacePlaceType {
  @PrimaryColumn({
    name: 'placeId',
    type: 'int8',
  })
  @ManyToOne(() => Place, (place) => place.types, {
    onDelete: 'CASCADE',
  })
  place: Place;

  @PrimaryColumn({
    name: 'placeTypeId',
    type: 'int8',
  })
  @ManyToOne(() => PlaceType, (placeType) => placeType.places, {
    onDelete: 'CASCADE',
  })
  placeType: PlaceType;
  ppt: { id: number };
}
