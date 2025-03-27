import { Test, TestingModule } from '@nestjs/testing';
import { AdminLocationService } from './admin-location.service';

describe('AdminLocationService', () => {
  let service: AdminLocationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminLocationService],
    }).compile();

    service = module.get<AdminLocationService>(AdminLocationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
