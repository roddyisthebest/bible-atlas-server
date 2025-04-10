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
} from '@nestjs/common';
import { PlaceService } from './place.service';
import { CreatePlaceDto } from './dto/create-place.dto';
import { UpdatePlaceDto } from './dto/update-place.dto';
import { UserId } from 'src/common/decorator/user-id.decorator';
import { Public } from 'src/auth/decorator/public.decorator';

@Controller('place')
@UseInterceptors(ClassSerializerInterceptor)
export class PlaceController {
  constructor(private readonly placeService: PlaceService) {}

  @Post()
  create(@Body() createPlaceDto: CreatePlaceDto) {
    return this.placeService.create(createPlaceDto);
  }

  @Get()
  findAll() {
    return this.placeService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.placeService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePlaceDto: UpdatePlaceDto) {
    return this.placeService.update(+id, updatePlaceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.placeService.remove(+id);
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
