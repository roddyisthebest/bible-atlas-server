import {
  IsDefined,
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

  @ValidateIf((o) => o.type === ProposalType.CREATE)
  @IsString()
  @IsNotEmpty()
  newLocationName: string;

  @ValidateIf((o) => o.type === ProposalType.CREATE)
  @IsString()
  @IsNotEmpty()
  newLocationDescription: string;

  @ValidateIf((o) => o.type === ProposalType.DELETE)
  @IsString()
  @IsNotEmpty()
  comment: string;

  @ValidateIf((o) => o.type === ProposalType.CREATE)
  @IsNumber()
  @IsNotEmpty()
  newLatitude: number;

  @ValidateIf((o) => o.type === ProposalType.CREATE)
  @IsNumber()
  @IsNotEmpty()
  newLongitude: number;

  @ValidateIf(
    (o) => o.type === ProposalType.UPDATE || o.type === ProposalType.DELETE,
  )
  @IsNumber()
  @IsNotEmpty()
  locationId: number;
}
