import { IsNumber, IsOptional, IsString, ValidateIf } from 'class-validator';
import { ProposalType } from '../entities/proposal.entity';
import { Transform } from 'class-transformer';

export class UpdateProposalDto {
  @ValidateIf(
    (o) => o.type === ProposalType.CREATE || o.type === ProposalType.UPDATE,
  )
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : value))
  newLocationName: string;

  @ValidateIf(
    (o) => o.type === ProposalType.CREATE || o.type === ProposalType.UPDATE,
  )
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : value))
  newLocationDescription: string;

  @ValidateIf(
    (o) => o.type === ProposalType.UPDATE || o.type === ProposalType.DELETE,
  )
  @IsString()
  @IsOptional()
  comment: string;

  @ValidateIf(
    (o) => o.type === ProposalType.CREATE || o.type === ProposalType.UPDATE,
  )
  @IsNumber()
  @IsOptional()
  newLatitude: number;

  @ValidateIf(
    (o) => o.type === ProposalType.CREATE || o.type === ProposalType.UPDATE,
  )
  @IsNumber()
  @IsOptional()
  newLongitude: number;
}
