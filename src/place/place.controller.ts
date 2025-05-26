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
import { MinimumRole } from 'src/auth/decorator/minimun-role.decorator';
import { Role } from 'src/user/entities/user.entity';
import { CreateOrUpdatePlaceMemoDto } from './dto/create-or-update-place-memo.dto';

@Controller('place')
@UseInterceptors(ClassSerializerInterceptor)
export class PlaceController {
  constructor(private readonly placeService: PlaceService) {}

  @Post()
  create(@Body() createPlaceDto: CreatePlaceDto) {
    return this.placeService.create(createPlaceDto);
  }

  @Public()
  @Get()
  findAll(@Query() getPlacesDto: GetPlacesDto) {
    return this.placeService.findAll(getPlacesDto);
  }

  @Public()
  @Get('prefix-count')
  getPlacePrefixCounts() {
    return this.placeService.getPlacePrefixCounts();
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.placeService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePlaceDto: UpdatePlaceDto) {
    return this.placeService.update(id, updatePlaceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.placeService.remove(id);
  }

  @Post(':id/like')
  toggleLike(@Param('id') id: string, @UserId() userId: number) {
    return this.placeService.toggleLike(userId, id);
  }

  @Post(':id/save')
  toggleSave(@Param('id') id: string, @UserId() userId: number) {
    return this.placeService.toggleSave(userId, id);
  }

  @Post(':id/memo')
  createOrUpdateMemo(
    @Param('id') id: string,
    @UserId() userId: number,
    @Body() createOrUpdatePlaceMemoDto: CreateOrUpdatePlaceMemoDto,
  ) {
    return this.placeService.createOrUpdateMemo(
      userId,
      id,
      createOrUpdatePlaceMemoDto,
    );
  }

  @Delete(':id/memo')
  deleteMemo(@Param('id') id: string, @UserId() userId: number) {
    return this.placeService.deleteMemo(userId, id);
  }

  @MinimumRole(Role.SUPER)
  @Post('scrap')
  scrapPlacesFromWeb(
    @Query('page') page: number = 0,
    @UserId() userId: number,
  ) {
    return this.placeService.scrapPlacesFromWeb(userId, page);
  }

  @MinimumRole(Role.SUPER)
  @Post('push-to-db')
  pushToDB() {
    return this.placeService.pushToDB();
  }

  @Public()
  @Sse('progress/:userId')
  sendProgress(@Param('userId') userId: number) {
    return this.placeService.getProgressStream(userId);
  }
}
