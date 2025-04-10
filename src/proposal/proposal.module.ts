import { Module } from '@nestjs/common';
import { ProposalService } from './proposal.service';
import { ProposalController } from './proposal.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Proposal } from './entities/proposal.entity';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [TypeOrmModule.forFeature([Proposal]), CommonModule],
  controllers: [ProposalController],
  providers: [ProposalService],
})
export class ProposalModule {}
