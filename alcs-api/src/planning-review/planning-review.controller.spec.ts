import { createMock, DeepMocked } from '@golevelup/nestjs-testing';
import { Test, TestingModule } from '@nestjs/testing';
import { ClsService } from 'nestjs-cls';
import { Board } from '../board/board.entity';
import { BoardService } from '../board/board.service';
import { mockKeyCloakProviders } from '../common/utils/test-helpers/mockTypes';
import { PlanningReviewController } from './planning-review.controller';
import { PlanningReview } from './planning-review.entity';
import { PlanningReviewService } from './planning-review.service';

describe('PlanningReviewController', () => {
  let controller: PlanningReviewController;
  let mockService: DeepMocked<PlanningReviewService>;
  let mockBoardService: DeepMocked<BoardService>;

  beforeEach(async () => {
    mockService = createMock<PlanningReviewService>();
    mockBoardService = createMock<BoardService>();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlanningReviewController],
      providers: [
        {
          provide: PlanningReviewService,
          useValue: mockService,
        },
        {
          provide: BoardService,
          useValue: mockBoardService,
        },
        {
          provide: ClsService,
          useValue: {},
        },
        ...mockKeyCloakProviders,
      ],
    }).compile();

    controller = module.get<PlanningReviewController>(PlanningReviewController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call board service then main service for create', async () => {
    mockBoardService.getOne.mockResolvedValue({} as Board);
    mockService.create.mockResolvedValue({} as PlanningReview);
    mockService.mapToDtos.mockResolvedValue([]);

    await controller.create({
      type: 'type',
      localGovernmentUuid: 'local-gov-uuid',
      fileNumber: 'file-number',
      regionCode: 'region-code',
    });

    expect(mockBoardService.getOne).toHaveBeenCalled();
    expect(mockService.create).toHaveBeenCalled();
    expect(mockService.mapToDtos).toHaveBeenCalled();
  });

  it('should call through to service for get card', async () => {
    mockService.getByCardUuid.mockResolvedValue({} as PlanningReview);
    mockService.mapToDtos.mockResolvedValue([]);

    await controller.getByCard('uuid');

    expect(mockService.getByCardUuid).toHaveBeenCalled();
    expect(mockService.mapToDtos).toHaveBeenCalled();
  });
});
