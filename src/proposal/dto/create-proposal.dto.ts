import {
  IsDefined,
  IsEmpty,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import { ProposalType } from '../entities/proposal.entity';

export class CreateProposalDto {
  @IsEnum(ProposalType)
  @IsNotEmpty()
  type: ProposalType;

  @IsString()
  @IsNotEmpty()
  comment: string;

  @IsNumber()
  @ValidateIf(
    (o) => o.type === ProposalType.UPDATE || o.type === ProposalType.DELETE,
  )
  @IsNotEmpty()
  placeId: number;
}
