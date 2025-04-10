import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { PlaceTypeService } from './place-type.service';
import { CreatePlaceTypeDto } from './dto/create-place-type.dto';
import { UpdatePlaceTypeDto } from './dto/update-place-type.dto';
import { PagePaginationDto } from 'src/common/dto/page-pagination.dto';
import { MinimumRole } from 'src/auth/decorator/minimun-role.decorator';
import { Role } from 'src/user/entities/user.entity';
import { Public } from 'src/auth/decorator/public.decorator';

@Controller('place-type')
@UseInterceptors(ClassSerializerInterceptor)
export class PlaceTypeController {
  constructor(private readonly placeTypeService: PlaceTypeService) {}

  @MinimumRole(Role.SUPER)
  @Post()
  create(@Body() createPlaceTypeDto: CreatePlaceTypeDto) {
    return this.placeTypeService.create(createPlaceTypeDto);
  }

  @Public()
  @Get()
  findAll(@Query() findAllDto: PagePaginationDto) {
    return this.placeTypeService.findAll(findAllDto);
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.placeTypeService.findOne(id);
  }

  @MinimumRole(Role.SUPER)
  @Patch(':id')
  update(
    @Param('id') id: number,
    @Body() updatePlaceTypeDto: UpdatePlaceTypeDto,
  ) {
    return this.placeTypeService.update(id, updatePlaceTypeDto);
  }

  @MinimumRole(Role.SUPER)
  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.placeTypeService.remove(id);
  }
}
