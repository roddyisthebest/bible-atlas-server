import { Test, TestingModule } from '@nestjs/testing';
import { PlaceReportController } from './place-report.controller';
import { PlaceReportService } from './place-report.service';

describe('PlaceReportController', () => {
  let controller: PlaceReportController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlaceReportController],
      providers: [PlaceReportService],
    }).compile();

    controller = module.get<PlaceReportController>(PlaceReportController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
