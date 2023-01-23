import { BaseServiceException } from '@app/common/exceptions/base.exception';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { firstValueFrom } from 'rxjs';
import { Repository } from 'typeorm';
import { Document } from '../../../document/document.entity';
import { DocumentService } from '../../../document/document.service';
import { User } from '../../../user/user.entity';
import { ApplicationParcelService } from '../application-parcel.service';
import {
  ApplicationParcelDocument,
  DOCUMENT_TYPE,
} from './application-parcel-document.entity';

@Injectable()
export class ApplicationParcelDocumentService {
  constructor(
    private documentService: DocumentService,
    private applicationParcelService: ApplicationParcelService,
    @InjectRepository(ApplicationParcelDocument)
    private applicationParcelDocumentRepository: Repository<ApplicationParcelDocument>,
  ) {}

  async get(uuid: string) {
    const parcelDocument =
      await this.applicationParcelDocumentRepository.findOne({
        where: {
          uuid: uuid,
        },
        relations: {
          document: true,
        },
      });
    if (!parcelDocument) {
      throw new NotFoundException(`Failed to find document ${uuid}`);
    }
    return parcelDocument;
  }

  async delete(applicationParcelDocument: ApplicationParcelDocument) {
    if (!applicationParcelDocument.document) {
      throw new BaseServiceException(
        'Failed to delete ApplicationParcelDocument, passed ApplicationParcelDocument without Document',
      );
    }

    return this.documentService.delete(applicationParcelDocument.document);
  }

  async list(applicationParcelUuid: string, documentType: DOCUMENT_TYPE) {
    return this.applicationParcelDocumentRepository.find({
      where: {
        type: documentType,
        applicationParcel: {
          uuid: applicationParcelUuid,
        },
      },
      relations: {
        document: true,
      },
    });
  }

  getInlineUrl(applicationParcelDocument: ApplicationParcelDocument) {
    return firstValueFrom(
      this.documentService.getDownloadUrl(
        applicationParcelDocument.document.alcsDocumentUuid,
      ),
    );
  }

  async createRecord(
    fileName: string,
    fileSize: number,
    applicationParcelUuid: string,
    alcsDocumentUuid: string,
    documentType: DOCUMENT_TYPE,
    user: User,
  ) {
    const applicationParcel = await this.applicationParcelService.getOneOrFail(
      applicationParcelUuid,
    );

    const document = new Document({
      fileName,
      fileSize,
      alcsDocumentUuid,
      uploadedBy: user,
    });

    return this.applicationParcelDocumentRepository.save(
      new ApplicationParcelDocument({
        document,
        type: documentType,
        applicationParcel,
      }),
    );
  }
}