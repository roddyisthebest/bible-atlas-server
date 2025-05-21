import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Proposal } from 'src/proposal/entities/proposal.entity';
import { CommonModule } from 'src/common/common.module';
import { Place } from 'src/place/entities/place.entity';
import { PlaceModule } from 'src/place/place.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Proposal, Place]),
    CommonModule,
    PlaceModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
