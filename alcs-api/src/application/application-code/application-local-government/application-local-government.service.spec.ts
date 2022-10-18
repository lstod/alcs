import { createMock, DeepMocked } from '@golevelup/nestjs-testing';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApplicationLocalGovernment } from './application-local-government.entity';
import { ApplicationLocalGovernmentService } from './application-local-government.service';

describe('ApplicationLocalGovernmentService', () => {
  let mockRepository: DeepMocked<Repository<ApplicationLocalGovernment>>;

  let service: ApplicationLocalGovernmentService;

  beforeEach(async () => {
    mockRepository = createMock<Repository<ApplicationLocalGovernment>>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicationLocalGovernmentService,
        {
          provide: getRepositoryToken(ApplicationLocalGovernment),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ApplicationLocalGovernmentService>(
      ApplicationLocalGovernmentService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should call repositories when listing', async () => {
    mockRepository.find.mockResolvedValue([]);

    await service.list();

    expect(mockRepository.find).toHaveBeenCalledTimes(1);
  });
});
