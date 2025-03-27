import {
  Controller,
  Get,
  Param,
  UseInterceptors,
  ClassSerializerInterceptor,
  Query,
} from '@nestjs/common';
import { LocationService } from './location.service';
import { FindAllDto } from './dto/find-all.dto';
import { FindAllByCoordinateDto } from './dto/find-all-by-coordinate.dto';
import { Public } from 'src/auth/decorator/public.decorator';

@Controller('location')
@UseInterceptors(ClassSerializerInterceptor)
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

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
}
