import { Injectable } from '@nestjs/common';

import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CommonService } from 'src/common/common.service';
import { instanceToPlain } from 'class-transformer';

@Injectable()
export class ReportService {
  constructor(private readonly commonService: CommonService) {}
}
