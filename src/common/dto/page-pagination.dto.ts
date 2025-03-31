import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class PagePaginationDto {
  @IsInt()
  @IsOptional()
  page: number = 0;

  @IsInt()
  @IsOptional()
  @Max(100)
  @Min(1)
  limit: number = 10;
}
