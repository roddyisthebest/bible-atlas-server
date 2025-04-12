import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Sse,
  UseInterceptors,
  ClassSerializerInterceptor,
  Query,
} from '@nestjs/common';
import { PlaceService } from './place.service';
import { CreatePlaceDto } from './dto/create-place.dto';
import { UpdatePlaceDto } from './dto/update-place.dto';
import { UserId } from 'src/common/decorator/user-id.decorator';
import { Public } from 'src/auth/decorator/public.decorator';
import { GetPlacesDto } from './dto/get-places.dto';

@Controller('place')
@UseInterceptors(ClassSerializerInterceptor)
export class PlaceController {
  constructor(private readonly placeService: PlaceService) {}

  @Post()
  create(@Body() createPlaceDto: CreatePlaceDto) {
    return this.placeService.create(createPlaceDto);
  }

  @Get()
  findAll(@Query() getPlacesDto: GetPlacesDto) {
    return this.placeService.findAll(getPlacesDto);
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.placeService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: number, @Body() updatePlaceDto: UpdatePlaceDto) {
    return this.placeService.update(id, updatePlaceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.placeService.remove(id);
  }

  @Post('scrap')
  scrapPlacesFromWeb(@UserId() userId: number) {
    return this.placeService.scrapPlacesFromWeb(userId);
  }

  @Public()
  @Sse('progress/:userId')
  sendProgress(@Param('userId') userId: number) {
    return this.placeService.getProgressStream(userId);
  }
}
