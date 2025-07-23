import { Test, TestingModule } from '@nestjs/testing';
import { PlaceReportService } from './place-report.service';

describe('PlaceReportService', () => {
  let service: PlaceReportService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PlaceReportService],
    }).compile();

    service = module.get<PlaceReportService>(PlaceReportService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
