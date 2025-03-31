import {
  Controller,
  Get,
  Param,
  UseInterceptors,
  ClassSerializerInterceptor,
  Query,
  Post,
  Body,
} from '@nestjs/common';
import { LocationService } from './location.service';
import { FindAllDto } from './dto/find-all.dto';
import { FindAllByCoordinateDto } from './dto/find-all-by-coordinate.dto';
import { Public } from 'src/auth/decorator/public.decorator';
import { UserId } from 'src/common/decorator/user-id.decorator';
import { CreateReportDto } from './dto/create-report.dto';

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

  @Post(':id/like')
  likeLocation(@Param('id') id: number, @UserId() userId: number) {
    return this.locationService.likeLocation(id, userId);
  }

  @Post(':id/save')
  saveLocation(@Param('id') id: number, @UserId() userId: number) {
    return this.locationService.saveLocation(id, userId);
  }

  @Post(':id/report')
  reportLocation(
    @Param('id') id: number,
    @Body() createReportDto: CreateReportDto,
    @UserId() userId: number,
  ) {
    return this.locationService.reportLocation(id, createReportDto, userId);
  }
}
