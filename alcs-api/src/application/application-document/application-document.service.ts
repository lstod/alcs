import { MultipartFile } from '@fastify/multipart';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsRelations, Repository } from 'typeorm';
import { ServiceNotFoundException } from '../../common/exceptions/base.exception';
import { DocumentService } from '../../document/document.service';
import { User } from '../../user/user.entity';
import { ApplicationService } from '../application.service';
import { ApplicationDocument } from './application-document.entity';

@Injectable()
export class ApplicationDocumentService {
  private DEFAULT_RELATIONS: FindOptionsRelations<ApplicationDocument> = {
    document: true,
  };

  constructor(
    private documentService: DocumentService,
    private applicationService: ApplicationService,
    @InjectRepository(ApplicationDocument)
    private applicationDocumentRepository: Repository<ApplicationDocument>,
  ) {}

  async attachDocument(fileNumber: string, file: MultipartFile, user: User) {
    const application = await this.applicationService.get(fileNumber);
    if (!application) {
      throw new ServiceNotFoundException(`File Number not Found ${fileNumber}`);
    }

    const document = await this.documentService.create(file, user);
    const appDocument = new ApplicationDocument({
      type: 'decisionDocument',
      application,
      document,
    });

    return this.applicationDocumentRepository.save(appDocument);
  }

  async get(uuid: string) {
    const document = await this.applicationDocumentRepository.findOne({
      where: {
        uuid: uuid,
      },
      relations: this.DEFAULT_RELATIONS,
    });
    if (!document) {
      throw new NotFoundException(`Failed to find document ${uuid}`);
    }
    return document;
  }

  async delete(document: ApplicationDocument) {
    await this.applicationDocumentRepository.delete(document.uuid);
    await this.documentService.delete(document.document);
    return document;
  }

  async list(fileNumber: string) {
    return this.applicationDocumentRepository.find({
      where: {
        application: {
          fileNumber,
        },
      },
      relations: this.DEFAULT_RELATIONS,
    });
  }

  async getDownloadUrl(document: ApplicationDocument) {
    return this.documentService.getUrl(document.document);
  }
}