import { Module } from '@nestjs/common';
import { PlaceService } from './place.service';
import { PlaceController } from './place.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Place } from './entities/place.entity';
import { CommonModule } from 'src/common/common.module';
import { PlaceType } from 'src/place-type/entities/place-type.entity';
import { UserPlaceLike } from 'src/user/entities/user-place-like.entity';
import { UserPlaceSave } from 'src/user/entities/user-place-save.entity';
import { UserPlaceMemo } from 'src/user/entities/user-place-memo.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Place,
      PlaceType,
      UserPlaceLike,
      UserPlaceSave,
      UserPlaceMemo,
    ]),
    CommonModule,
  ],
  controllers: [PlaceController],
  providers: [PlaceService],
  exports: [PlaceService],
})
export class PlaceModule {}
