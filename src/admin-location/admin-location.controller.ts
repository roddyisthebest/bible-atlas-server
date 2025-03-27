import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { AdminLocationService } from './admin-location.service';
import { CreateAdminLocationDto } from './dto/create-admin-location.dto';
import { UpdateAdminLocationDto } from './dto/update-admin-location.dto';
import { MinimumRole } from 'src/auth/decorator/minimun-role.decorator';
import { Role } from 'src/user/entities/user.entity';
import { UserId } from 'src/common/decorator/user-id.decorator';

@Controller('admin-location')
export class AdminLocationController {
  constructor(private readonly adminLocationService: AdminLocationService) {}

  @MinimumRole(Role.SUPER)
  @Post()
  create(
    @Body() createAdminLocationDto: CreateAdminLocationDto,
    @UserId() userId: number,
  ) {
    return this.adminLocationService.create(createAdminLocationDto, userId);
  }

  @MinimumRole(Role.SUPER)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateAdminLocationDto: UpdateAdminLocationDto,
  ) {
    return this.adminLocationService.update(+id, updateAdminLocationDto);
  }

  @MinimumRole(Role.SUPER)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.adminLocationService.remove(+id);
  }
}
