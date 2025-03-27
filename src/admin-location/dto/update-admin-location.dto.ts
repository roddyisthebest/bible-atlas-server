import { PartialType } from '@nestjs/mapped-types';
import { CreateAdminLocationDto } from './create-admin-location.dto';

export class UpdateAdminLocationDto extends PartialType(CreateAdminLocationDto) {}
