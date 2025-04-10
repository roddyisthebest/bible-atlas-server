import { Module } from '@nestjs/common';
import { ProposalService } from './proposal.service';
import { ProposalController } from './proposal.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Proposal } from './entities/proposal.entity';
import { CommonModule } from 'src/common/common.module';
import { Place } from 'src/place/entities/place.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Proposal, Place]), CommonModule],
  controllers: [ProposalController],
  providers: [ProposalService],
})
export class ProposalModule {}
