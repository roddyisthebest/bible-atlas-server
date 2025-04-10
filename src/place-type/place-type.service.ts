import { Injectable } from '@nestjs/common';
import { CreatePlaceTypeDto } from './dto/create-place-type.dto';
import { UpdatePlaceTypeDto } from './dto/update-place-type.dto';

@Injectable()
export class PlaceTypeService {
  create(createPlaceTypeDto: CreatePlaceTypeDto) {
    return 'This action adds a new placeType';
  }

  findAll() {
    return `This action returns all placeType`;
  }

  findOne(id: number) {
    return `This action returns a #${id} placeType`;
  }

  update(id: number, updatePlaceTypeDto: UpdatePlaceTypeDto) {
    return `This action updates a #${id} placeType`;
  }

  remove(id: number) {
    return `This action removes a #${id} placeType`;
  }
}
