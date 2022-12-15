import { ServiceNotFoundException } from '@app/common/exceptions/base.exception';
import { MultipartFile } from '@fastify/multipart';
import { createMock, DeepMocked } from '@golevelup/nestjs-testing';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentService } from '../../alcs/document/document.service';
import { User } from '../../user/user.entity';
import { Application } from '../application.entity';
import { ApplicationService } from '../application.service';
import { ApplicationDocument } from './application-document.entity';
import { ApplicationDocumentService } from './application-document.service';

describe('ApplicationDocumentService', () => {
  let service: ApplicationDocumentService;
  let mockDocumentService: DeepMocked<DocumentService>;
  let mockApplicationService: DeepMocked<ApplicationService>;
  let mockRepository: DeepMocked<Repository<ApplicationDocument>>;

  let mockApplication;
  let mockAppDocument;
  const fileNumber = '12345';

  beforeEach(async () => {
    mockDocumentService = createMock<DocumentService>();
    mockApplicationService = createMock<ApplicationService>();
    mockRepository = createMock<Repository<ApplicationDocument>>();

    mockApplication = new Application({
      fileNumber,
    });
    mockApplicationService.getOrFail.mockResolvedValue(mockApplication);
    mockDocumentService.create.mockResolvedValue('fake-uuid');

    mockAppDocument = new ApplicationDocument({
      uuid: 'document-uuid',
      alcsDocumentUuid: 'alcs-document-uuid',
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicationDocumentService,
        {
          provide: DocumentService,
          useValue: mockDocumentService,
        },
        {
          provide: ApplicationService,
          useValue: mockApplicationService,
        },
        {
          provide: getRepositoryToken(ApplicationDocument),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ApplicationDocumentService>(
      ApplicationDocumentService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a document in the happy path', async () => {
    const mockUser = {};
    const mockFile = {};

    mockRepository.save.mockResolvedValue(mockAppDocument);

    const res = await service.attachDocument(
      fileNumber,
      mockFile as MultipartFile,
      mockUser as User,
      'certificateOfTitle',
    );

    expect(mockApplicationService.getOrFail).toHaveBeenCalledTimes(1);
    expect(mockDocumentService.create).toHaveBeenCalledTimes(1);
    expect(mockDocumentService.create.mock.calls[0][0]).toBe(
      'application/12345',
    );
    expect(mockDocumentService.create.mock.calls[0][1]).toBe(mockFile);
    expect(mockDocumentService.create.mock.calls[0][2]).toBe(mockUser);

    expect(mockRepository.save).toHaveBeenCalledTimes(1);
    expect(mockRepository.save.mock.calls[0][0].application).toBe(
      mockApplication,
    );

    expect(res).toBe(mockAppDocument);
  });

  it('should delete document and application document when deleting', async () => {
    mockDocumentService.delete.mockResolvedValue();
    mockRepository.delete.mockResolvedValue({} as any);

    await service.delete(mockAppDocument);

    expect(mockDocumentService.delete).toHaveBeenCalledTimes(1);
    expect(mockDocumentService.delete.mock.calls[0][0]).toBe(
      mockAppDocument.alcsDocumentUuid,
    );

    expect(mockRepository.delete).toHaveBeenCalledTimes(1);
    expect(mockRepository.delete.mock.calls[0][0]).toBe(mockAppDocument.uuid);
  });

  it('should call through for get', async () => {
    mockRepository.findOne.mockResolvedValue(mockAppDocument);

    const res = await service.get('fake-uuid');
    expect(res).toBe(mockAppDocument);
  });

  it("should throw an exception when getting a document that doesn't exist", async () => {
    mockRepository.findOne.mockResolvedValue(null);

    await expect(service.get(mockAppDocument.uuid)).rejects.toMatchObject(
      new ServiceNotFoundException(
        `Failed to find document ${mockAppDocument.uuid}`,
      ),
    );
  });

  it('should call through for list', async () => {
    mockRepository.find.mockResolvedValue([mockAppDocument]);

    const res = await service.list(fileNumber, 'certificateOfTitle');

    expect(mockRepository.find).toHaveBeenCalledTimes(1);
    expect(res[0]).toBe(mockAppDocument);
  });

  it('should call through for listAll', async () => {
    const mockAppDocument = new ApplicationDocument();
    mockRepository.find.mockResolvedValue([mockAppDocument]);

    const res = await service.listAll([fileNumber], 'certificateOfTitle');

    expect(mockRepository.find).toHaveBeenCalledTimes(1);
    expect(res[0]).toBe(mockAppDocument);
  });

  it('should call through for download', async () => {
    const mockAppDocument = new ApplicationDocument();

    const fakeUrl = 'mock-url';
    mockDocumentService.getDownloadUrl.mockResolvedValue(fakeUrl);

    const res = await service.getInlineUrl(mockAppDocument);

    expect(mockDocumentService.getDownloadUrl).toHaveBeenCalledTimes(1);
    expect(res).toEqual(fakeUrl);
  });
});
