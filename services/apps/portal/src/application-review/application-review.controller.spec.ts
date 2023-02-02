import { BaseServiceException } from '@app/common/exceptions/base.exception';
import { createMock, DeepMocked } from '@golevelup/nestjs-testing';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { mockKeyCloakProviders } from '../../test/mocks/mockTypes';
import { LocalGovernmentService } from '../alcs/local-government/local-government.service';
import {
  ApplicationDocument,
  DOCUMENT_TYPE,
} from '../application/application-document/application-document.entity';
import { ApplicationDocumentService } from '../application/application-document/application-document.service';
import { APPLICATION_STATUS } from '../application/application-status/application-status.dto';
import { Application } from '../application/application.entity';
import { ApplicationService } from '../application/application.service';
import { User } from '../user/user.entity';
import { ApplicationReviewController } from './application-review.controller';
import { ApplicationReviewDto } from './application-review.dto';
import { ApplicationReview } from './application-review.entity';
import {
  ApplicationReviewService,
  CompletedApplicationReview,
} from './application-review.service';

describe('ApplicationReviewController', () => {
  let controller: ApplicationReviewController;
  let mockAppReviewService: DeepMocked<ApplicationReviewService>;
  let mockAppService: DeepMocked<ApplicationService>;
  let mockLGService: DeepMocked<LocalGovernmentService>;
  let mockAppDocService: DeepMocked<ApplicationDocumentService>;

  const mockLG = {
    isFirstNation: false,
    bceidBusinessGuid: '',
    name: '',
    uuid: '',
  };

  let applicationReview;
  const fileNumber = '123';

  beforeEach(async () => {
    mockAppReviewService = createMock();
    mockAppService = createMock();
    mockLGService = createMock();
    mockAppDocService = createMock();

    applicationReview = new ApplicationReview({
      applicationFileNumber: fileNumber,
    });

    mockAppReviewService.mapToDto.mockResolvedValue({} as ApplicationReviewDto);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApplicationReviewController],
      providers: [
        {
          provide: ApplicationReviewService,
          useValue: mockAppReviewService,
        },
        {
          provide: ApplicationService,
          useValue: mockAppService,
        },
        {
          provide: LocalGovernmentService,
          useValue: mockLGService,
        },
        {
          provide: ApplicationDocumentService,
          useValue: mockAppDocService,
        },
        ...mockKeyCloakProviders,
      ],
    }).compile();

    controller = module.get<ApplicationReviewController>(
      ApplicationReviewController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should check users local government and return the file for get', async () => {
    mockLGService.getByGuid.mockResolvedValue(mockLG);
    mockAppReviewService.get.mockResolvedValue(applicationReview);

    const res = await controller.get(fileNumber, {
      user: {
        entity: new User({
          bceidBusinessGuid: 'fake-guid',
        }),
      },
    });
    expect(res).toBeDefined();
    expect(mockAppReviewService.mapToDto).toHaveBeenCalledTimes(1);
  });

  it('should throw an exception for get if user is not local government', async () => {
    mockLGService.getByGuid.mockResolvedValue(mockLG);
    mockAppReviewService.get.mockResolvedValue(applicationReview);

    const promise = controller.get(fileNumber, {
      user: {
        entity: new User({}),
      },
    });
    await expect(promise).rejects.toMatchObject(
      new NotFoundException('User not part of any local government'),
    );
  });

  it('update the applications status when calling create', async () => {
    mockLGService.getByGuid.mockResolvedValue(mockLG);
    mockAppReviewService.startReview.mockResolvedValue(applicationReview);
    mockAppService.getForGovernmentByFileId.mockResolvedValue(
      new Application(),
    );
    mockAppService.updateStatus.mockResolvedValue({} as any);

    await controller.create(fileNumber, {
      user: {
        entity: new User({
          bceidBusinessGuid: 'id',
        }),
      },
    });

    expect(mockLGService.getByGuid).toHaveBeenCalledTimes(1);
    expect(mockAppReviewService.startReview).toHaveBeenCalledTimes(1);
    expect(mockAppService.getForGovernmentByFileId).toHaveBeenCalledTimes(1);
    expect(mockAppService.updateStatus).toHaveBeenCalledTimes(1);
    expect(mockAppService.updateStatus.mock.calls[0][1]).toEqual(
      APPLICATION_STATUS.IN_REVIEW,
    );
  });

  it('should call through to the service for update', async () => {
    mockLGService.getByGuid.mockResolvedValue(mockLG);
    mockAppReviewService.update.mockResolvedValue(applicationReview);

    await controller.update(
      fileNumber,
      {
        user: {
          entity: new User({
            bceidBusinessGuid: 'id',
          }),
        },
      },
      {},
    );

    expect(mockLGService.getByGuid).toHaveBeenCalledTimes(1);
    expect(mockAppReviewService.update).toHaveBeenCalledTimes(1);
  });

  it('should throw an exception when trying to finish a review on an application not in review', async () => {
    mockLGService.getByGuid.mockResolvedValue(mockLG);
    mockAppService.getForGovernmentByFileId.mockResolvedValue(
      new Application({ statusCode: APPLICATION_STATUS.SUBMITTED_TO_ALC }),
    );
    mockAppReviewService.verifyComplete.mockReturnValue(
      applicationReview as CompletedApplicationReview,
    );
    mockAppReviewService.get.mockResolvedValue(applicationReview);

    const promise = controller.finish(fileNumber, {
      user: {
        entity: new User({
          bceidBusinessGuid: 'id',
        }),
      },
    });

    await expect(promise).rejects.toMatchObject(
      new BaseServiceException('Application not in correct status'),
    );

    expect(mockLGService.getByGuid).toHaveBeenCalledTimes(1);
    expect(mockAppReviewService.verifyComplete).toHaveBeenCalledTimes(1);
  });

  it('should load review and call submitToAlcs when in correct status for finish', async () => {
    mockLGService.getByGuid.mockResolvedValue(mockLG);
    mockAppService.getForGovernmentByFileId.mockResolvedValue(
      new Application({ statusCode: APPLICATION_STATUS.IN_REVIEW }),
    );
    mockAppService.submitToAlcs.mockResolvedValue({
      fileNumber: '',
      applicant: '',
      localGovernmentUuid: '',
      dateSubmittedToAlc: '',
      regionCode: '',
      typeCode: '',
    });
    mockAppReviewService.verifyComplete.mockReturnValue({
      ...applicationReview,
      isAuthorized: true,
    } as CompletedApplicationReview);
    mockAppReviewService.get.mockResolvedValue(applicationReview);

    await controller.finish(fileNumber, {
      user: {
        entity: new User({
          bceidBusinessGuid: 'id',
        }),
      },
    });

    expect(mockLGService.getByGuid).toHaveBeenCalledTimes(1);
    expect(mockAppService.getForGovernmentByFileId).toHaveBeenCalledTimes(1);
    expect(mockAppReviewService.get).toHaveBeenCalledTimes(1);
    expect(mockAppReviewService.verifyComplete).toHaveBeenCalledTimes(1);
    expect(mockAppService.submitToAlcs).toHaveBeenCalledTimes(1);
  });

  it('should update the status and not submit if the review is not authorized', async () => {
    mockLGService.getByGuid.mockResolvedValue(mockLG);
    mockAppService.getForGovernmentByFileId.mockResolvedValue(
      new Application({ statusCode: APPLICATION_STATUS.IN_REVIEW }),
    );
    mockAppService.updateStatus.mockResolvedValue({} as any);
    mockAppReviewService.verifyComplete.mockReturnValue({
      ...applicationReview,
      isAuthorized: false,
    } as CompletedApplicationReview);
    mockAppReviewService.get.mockResolvedValue(applicationReview);

    await controller.finish(fileNumber, {
      user: {
        entity: new User({
          bceidBusinessGuid: 'id',
        }),
      },
    });

    expect(mockLGService.getByGuid).toHaveBeenCalledTimes(1);
    expect(mockAppService.getForGovernmentByFileId).toHaveBeenCalledTimes(1);
    expect(mockAppReviewService.get).toHaveBeenCalledTimes(1);
    expect(mockAppReviewService.verifyComplete).toHaveBeenCalledTimes(1);
    expect(mockAppService.submitToAlcs).toHaveBeenCalledTimes(0);
    expect(mockAppService.updateStatus).toHaveBeenCalledTimes(1);
    expect(mockAppService.updateStatus.mock.calls[0][1]).toEqual(
      APPLICATION_STATUS.REFUSED_TO_FORWARD,
    );
  });

  it('should update the status, delete documents, and update the application for return', async () => {
    mockLGService.getByGuid.mockResolvedValue(mockLG);
    mockAppService.getForGovernmentByFileId.mockResolvedValue(
      new Application({
        statusCode: APPLICATION_STATUS.IN_REVIEW,
        documents: [
          new ApplicationDocument({
            type: DOCUMENT_TYPE.RESOLUTION_DOCUMENT,
          }),
          new ApplicationDocument({
            type: DOCUMENT_TYPE.CERTIFICATE_OF_TITLE,
          }),
        ],
      }),
    );
    mockAppService.updateStatus.mockResolvedValue({} as any);
    mockAppService.update.mockResolvedValue({} as any);
    mockAppReviewService.get.mockResolvedValue(applicationReview);
    mockAppReviewService.delete.mockResolvedValue();
    mockAppDocService.delete.mockResolvedValue({} as any);

    await controller.return(
      fileNumber,
      {
        user: {
          entity: new User({
            bceidBusinessGuid: 'id',
          }),
        },
      },
      {
        reasonForReturn: 'incomplete',
        applicantComment: 'test-comment',
      },
    );

    expect(mockLGService.getByGuid).toHaveBeenCalledTimes(1);
    expect(mockAppService.getForGovernmentByFileId).toHaveBeenCalledTimes(1);
    expect(mockAppReviewService.get).toHaveBeenCalledTimes(1);
    expect(mockAppService.updateStatus).toHaveBeenCalledTimes(1);
    expect(mockAppService.update).toHaveBeenCalledTimes(1);
    expect(mockAppDocService.delete).toHaveBeenCalledTimes(1);
    expect(mockAppReviewService.delete).toHaveBeenCalledTimes(1);
    expect(mockAppService.updateStatus.mock.calls[0][1]).toEqual(
      APPLICATION_STATUS.INCOMPLETE,
    );
  });

  it('should throw an exception when trying to return an application not in review', async () => {
    mockLGService.getByGuid.mockResolvedValue(mockLG);
    mockAppService.getForGovernmentByFileId.mockResolvedValue(
      new Application({ statusCode: APPLICATION_STATUS.SUBMITTED_TO_ALC }),
    );
    mockAppReviewService.get.mockResolvedValue(applicationReview);

    const promise = controller.return(
      fileNumber,
      {
        user: {
          entity: new User({
            bceidBusinessGuid: 'id',
          }),
        },
      },
      {
        applicantComment: '',
        reasonForReturn: 'incomplete',
      },
    );

    await expect(promise).rejects.toMatchObject(
      new BaseServiceException('Application not in correct status'),
    );

    expect(mockLGService.getByGuid).toHaveBeenCalledTimes(1);
    expect(mockAppReviewService.get).toHaveBeenCalledTimes(1);
  });
});