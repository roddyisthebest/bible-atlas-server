import { Test, TestingModule } from '@nestjs/testing';
import { AdminLocationController } from './admin-location.controller';
import { AdminLocationService } from './admin-location.service';

describe('AdminLocationController', () => {
  let controller: AdminLocationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminLocationController],
      providers: [AdminLocationService],
    }).compile();

    controller = module.get<AdminLocationController>(AdminLocationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
