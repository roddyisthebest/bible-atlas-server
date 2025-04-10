import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PlaceTypeService } from './place-type.service';
import { CreatePlaceTypeDto } from './dto/create-place-type.dto';
import { UpdatePlaceTypeDto } from './dto/update-place-type.dto';

@Controller('place-type')
export class PlaceTypeController {
  constructor(private readonly placeTypeService: PlaceTypeService) {}

  @Post()
  create(@Body() createPlaceTypeDto: CreatePlaceTypeDto) {
    return this.placeTypeService.create(createPlaceTypeDto);
  }

  @Get()
  findAll() {
    return this.placeTypeService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.placeTypeService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePlaceTypeDto: UpdatePlaceTypeDto) {
    return this.placeTypeService.update(+id, updatePlaceTypeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.placeTypeService.remove(+id);
  }
}
