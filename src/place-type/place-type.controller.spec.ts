import { Test, TestingModule } from '@nestjs/testing';
import { PlaceTypeController } from './place-type.controller';
import { PlaceTypeService } from './place-type.service';

describe('PlaceTypeController', () => {
  let controller: PlaceTypeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlaceTypeController],
      providers: [PlaceTypeService],
    }).compile();

    controller = module.get<PlaceTypeController>(PlaceTypeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
