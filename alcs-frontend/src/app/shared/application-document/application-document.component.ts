import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ApplicationDocumentDto } from '../../services/application/application-document/application-document.dto';
import {
  ApplicationDocumentService,
  DOCUMENT_TYPE,
} from '../../services/application/application-document/application-document.service';
import { ConfirmationDialogService } from '../confirmation-dialog/confirmation-dialog.service';

@Component({
  selector: 'app-document[title][documentType][fileNumber]',
  templateUrl: './application-document.component.html',
  styleUrls: ['./application-document.component.scss'],
})
export class ApplicationDocumentComponent implements OnChanges {
  @Input() documentType: DOCUMENT_TYPE = DOCUMENT_TYPE.DECISION_DOCUMENT;
  @Input() title = '';
  @Input() readOnly = false;
  @Input() fileNumber: string = '';

  isUploading = false;

  displayedColumns: string[] = ['fileName', 'uploadedAt', 'uploadedBy', 'action'];
  documents: ApplicationDocumentDto[] = [];

  constructor(
    private applicationDocumentService: ApplicationDocumentService,
    private confirmationDialogService: ConfirmationDialogService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    this.loadDocuments();
  }

  async loadDocuments() {
    if (this.fileNumber) {
      this.documents = await this.applicationDocumentService.list(this.fileNumber, this.documentType);
    }
  }

  async onDelete(uuid: string, fileName: string) {
    this.confirmationDialogService
      .openDialog({
        body: `Are you sure you want to delete ${fileName}?`,
      })
      .subscribe(async (answer) => {
        if (answer) {
          await this.applicationDocumentService.delete(uuid);
          await this.loadDocuments();
        }
      });
  }

  async onDownload(uuid: string, fileName: string) {
    await this.applicationDocumentService.download(uuid, fileName, false);
  }

  async onOpen(uuid: string, fileName: string) {
    await this.applicationDocumentService.download(uuid, fileName);
  }

  async uploadFile(event: Event) {
    const element = event.target as HTMLInputElement;
    const fileList = element.files;
    if (fileList && fileList.length > 0) {
      const file: File = fileList[0];
      this.isUploading = true;
      const uploadedFile = await this.applicationDocumentService.upload(this.fileNumber, this.documentType, file);
      if (uploadedFile) {
        await this.loadDocuments();
      }
      this.isUploading = false;
    }
  }
}
