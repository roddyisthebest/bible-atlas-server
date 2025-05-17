import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { CommonController } from './common.controller';
import { CommonService } from './common.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Proposal } from 'src/proposal/entities/proposal.entity';

import { Notification } from 'src/notification/entities/notification.entity';
import { User } from 'src/user/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Proposal, Notification, User])],
  controllers: [CommonController],
  providers: [CommonService, TaskService],
  exports: [CommonService],
})
export class CommonModule {}
