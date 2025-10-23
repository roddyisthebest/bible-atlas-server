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
import { PlaceReportService } from './place-report.service';
import { CreatePlaceReportDto } from './dto/create-place-report.dto';
import { UpdatePlaceReportDto } from './dto/update-place-report.dto';
import { UserId } from 'src/common/decorator/user-id.decorator';
import { PagePaginationDto } from 'src/common/dto/page-pagination.dto';
import { MinimumRole } from 'src/auth/decorator/minimun-role.decorator';
import { Role } from 'src/user/entities/user.entity';
import { Public } from 'src/auth/decorator/public.decorator';

@Controller('place-report')
@UseInterceptors(ClassSerializerInterceptor)
export class PlaceReportController {
  constructor(private readonly placeReportService: PlaceReportService) {}

  @Public()
  @Post()
  create(
    @Body() createPlaceReportDto: CreatePlaceReportDto,
    @UserId({ isPublic: true }) userId: number,
  ) {
    return this.placeReportService.create(createPlaceReportDto, userId);
  }

  @Get()
  @MinimumRole(Role.SUPER)
  findAll(@Query() findAllDto: PagePaginationDto) {
    return this.placeReportService.findAll(findAllDto);
  }

  @Get(':id')
  @MinimumRole(Role.SUPER)
  findOne(@Param('id') id: number) {
    return this.placeReportService.findOne(id);
  }

  @Patch(':id')
  @MinimumRole(Role.SUPER)
  update(
    @Param('id') id: number,
    @Body() updatePlaceReportDto: UpdatePlaceReportDto,
  ) {
    return this.placeReportService.update(id, updatePlaceReportDto);
  }

  @Delete(':id')
  @MinimumRole(Role.SUPER)
  remove(@Param('id') id: number) {
    return this.placeReportService.remove(id);
  }
}
