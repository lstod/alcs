import { BaseServiceException } from '@app/common/exceptions/base.exception';
import { createMock, DeepMocked } from '@golevelup/nestjs-testing';
import { Test, TestingModule } from '@nestjs/testing';
import { ClsService } from 'nestjs-cls';
import { mockKeyCloakProviders } from '../../../test/mocks/mockTypes';
import { ApplicationLocalGovernment } from '../../alcs/application/application-code/application-local-government/application-local-government.entity';
import { ApplicationLocalGovernmentService } from '../../alcs/application/application-code/application-local-government/application-local-government.service';
import {
  ApplicationDocumentCode,
  DOCUMENT_TYPE,
} from '../../alcs/application/application-document/application-document-code.entity';
import { ApplicationDocument } from '../../alcs/application/application-document/application-document.entity';
import { ApplicationDocumentService } from '../../alcs/application/application-document/application-document.service';
import { Application } from '../../alcs/application/application.entity';
import { ApplicationService } from '../../alcs/application/application.service';
import { DOCUMENT_SOURCE } from '../../document/document.dto';
import { Document } from '../../document/document.entity';
import { EmailStatus } from '../../providers/email/email-status.entity';
import { EmailService } from '../../providers/email/email.service';
import { User } from '../../user/user.entity';
import { ApplicationOwner } from '../application-submission/application-owner/application-owner.entity';
import { APPLICATION_STATUS } from '../application-submission/application-status/application-status.dto';
import { ApplicationStatus } from '../application-submission/application-status/application-status.entity';
import {
  ApplicationSubmissionValidatorService,
  ValidatedApplicationSubmission,
} from '../application-submission/application-submission-validator.service';
import { ApplicationSubmission } from '../application-submission/application-submission.entity';
import { ApplicationSubmissionService } from '../application-submission/application-submission.service';
import { ApplicationSubmissionReviewController } from './application-submission-review.controller';
import { ApplicationSubmissionReviewDto } from './application-submission-review.dto';
import { ApplicationSubmissionReview } from './application-submission-review.entity';
import { ApplicationSubmissionReviewService } from './application-submission-review.service';

describe('ApplicationSubmissionReviewController', () => {
  let controller: ApplicationSubmissionReviewController;
  let mockAppReviewService: DeepMocked<ApplicationSubmissionReviewService>;
  let mockAppSubmissionService: DeepMocked<ApplicationSubmissionService>;
  let mockLGService: DeepMocked<ApplicationLocalGovernmentService>;
  let mockAppDocService: DeepMocked<ApplicationDocumentService>;
  let mockAppValidatorService: DeepMocked<ApplicationSubmissionValidatorService>;
  let mockAppService: DeepMocked<ApplicationService>;
  let mockEmailService: DeepMocked<EmailService>;

  const mockLG = new ApplicationLocalGovernment({
    isFirstNation: false,
    isActive: true,
    bceidBusinessGuid: '',
    name: '',
    uuid: '',
  });

  let applicationReview;
  const fileNumber = '123';

  beforeEach(async () => {
    mockAppReviewService = createMock();
    mockAppSubmissionService = createMock();
    mockLGService = createMock();
    mockAppDocService = createMock();
    mockAppValidatorService = createMock();
    mockAppService = createMock();
    mockEmailService = createMock();

    applicationReview = new ApplicationSubmissionReview({
      applicationFileNumber: fileNumber,
    });

    mockAppReviewService.mapToDto.mockResolvedValue(
      {} as ApplicationSubmissionReviewDto,
    );

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApplicationSubmissionReviewController],
      providers: [
        {
          provide: ApplicationSubmissionReviewService,
          useValue: mockAppReviewService,
        },
        {
          provide: ApplicationSubmissionService,
          useValue: mockAppSubmissionService,
        },
        {
          provide: ApplicationLocalGovernmentService,
          useValue: mockLGService,
        },
        {
          provide: ApplicationDocumentService,
          useValue: mockAppDocService,
        },
        {
          provide: ApplicationSubmissionValidatorService,
          useValue: mockAppValidatorService,
        },
        {
          provide: ApplicationService,
          useValue: mockAppService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
        {
          provide: ClsService,
          useValue: {},
        },
        ...mockKeyCloakProviders,
      ],
    }).compile();

    controller = module.get<ApplicationSubmissionReviewController>(
      ApplicationSubmissionReviewController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should check users local government and return the file for get', async () => {
    mockLGService.getByGuid.mockResolvedValue(mockLG);
    mockAppReviewService.getByFileNumber.mockResolvedValue(applicationReview);
    mockAppSubmissionService.getForGovernmentByFileId.mockResolvedValue(
      new ApplicationSubmission(),
    );

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

  it('should fallback to load by owner if user has no government', async () => {
    const reviewWithApp = new ApplicationSubmissionReview({
      ...applicationReview,
      application: new Application({}),
    });

    mockLGService.getByGuid.mockResolvedValue(mockLG);
    mockAppReviewService.getByFileNumber.mockResolvedValue(reviewWithApp);
    mockAppSubmissionService.getByFileNumber.mockResolvedValue(
      new ApplicationSubmission({
        statusCode: APPLICATION_STATUS.SUBMITTED_TO_ALC,
        localGovernmentUuid: mockLG.uuid,
      }),
    );

    mockLGService.list.mockResolvedValue([mockLG]);

    const res = await controller.get(fileNumber, {
      user: {
        entity: new User({}),
      },
    });
    expect(res).toBeDefined();
  });

  it('should throw an exception when user loads review that is not complete', async () => {
    mockLGService.getByGuid.mockResolvedValue(mockLG);

    const reviewWithApp = new ApplicationSubmissionReview({
      ...applicationReview,
    });

    mockAppReviewService.getByFileNumber.mockResolvedValue(reviewWithApp);
    mockAppSubmissionService.getByFileNumber.mockResolvedValue(
      new ApplicationSubmission({
        statusCode: APPLICATION_STATUS.IN_PROGRESS,
        localGovernmentUuid: mockLG.uuid,
      }),
    );

    const promise = controller.get(fileNumber, {
      user: {
        entity: new User({}),
      },
    });
    await expect(promise).rejects.toMatchObject(
      new Error('Failed to load review'),
    );
  });

  it('should update the applications status when calling create', async () => {
    mockLGService.getByGuid.mockResolvedValue(mockLG);
    mockAppReviewService.startReview.mockResolvedValue(applicationReview);
    mockAppSubmissionService.getForGovernmentByFileId.mockResolvedValue(
      new ApplicationSubmission({
        owners: [],
      }),
    );
    mockAppSubmissionService.updateStatus.mockResolvedValue({} as any);

    await controller.create(fileNumber, {
      user: {
        entity: new User({
          bceidBusinessGuid: 'id',
        }),
      },
    });

    expect(mockLGService.getByGuid).toHaveBeenCalledTimes(1);
    expect(mockAppReviewService.startReview).toHaveBeenCalledTimes(1);
    expect(
      mockAppSubmissionService.getForGovernmentByFileId,
    ).toHaveBeenCalledTimes(1);
    expect(mockAppSubmissionService.updateStatus).toHaveBeenCalledTimes(1);
    expect(mockAppSubmissionService.updateStatus.mock.calls[0][1]).toEqual(
      APPLICATION_STATUS.IN_REVIEW,
    );
  });

  it('should send an email through the service when creating with a valid primary contact', async () => {
    mockLGService.getByGuid.mockResolvedValue(mockLG);
    mockAppReviewService.startReview.mockResolvedValue(applicationReview);
    mockAppSubmissionService.getForGovernmentByFileId.mockResolvedValue(
      new ApplicationSubmission({
        owners: [
          new ApplicationOwner({
            uuid: 'uuid',
            email: 'fake-email',
          }),
        ],
        primaryContactOwnerUuid: 'uuid',
      }),
    );
    mockAppSubmissionService.updateStatus.mockResolvedValue({} as any);
    mockAppService.fetchApplicationTypes.mockResolvedValue([]);
    mockAppSubmissionService.getStatus.mockResolvedValue(
      new ApplicationStatus({
        label: '',
      }),
    );
    mockEmailService.sendEmail.mockResolvedValue();

    await controller.create(fileNumber, {
      user: {
        entity: new User({
          bceidBusinessGuid: 'id',
        }),
      },
    });

    expect(mockEmailService.sendEmail).toHaveBeenCalledTimes(1);
    expect(mockLGService.getByGuid).toHaveBeenCalledTimes(1);
    expect(mockAppReviewService.startReview).toHaveBeenCalledTimes(1);
    expect(
      mockAppSubmissionService.getForGovernmentByFileId,
    ).toHaveBeenCalledTimes(1);
    expect(mockAppSubmissionService.updateStatus).toHaveBeenCalledTimes(1);
    expect(mockAppSubmissionService.updateStatus.mock.calls[0][1]).toEqual(
      APPLICATION_STATUS.IN_REVIEW,
    );
  });

  it('should call through to the service for update', async () => {
    mockLGService.getByGuid.mockResolvedValue(mockLG);
    mockAppReviewService.update.mockResolvedValue(applicationReview);
    mockAppSubmissionService.getForGovernmentByFileId.mockResolvedValue(
      new ApplicationSubmission(),
    );

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
    mockAppSubmissionService.getForGovernmentByFileId.mockResolvedValue(
      new ApplicationSubmission({
        statusCode: APPLICATION_STATUS.SUBMITTED_TO_ALC,
      }),
    );
    mockAppReviewService.verifyComplete.mockReturnValue(applicationReview);
    mockAppReviewService.getByFileNumber.mockResolvedValue(applicationReview);
    mockAppValidatorService.validateSubmission.mockResolvedValue({
      application:
        new ApplicationSubmission() as ValidatedApplicationSubmission,
      errors: [],
    });
    mockAppDocService.list.mockResolvedValue([]);

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
    mockAppSubmissionService.getForGovernmentByFileId.mockResolvedValue(
      new ApplicationSubmission({ statusCode: APPLICATION_STATUS.IN_REVIEW }),
    );
    mockAppReviewService.getByFileNumber.mockResolvedValue(applicationReview);
    mockAppDocService.list.mockResolvedValue([]);

    mockAppReviewService.verifyComplete.mockReturnValue({
      ...applicationReview,
      isAuthorized: true,
    });

    mockAppValidatorService.validateSubmission.mockResolvedValue({
      application:
        new ApplicationSubmission() as ValidatedApplicationSubmission,
      errors: [],
    });

    mockAppSubmissionService.submitToAlcs.mockResolvedValue(
      new Application({
        fileNumber: '',
        applicant: '',
        localGovernmentUuid: '',
        regionCode: '',
        typeCode: '',
      }),
    );

    mockAppSubmissionService.updateStatus.mockResolvedValue({} as any);

    await controller.finish(fileNumber, {
      user: {
        entity: new User({
          bceidBusinessGuid: 'id',
        }),
      },
    });

    expect(mockLGService.getByGuid).toHaveBeenCalledTimes(1);
    expect(
      mockAppSubmissionService.getForGovernmentByFileId,
    ).toHaveBeenCalledTimes(1);
    expect(mockAppReviewService.getByFileNumber).toHaveBeenCalledTimes(1);
    expect(mockAppReviewService.verifyComplete).toHaveBeenCalledTimes(1);
    expect(mockAppSubmissionService.submitToAlcs).toHaveBeenCalledTimes(1);
    expect(mockAppSubmissionService.updateStatus).toHaveBeenCalledTimes(1);
    expect(mockAppSubmissionService.updateStatus.mock.calls[0][1]).toEqual(
      APPLICATION_STATUS.SUBMITTED_TO_ALC,
    );
  });

  it('should load review and call submitToAlcs and set to refused to forward when not authorized', async () => {
    mockLGService.getByGuid.mockResolvedValue(mockLG);
    mockAppSubmissionService.getForGovernmentByFileId.mockResolvedValue(
      new ApplicationSubmission({ statusCode: APPLICATION_STATUS.IN_REVIEW }),
    );
    mockAppSubmissionService.submitToAlcs.mockResolvedValue(
      new Application({
        fileNumber: '',
        applicant: '',
        localGovernmentUuid: '',
        regionCode: '',
        typeCode: '',
      }),
    );

    mockAppReviewService.verifyComplete.mockReturnValue({
      ...applicationReview,
      isAuthorized: false,
    });
    mockAppReviewService.getByFileNumber.mockResolvedValue(applicationReview);
    mockAppValidatorService.validateSubmission.mockResolvedValue({
      application:
        new ApplicationSubmission() as ValidatedApplicationSubmission,
      errors: [],
    });
    mockAppSubmissionService.updateStatus.mockResolvedValue({} as any);
    mockAppDocService.list.mockResolvedValue([]);

    await controller.finish(fileNumber, {
      user: {
        entity: new User({
          bceidBusinessGuid: 'id',
        }),
      },
    });

    expect(mockLGService.getByGuid).toHaveBeenCalledTimes(1);
    expect(
      mockAppSubmissionService.getForGovernmentByFileId,
    ).toHaveBeenCalledTimes(1);
    expect(mockAppReviewService.getByFileNumber).toHaveBeenCalledTimes(1);
    expect(mockAppReviewService.verifyComplete).toHaveBeenCalledTimes(1);
    expect(mockAppSubmissionService.submitToAlcs).toHaveBeenCalledTimes(1);
    expect(mockAppSubmissionService.updateStatus).toHaveBeenCalledTimes(1);
    expect(mockAppSubmissionService.updateStatus.mock.calls[0][1]).toEqual(
      APPLICATION_STATUS.REFUSED_TO_FORWARD,
    );
  });

  it('should update the status, delete documents, and update the application for return', async () => {
    mockLGService.getByGuid.mockResolvedValue(mockLG);
    mockAppSubmissionService.getForGovernmentByFileId.mockResolvedValue(
      new ApplicationSubmission({
        statusCode: APPLICATION_STATUS.IN_REVIEW,
      }),
    );
    mockAppSubmissionService.updateStatus.mockResolvedValue({} as any);
    mockAppReviewService.getByFileNumber.mockResolvedValue(applicationReview);
    mockAppReviewService.delete.mockResolvedValue();
    mockAppDocService.delete.mockResolvedValue({} as any);

    const documents = [
      new ApplicationDocument({
        type: new ApplicationDocumentCode({
          code: DOCUMENT_TYPE.RESOLUTION_DOCUMENT,
        }),
        document: new Document({
          source: DOCUMENT_SOURCE.LFNG,
        }),
      }),
      new ApplicationDocument({
        type: new ApplicationDocumentCode({
          code: DOCUMENT_TYPE.CERTIFICATE_OF_TITLE,
        }),
        document: new Document({
          source: DOCUMENT_SOURCE.APPLICANT,
        }),
      }),
    ];
    mockAppDocService.list.mockResolvedValue(documents);

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
    expect(
      mockAppSubmissionService.getForGovernmentByFileId,
    ).toHaveBeenCalledTimes(1);
    expect(mockAppReviewService.getByFileNumber).toHaveBeenCalledTimes(1);
    expect(mockAppSubmissionService.updateStatus).toHaveBeenCalledTimes(1);
    expect(mockAppDocService.delete).toHaveBeenCalledTimes(1);
    expect(mockAppReviewService.delete).toHaveBeenCalledTimes(1);
    expect(mockAppSubmissionService.updateStatus.mock.calls[0][1]).toEqual(
      APPLICATION_STATUS.INCOMPLETE,
    );
  });

  it('should throw an exception when trying to return an application not in review', async () => {
    mockLGService.getByGuid.mockResolvedValue(mockLG);
    mockAppSubmissionService.getForGovernmentByFileId.mockResolvedValue(
      new ApplicationSubmission({
        statusCode: APPLICATION_STATUS.SUBMITTED_TO_ALC,
      }),
    );
    mockAppReviewService.getByFileNumber.mockResolvedValue(applicationReview);

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
    expect(mockAppReviewService.getByFileNumber).toHaveBeenCalledTimes(1);
  });
});
