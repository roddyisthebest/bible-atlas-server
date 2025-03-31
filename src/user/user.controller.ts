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
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { MinimumRole } from 'src/auth/decorator/minimun-role.decorator';
import { Role } from './entities/user.entity';
import { FindAllDto } from 'src/location/dto/find-all.dto';
import { UserId } from 'src/common/decorator/user-id.decorator';

@Controller('user')
@UseInterceptors(ClassSerializerInterceptor)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @MinimumRole(Role.SUPER)
  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @MinimumRole(Role.SUPER)
  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.userService.findOne(id);
  }

  @Get(':id/saved-locations')
  getMySavedLocations(
    @Query() findAllDto: FindAllDto,
    @UserId() userId: number,
  ) {
    return this.userService.getMySavedLocations(findAllDto, userId);
  }

  @Get(':id/liked-locations')
  getMyLikedLocations(
    @Query() findAllDto: FindAllDto,
    @UserId() userId: number,
  ) {
    return this.userService.getMyLikedLocations(findAllDto, userId);
  }

  @MinimumRole(Role.SUPER)
  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.userService.remove(id);
  }
}
