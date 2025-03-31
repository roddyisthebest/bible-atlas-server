import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { CommonController } from './common.controller';
import { CommonService } from './common.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Proposal } from 'src/proposal/entities/proposal.entity';
import { UserLocationLike } from 'src/user/entities/user-location-like.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Proposal, UserLocationLike])],
  controllers: [CommonController],
  providers: [CommonService, TaskService],
  exports: [CommonService],
})
export class CommonModule {}
