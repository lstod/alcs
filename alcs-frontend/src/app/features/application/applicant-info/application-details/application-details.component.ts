import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { doc } from 'prettier';
import { Subject } from 'rxjs';
import { ApplicationDocumentDto } from '../../../../services/application/application-document/application-document.dto';
import {
  ApplicationDocumentService,
  DOCUMENT_TYPE,
} from '../../../../services/application/application-document/application-document.service';
import { ApplicationDto, SubmittedApplicationDto } from '../../../../services/application/application.dto';

@Component({
  selector: 'app-application-details[application]',
  templateUrl: './application-details.component.html',
  styleUrls: ['./application-details.component.scss'],
})
export class ApplicationDetailsComponent implements OnInit, OnDestroy {
  $destroy = new Subject<void>();

  @Input() application!: ApplicationDto;

  submittedApplication!: SubmittedApplicationDto | undefined;
  authorizationLetters: ApplicationDocumentDto[] = [];
  otherFiles: ApplicationDocumentDto[] = [];
  files: ApplicationDocumentDto[] | undefined;

  constructor(private applicationDocumentService: ApplicationDocumentService) {}

  ngOnInit(): void {
    this.submittedApplication = this.application.submittedApplication!;
    this.loadDocuments(this.application.fileNumber);
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  async openFile(uuid: string) {
    await this.applicationDocumentService.download(uuid, '');
  }

  private async loadDocuments(fileNumber: string) {
    const documents = await this.applicationDocumentService.getApplicantDocuments(fileNumber);
    this.otherFiles = documents.filter((document) =>
      [DOCUMENT_TYPE.PHOTOGRAPH, DOCUMENT_TYPE.OTHER, DOCUMENT_TYPE.PROFESSIONAL_REPORT].includes(document.type)
    );
    this.authorizationLetters = documents.filter((document) => document.type === DOCUMENT_TYPE.AUTHORIZATION_LETTER);
    this.files = documents;
  }
}