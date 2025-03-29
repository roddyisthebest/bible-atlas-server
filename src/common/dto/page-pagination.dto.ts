import { IsInt, IsOptional } from 'class-validator';

export class PagePaginationDto {
  @IsInt()
  @IsOptional()
  page: number = 0;

  @IsInt()
  @IsOptional()
  limit: number = 10;
}
