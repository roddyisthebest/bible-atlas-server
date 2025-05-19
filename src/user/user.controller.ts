import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { MinimumRole } from 'src/auth/decorator/minimun-role.decorator';
import { Role } from './entities/user.entity';
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

  @Get('me')
  findMyProfile(@UserId() userId: number) {
    return this.userService.findOne(userId);
  }

  @MinimumRole(Role.SUPER)
  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.userService.findOne(id);
  }

  @MinimumRole(Role.SUPER)
  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.userService.remove(id);
  }
}
