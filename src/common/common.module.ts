import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { CommonController } from './common.controller';
import { CommonService } from './common.service';

@Module({
  imports: [],
  controllers: [CommonController],
  providers: [CommonService, TaskService],
  exports: [CommonService],
})
export class CommonModule {}
