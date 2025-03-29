import { Module } from '@nestjs/common';
import { ProposalService } from './proposal.service';
import { ProposalController } from './proposal.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Proposal } from './entities/proposal.entity';
import { Location } from 'src/location/entities/location.entity';
import { CommonModule } from 'src/common/common.module';
import { ProposalAgreement } from './entities/proposal-agreement.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Proposal, Location, ProposalAgreement]),
    CommonModule,
  ],
  controllers: [ProposalController],
  providers: [ProposalService],
})
export class ProposalModule {}
