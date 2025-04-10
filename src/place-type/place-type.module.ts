import { Module } from '@nestjs/common';
import { PlaceTypeService } from './place-type.service';
import { PlaceTypeController } from './place-type.controller';

@Module({
  controllers: [PlaceTypeController],
  providers: [PlaceTypeService],
})
export class PlaceTypeModule {}
