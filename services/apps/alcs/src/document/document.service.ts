import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { MultipartFile } from '@fastify/multipart';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 } from 'uuid';
import { CONFIG_TOKEN, IConfig } from '../common/config/config.module';
import { User } from '../user/user.entity';
import { Document } from './document.entity';

@Injectable()
export class DocumentService {
  private dataStore: S3Client;
  private logger = new Logger(DocumentService.name);
  private bucket = <string>this.config.get('STORAGE.BUCKET');

  constructor(
    @Inject(CONFIG_TOKEN) private config: IConfig,
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
  ) {
    this.dataStore = new S3Client({
      region: 'us-east-1',
      credentials: {
        accessKeyId: this.config.get('STORAGE.ACCESS_KEY'),
        secretAccessKey: this.config.get('STORAGE.SECRET_KEY'),
      },
      forcePathStyle: true,
      endpoint: this.config.get('STORAGE.URL'),
    });
  }

  async create(filePath: string, file: MultipartFile, user: User) {
    const fileKey = `${filePath}/${v4()}`;
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: fileKey,
      Body: await file.toBuffer(),
      ACL: 'bucket-owner-full-control',
      ContentType: file.mimetype,
      ContentLength: file.file.bytesRead,
    });
    await this.dataStore.send(command);
    const document = await this.documentRepository.save(
      new Document({
        fileKey,
        mimeType: file.mimetype,
        uploadedBy: user,
        fileName: file.filename,
      }),
    );
    this.logger.debug(`File Uploaded to ${fileKey}`);
    return document;
  }

  async softRemove(document: Document) {
    await this.documentRepository.softRemove(document);
  }

  getDownloadUrl(document: Document, openInline = false) {
    const command = new GetObjectCommand({
      Bucket: this.config.get('STORAGE.BUCKET'),
      Key: document.fileKey,
      ResponseContentDisposition: `${
        openInline ? 'inline' : 'attachment'
      }; filename="${document.fileName}"`,
    });
    return getSignedUrl(this.dataStore, command, {
      expiresIn: 60,
    });
  }
}