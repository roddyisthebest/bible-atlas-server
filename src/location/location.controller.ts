import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  ClassSerializerInterceptor,
  Query,
} from '@nestjs/common';
import { LocationService } from './location.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { FindAllDto } from './dto/find-all.dto';
import { FindAllByCoordinateDto } from './dto/find-all-by-coordinate.dto';
import { Public } from 'src/auth/decorator/public.decorator';

@Controller('location')
@UseInterceptors(ClassSerializerInterceptor)
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Post()
  create(@Body() createLocationDto: CreateLocationDto) {
    return this.locationService.create(createLocationDto);
  }

  @Public()
  @Get()
  findAll(@Query() findAllDto: FindAllDto) {
    return this.locationService.findAll(findAllDto);
  }

  @Public()
  @Get('within')
  findAllByCoordinate(@Query() findAllByCoordinateDto: FindAllByCoordinateDto) {
    return this.locationService.findAllByCoordinate(findAllByCoordinateDto);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.locationService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: number,
    @Body() updateLocationDto: UpdateLocationDto,
  ) {
    return this.locationService.update(id, updateLocationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.locationService.remove(id);
  }
}
