import { IsNumber, IsOptional, IsString, ValidateIf } from 'class-validator';
import { ProposalType } from '../entities/proposal.entity';
import { Transform } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';
import { CreateProposalDto } from './create-proposal.dto';

export class UpdateProposalDto extends PartialType(CreateProposalDto) {}
