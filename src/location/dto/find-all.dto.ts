import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class FindAllDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page: number = 0;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit: number = 10;

  @IsOptional()
  @IsString()
  query: string;
}
