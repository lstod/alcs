import { DeepMocked, createMock } from '@golevelup/nestjs-testing';
import { Test, TestingModule } from '@nestjs/testing';
import * as dayjs from 'dayjs';
import * as timezone from 'dayjs/plugin/timezone';
import * as utc from 'dayjs/plugin/utc';
import { CdogsService } from '../../../../../../libs/common/src/cdogs/cdogs.service';
import { ServiceNotFoundException } from '../../../../../../libs/common/src/exceptions/base.exception';
import { ApplicationLocalGovernmentService } from '../../../alcs/application/application-code/application-local-government/application-local-government.service';
import { ApplicationDocumentService } from '../../../alcs/application/application-document/application-document.service';
import { Application } from '../../../alcs/application/application.entity';
import { ApplicationService } from '../../../alcs/application/application.service';
import { User } from '../../../user/user.entity';
import { ApplicationOwnerService } from '../application-owner/application-owner.service';
import { ApplicationParcelService } from '../application-parcel/application-parcel.service';
import { ApplicationSubmission } from '../application-submission.entity';
import { ApplicationSubmissionService } from '../application-submission.service';
import { GenerateSubmissionDocumentService } from './generate-submission-document.service';

dayjs.extend(utc);
dayjs.extend(timezone);

describe('GenerateSubmissionDocumentService', () => {
  let service: GenerateSubmissionDocumentService;
  let mockCdogsService: DeepMocked<CdogsService>;
  let mockApplicationSubmissionService: DeepMocked<ApplicationSubmissionService>;
  let mockApplicationLocalGovernmentService: DeepMocked<ApplicationLocalGovernmentService>;
  let mockApplicationService: DeepMocked<ApplicationService>;
  let mockApplicationParcelService: DeepMocked<ApplicationParcelService>;
  let mockApplicationOwnerService: DeepMocked<ApplicationOwnerService>;
  let mockApplicationDocumentService: DeepMocked<ApplicationDocumentService>;

  beforeEach(async () => {
    mockCdogsService = createMock();
    mockApplicationSubmissionService = createMock();
    mockApplicationLocalGovernmentService = createMock();
    mockApplicationService = createMock();
    mockApplicationParcelService = createMock();
    mockApplicationOwnerService = createMock();
    mockApplicationDocumentService = createMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenerateSubmissionDocumentService,
        { provide: CdogsService, useValue: mockCdogsService },
        {
          provide: ApplicationSubmissionService,
          useValue: mockApplicationSubmissionService,
        },
        {
          provide: ApplicationLocalGovernmentService,
          useValue: mockApplicationLocalGovernmentService,
        },
        { provide: ApplicationService, useValue: mockApplicationService },
        {
          provide: ApplicationParcelService,
          useValue: mockApplicationParcelService,
        },
        {
          provide: ApplicationOwnerService,
          useValue: mockApplicationOwnerService,
        },
        {
          provide: ApplicationDocumentService,
          useValue: mockApplicationDocumentService,
        },
      ],
    }).compile();

    service = module.get<GenerateSubmissionDocumentService>(
      GenerateSubmissionDocumentService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should call cdogs service to generate pdf for nfu', async () => {
    mockCdogsService.generateDocument.mockResolvedValue({} as any);

    mockApplicationSubmissionService.verifyAccess.mockResolvedValue({
      fileNumber: 'fake',
      localGovernmentUuid: 'fake-lg',
      typeCode: 'NFUP',
    } as ApplicationSubmission);
    mockApplicationDocumentService.list.mockResolvedValue([]);
    mockApplicationService.getOrFail.mockResolvedValue({
      type: { portalLabel: 'fake-label' },
    } as Application);
    mockApplicationLocalGovernmentService.getByUuid.mockResolvedValue(null);
    mockApplicationParcelService.fetchByApplicationFileId.mockResolvedValue([]);
    mockApplicationOwnerService.fetchByApplicationFileId.mockResolvedValue([]);
    const user = { user: { entity: 'Bruce' } };
    const userEntity = new User({
      name: user.user.entity,
    });

    const res = await service.generate('fake', userEntity);

    expect(mockCdogsService.generateDocument).toBeCalledTimes(1);
    expect(mockApplicationLocalGovernmentService.getByUuid).toBeCalledTimes(1);
    expect(res).toBeDefined();
  });

  it('should call cdogs service to generate pdf for tur', async () => {
    mockCdogsService.generateDocument.mockResolvedValue({} as any);

    mockApplicationSubmissionService.verifyAccess.mockResolvedValue({
      fileNumber: 'fake',
      localGovernmentUuid: 'fake-lg',
      typeCode: 'TURP',
    } as ApplicationSubmission);
    mockApplicationDocumentService.list.mockResolvedValue([]);
    mockApplicationService.getOrFail.mockResolvedValue({
      type: { portalLabel: 'fake-label' },
    } as Application);
    mockApplicationLocalGovernmentService.getByUuid.mockResolvedValue(null);
    mockApplicationParcelService.fetchByApplicationFileId.mockResolvedValue([]);
    mockApplicationOwnerService.fetchByApplicationFileId.mockResolvedValue([]);
    const user = { user: { entity: 'Bruce' } };
    const userEntity = new User({
      name: user.user.entity,
    });

    const res = await service.generate('fake', userEntity);

    expect(mockCdogsService.generateDocument).toBeCalledTimes(1);
    expect(mockApplicationLocalGovernmentService.getByUuid).toBeCalledTimes(1);
    expect(res).toBeDefined();
  });

  it('should fail if wrong submission type used', async () => {
    mockCdogsService.generateDocument.mockResolvedValue({} as any);

    mockApplicationSubmissionService.verifyAccess.mockResolvedValue({
      fileNumber: 'fake',
      localGovernmentUuid: 'fake-lg',
      typeCode: 'not a type',
    } as ApplicationSubmission);
    mockApplicationDocumentService.list.mockResolvedValue([]);
    mockApplicationService.getOrFail.mockResolvedValue({
      type: { portalLabel: 'fake-label' },
    } as Application);
    mockApplicationLocalGovernmentService.getByUuid.mockResolvedValue(null);
    mockApplicationParcelService.fetchByApplicationFileId.mockResolvedValue([]);
    mockApplicationOwnerService.fetchByApplicationFileId.mockResolvedValue([]);
    const user = { user: { entity: 'Bruce' } };
    const userEntity = new User({
      name: user.user.entity,
    });

    await expect(service.generate('fake', userEntity)).rejects.toMatchObject(
      new ServiceNotFoundException(
        `Could not find template for application submission type not a type`,
      ),
    );

    expect(mockCdogsService.generateDocument).toBeCalledTimes(0);
  });
});