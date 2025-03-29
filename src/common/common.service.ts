import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { PagePaginationDto } from './dto/page-pagination.dto';

export class CommonService {
  constructor() {}

  applyPagePaginationParamsToQb<T extends ObjectLiteral>(
    qb: SelectQueryBuilder<T>,
    dto: PagePaginationDto,
  ) {
    const { page, limit } = dto;
    const skip = (page - 1) * limit;

    qb.take(limit);
    qb.skip(skip);
  }
}
