import { Module } from '@nestjs/common';
import { LocationService } from './location.service';
import { LocationController } from './location.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Location } from './entities/location.entity';
import { Proposal } from 'src/proposal/entities/proposal.entity';
import { CommonModule } from 'src/common/common.module';
import { UserLocationLike } from 'src/user/entities/user-location-like.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Location, Proposal, UserLocationLike]),
    CommonModule,
  ],
  controllers: [LocationController],
  providers: [LocationService],
})
export class LocationModule {}
