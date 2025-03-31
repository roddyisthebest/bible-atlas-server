import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Proposal } from 'src/proposal/entities/proposal.entity';
import { UserLocationLike } from './entities/user-location-like.entity';
import { CommonModule } from 'src/common/common.module';
import { UserLocationSave } from './entities/user-location-save.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Proposal,
      UserLocationLike,
      UserLocationSave,
    ]),
    CommonModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
