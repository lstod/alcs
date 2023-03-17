import { classes } from '@automapper/classes';
import { AutomapperModule } from '@automapper/nestjs';
import { createMock, DeepMocked } from '@golevelup/nestjs-testing';
import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { mockKeyCloakProviders } from '../../test/mocks/mockTypes';
import { ApplicationGrpcResponse } from '../alcs/application-grpc/alcs-application.message.interface';
import { LocalGovernmentService } from '../alcs/local-government/local-government.service';
import { ApplicationSubmissionProfile } from '../common/automapper/application-submission.automapper.profile';
import { User } from '../user/user.entity';
import { ApplicationDocumentService } from './application-document/application-document.service';
import { APPLICATION_STATUS } from './application-status/application-status.dto';
import { ApplicationStatus } from './application-status/application-status.entity';
import {
  ApplicationSubmissionValidatorService,
  ValidatedApplicationSubmission,
} from './application-submission-validator.service';
import { ApplicationSubmissionController } from './application-submission.controller';
import {
  ApplicationSubmissionDetailedDto,
  ApplicationSubmissionDto,
} from './application-submission.dto';
import { ApplicationSubmission } from './application-submission.entity';
import { ApplicationSubmissionService } from './application-submission.service';

describe('ApplicationSubmissionController', () => {
  let controller: ApplicationSubmissionController;
  let mockAppService: DeepMocked<ApplicationSubmissionService>;
  let mockDocumentService: DeepMocked<ApplicationDocumentService>;
  let mockLgService: DeepMocked<LocalGovernmentService>;
  let mockAppValidationService: DeepMocked<ApplicationSubmissionValidatorService>;

  const localGovernmentUuid = 'local-government';
  const applicant = 'fake-applicant';
  const bceidBusinessGuid = 'business-guid';

  beforeEach(async () => {
    mockAppService = createMock();
    mockDocumentService = createMock();
    mockLgService = createMock();
    mockAppValidationService = createMock();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApplicationSubmissionController],
      providers: [
        ApplicationSubmissionProfile,
        {
          provide: ApplicationSubmissionService,
          useValue: mockAppService,
        },
        {
          provide: ApplicationDocumentService,
          useValue: mockDocumentService,
        },
        {
          provide: LocalGovernmentService,
          useValue: mockLgService,
        },
        {
          provide: ApplicationSubmissionValidatorService,
          useValue: mockAppValidationService,
        },
        ...mockKeyCloakProviders,
      ],
      imports: [
        AutomapperModule.forRoot({
          strategyInitializer: classes(),
        }),
      ],
    }).compile();

    controller = module.get<ApplicationSubmissionController>(
      ApplicationSubmissionController,
    );

    mockAppService.update.mockResolvedValue(
      new ApplicationSubmission({
        applicant: applicant,
        localGovernmentUuid,
      }),
    );

    mockAppService.create.mockResolvedValue('2');
    mockAppService.getIfCreator.mockResolvedValue(new ApplicationSubmission());
    mockAppService.verifyAccess.mockResolvedValue(new ApplicationSubmission());

    mockAppService.mapToDTOs.mockResolvedValue([]);
    mockLgService.get.mockResolvedValue([
      {
        uuid: localGovernmentUuid,
        bceidBusinessGuid,
        name: 'fake-name',
        isFirstNation: false,
      },
    ]);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call out to service when fetching applications', async () => {
    mockAppService.getByUser.mockResolvedValue([]);

    const applications = await controller.getApplications({
      user: {
        entity: new User(),
      },
    });

    expect(applications).toBeDefined();
    expect(mockAppService.getByUser).toHaveBeenCalledTimes(1);
  });

  it('should fetch by bceid if user has same guid as a local government', async () => {
    mockAppService.getForGovernment.mockResolvedValue([]);

    const applications = await controller.getApplications({
      user: {
        entity: new User({
          bceidBusinessGuid,
        }),
      },
    });

    expect(applications).toBeDefined();
    expect(mockAppService.getForGovernment).toHaveBeenCalledTimes(1);
  });

  it('should call out to service when cancelling an application', async () => {
    mockAppService.mapToDTOs.mockResolvedValue([
      {} as ApplicationSubmissionDto,
    ]);
    mockAppService.getIfCreator.mockResolvedValue(
      new ApplicationSubmission({
        status: new ApplicationStatus({
          code: APPLICATION_STATUS.IN_PROGRESS,
        }),
      }),
    );
    mockAppService.cancel.mockResolvedValue();

    const application = await controller.cancel('file-id', {
      user: {
        entity: new User(),
      },
    });

    expect(application).toBeDefined();
    expect(mockAppService.cancel).toHaveBeenCalledTimes(1);
    expect(mockAppService.getIfCreator).toHaveBeenCalledTimes(1);
  });

  it('should throw an exception when trying to cancel an application that is not in progress', async () => {
    mockAppService.getIfCreator.mockResolvedValue(
      new ApplicationSubmission({
        status: new ApplicationStatus({
          code: APPLICATION_STATUS.CANCELLED,
        }),
      }),
    );

    const promise = controller.cancel('file-id', {
      user: {
        entity: new User(),
      },
    });

    await expect(promise).rejects.toMatchObject(
      new BadRequestException('Can only cancel in progress Applications'),
    );
    expect(mockAppService.cancel).toHaveBeenCalledTimes(0);
    expect(mockAppService.getIfCreator).toHaveBeenCalledTimes(1);
  });

  it('should call out to service when fetching an application', async () => {
    mockAppService.mapToDetailedDTO.mockResolvedValue(
      {} as ApplicationSubmissionDetailedDto,
    );

    const application = await controller.getApplication(
      {
        user: {
          entity: new User(),
        },
      },
      'file-id',
    );

    expect(application).toBeDefined();
    expect(mockAppService.getIfCreator).toHaveBeenCalledTimes(1);
  });

  it('should fetch application by bceid if user has same guid as a local government', async () => {
    const bceidBusinessGuid = 'business-guid';
    mockLgService.getByGuid.mockResolvedValue({
      uuid: '',
      bceidBusinessGuid,
      name: 'fake-name',
      isFirstNation: false,
    });
    const mockApplication = new ApplicationSubmission();
    mockAppService.getForGovernmentByFileId.mockResolvedValue(mockApplication);
    mockAppService.mapToDetailedDTO.mockResolvedValue(
      {} as ApplicationSubmissionDetailedDto,
    );

    const application = await controller.getApplication(
      {
        user: {
          entity: new User({
            bceidBusinessGuid,
          }),
        },
      },
      'file-id',
    );

    expect(application).toBeDefined();
    expect(mockAppService.getForGovernmentByFileId).toHaveBeenCalledTimes(1);
  });

  it('should call out to service when creating an application', async () => {
    mockAppService.create.mockResolvedValue('');
    mockAppService.mapToDTOs.mockResolvedValue([
      {} as ApplicationSubmissionDto,
    ]);

    const application = await controller.create(
      {
        user: {
          entity: new User(),
        },
      },
      {
        type: '',
      },
    );

    expect(application).toBeDefined();
    expect(mockAppService.create).toHaveBeenCalledTimes(1);
  });

  it('should call out to service for update and map', async () => {
    mockAppService.mapToDetailedDTO.mockResolvedValue(
      {} as ApplicationSubmissionDetailedDto,
    );

    await controller.update(
      'file-id',
      {
        localGovernmentUuid,
        applicant,
      },
      {
        user: {
          entity: new User(),
        },
      },
    );

    expect(mockAppService.verifyAccess).toHaveBeenCalledTimes(1);
    expect(mockAppService.mapToDetailedDTO).toHaveBeenCalledTimes(1);
  });

  it('should call out to service on submitAlcs if application type is TURP', async () => {
    const mockFileId = 'file-id';
    mockAppService.submitToAlcs.mockResolvedValue(
      {} as ApplicationGrpcResponse,
    );
    mockAppService.getIfCreator.mockResolvedValue(
      new ApplicationSubmission({
        typeCode: 'TURP',
      }),
    );
    mockAppService.updateStatus.mockResolvedValue();
    mockAppValidationService.validateApplication.mockResolvedValue({
      application: new ApplicationSubmission({
        typeCode: 'TURP',
      }) as ValidatedApplicationSubmission,
      errors: [],
    });

    await controller.submitAsApplicant(mockFileId, {
      user: {
        entity: new User(),
      },
    });

    expect(mockAppService.getIfCreator).toHaveBeenCalledTimes(1);
    expect(mockAppService.submitToAlcs).toHaveBeenCalledTimes(1);
    expect(mockAppService.updateStatus).toHaveBeenCalledTimes(1);
  });

  it('should submit to LG if application type is NOT-TURP', async () => {
    const mockFileId = 'file-id';
    mockAppService.submitToLg.mockResolvedValue();
    mockAppService.getIfCreator.mockResolvedValue(
      new ApplicationSubmission({
        typeCode: 'NOT-TURP',
        localGovernmentUuid,
      }),
    );
    mockAppValidationService.validateApplication.mockResolvedValue({
      application:
        new ApplicationSubmission() as ValidatedApplicationSubmission,
      errors: [],
    });

    await controller.submitAsApplicant(mockFileId, {
      user: {
        entity: new User(),
      },
    });

    expect(mockAppService.getIfCreator).toHaveBeenCalledTimes(1);
    expect(mockAppService.submitToLg).toHaveBeenCalledTimes(1);
  });

  it('should throw an exception if application fails validation', async () => {
    const mockFileId = 'file-id';
    mockAppService.getIfCreator.mockResolvedValue(
      new ApplicationSubmission({
        typeCode: 'NOT-TURP',
      }),
    );
    mockAppValidationService.validateApplication.mockResolvedValue({
      application: undefined,
      errors: [new Error('Failed to validate')],
    });

    const promise = controller.submitAsApplicant(mockFileId, {
      user: {
        entity: new User(),
      },
    });

    await expect(promise).rejects.toMatchObject(
      new BadRequestException('Invalid Application'),
    );
  });
});
