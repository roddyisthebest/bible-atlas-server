import { Module } from '@nestjs/common';
import { LocationService } from './location.service';
import { LocationController } from './location.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Location } from './entities/location.entity';
import { Proposal } from 'src/proposal/entities/proposal.entity';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [TypeOrmModule.forFeature([Location, Proposal]), CommonModule],
  controllers: [LocationController],
  providers: [LocationService],
})
export class LocationModule {}
