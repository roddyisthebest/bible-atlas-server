import { Test, TestingModule } from '@nestjs/testing';
import { PlaceTypeService } from './place-type.service';

describe('PlaceTypeService', () => {
  let service: PlaceTypeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PlaceTypeService],
    }).compile();

    service = module.get<PlaceTypeService>(PlaceTypeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
