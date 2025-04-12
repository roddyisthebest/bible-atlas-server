import { Module } from '@nestjs/common';
import { PlaceService } from './place.service';
import { PlaceController } from './place.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Place } from './entities/place.entity';
import { CommonModule } from 'src/common/common.module';
import { PlaceType } from 'src/place-type/entities/place-type.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Place, PlaceType]), CommonModule],
  controllers: [PlaceController],
  providers: [PlaceService],
})
export class PlaceModule {}
