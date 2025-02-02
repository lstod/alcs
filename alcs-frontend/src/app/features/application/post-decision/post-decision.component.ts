import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subject, combineLatestWith, takeUntil, tap } from 'rxjs';
import { ApplicationDetailService } from '../../../services/application/application-detail.service';
import { ApplicationModificationDto } from '../../../services/application/application-modification/application-modification.dto';
import { ApplicationModificationService } from '../../../services/application/application-modification/application-modification.service';
import { ApplicationReconsiderationDetailedDto } from '../../../services/application/application-reconsideration/application-reconsideration.dto';
import { ApplicationReconsiderationService } from '../../../services/application/application-reconsideration/application-reconsideration.service';
import { ToastService } from '../../../services/toast/toast.service';
import { ConfirmationDialogService } from '../../../shared/confirmation-dialog/confirmation-dialog.service';
import { BaseCodeDto } from '../../../shared/dto/base.dto';
import { formatDateForApi } from '../../../shared/utils/api-date-formatter';
import { EditModificationDialogComponent } from './edit-modification-dialog/edit-modification-dialog.component';
import { EditReconsiderationDialogComponent } from './edit-reconsideration-dialog/edit-reconsideration-dialog.component';

type LoadingReconsiderations = ApplicationReconsiderationDetailedDto & {
  reconsidersDecisionsNumbers: string[];
};

type LoadingModifications = ApplicationModificationDto & {
  modifiesDecisionsNumbers: string[];
};
@Component({
  selector: 'app-post-decision',
  templateUrl: './post-decision.component.html',
  styleUrls: ['./post-decision.component.scss'],
})
export class PostDecisionComponent implements OnInit, OnDestroy {
  $destroy = new Subject<void>();
  fileNumber: string = '';
  reconsiderations: LoadingReconsiderations[] = [];
  modifications: LoadingModifications[] = [];
  reconCodes: BaseCodeDto[] = [];

  constructor(
    public dialog: MatDialog,
    private applicationDetailService: ApplicationDetailService,
    private applicationReconsiderationService: ApplicationReconsiderationService,
    private modificationService: ApplicationModificationService,
    private toastService: ToastService,
    private confirmationDialogService: ConfirmationDialogService
  ) {}

  ngOnInit(): void {
    this.applicationDetailService.$application
      .pipe(
        tap(() => {
          this.applicationReconsiderationService.fetchCodes();
        })
      )
      .pipe(
        combineLatestWith(
          this.applicationReconsiderationService.$reconsiderations,
          this.applicationReconsiderationService.$codes,
          this.modificationService.$modifications
        )
      )
      .pipe(takeUntil(this.$destroy))
      .subscribe(([application, reconsiderations, reconCodes, modifications]) => {
        if (application) {
          this.fileNumber = application.fileNumber;
          this.reconsiderations =
            reconsiderations?.map((r) => ({
              ...r,
              reconsidersDecisionsNumbers: r.reconsideredDecisions.flatMap(
                (d) => `#${d.resolutionNumber}/${d.resolutionYear}`
              ),
            })) ?? [];
          this.reconCodes = reconCodes;
          this.modifications =
            modifications?.map((m) => ({
              ...m,
              modifiesDecisionsNumbers: m.modifiesDecisions.flatMap(
                (d) => `#${d.resolutionNumber}/${d.resolutionYear}`
              ),
            })) ?? [];
        }
      });
  }

  onEditReconsideration(reconsideration: ApplicationReconsiderationDetailedDto) {
    this.dialog
      .open(EditReconsiderationDialogComponent, {
        minWidth: '600px',
        maxWidth: '900px',
        maxHeight: '80vh',
        width: '90%',
        autoFocus: false,
        data: {
          fileNumber: this.fileNumber,
          existingDecision: reconsideration,
          codes: this.reconCodes,
        },
      })
      .afterClosed()
      .subscribe((wasModified) => {
        if (wasModified) {
          this.applicationDetailService.loadApplication(this.fileNumber);
        }
      });
  }

  onEditModification(modification: ApplicationModificationDto) {
    this.dialog
      .open(EditModificationDialogComponent, {
        minWidth: '600px',
        maxWidth: '900px',
        maxHeight: '80vh',
        width: '90%',
        autoFocus: false,
        data: {
          fileNumber: this.fileNumber,
          existingModification: modification,
        },
      })
      .afterClosed()
      .subscribe((wasModified) => {
        if (wasModified) {
          this.applicationDetailService.loadApplication(this.fileNumber);
        }
      });
  }

  async deleteReconsideration(uuid: string, reconsiderationIndex: number) {
    this.confirmationDialogService
      .openDialog({
        body: `Are you sure you want to delete Reconsideration Request #${reconsiderationIndex}?`,
      })
      .subscribe(async (answer) => {
        if (answer) {
          await this.applicationReconsiderationService.delete(uuid);
          await this.applicationReconsiderationService.fetchByApplication(this.fileNumber);
          this.toastService.showSuccessToast('Reconsideration request deleted');
        }
      });
  }

  async deleteModification(uuid: string, index: number) {
    this.confirmationDialogService
      .openDialog({
        body: `Are you sure you want to delete Modification Request #${index}?`,
      })
      .subscribe(async (answer) => {
        if (answer) {
          await this.modificationService.delete(uuid);
          await this.modificationService.fetchByApplication(this.fileNumber);
        }
      });
  }

  async onSaveReconsiderationReviewDate(reconsiderationUuid: string, reviewDate: number) {
    await this.applicationReconsiderationService.update(reconsiderationUuid, {
      reviewDate: formatDateForApi(reviewDate),
    });
    await this.applicationReconsiderationService.fetchByApplication(this.fileNumber);
  }

  async onSaveReconsiderationReviewOutcome(reconsiderationUuid: string, reviewOutcomeCode: string) {
    await this.applicationReconsiderationService.update(reconsiderationUuid, {
      reviewOutcomeCode,
    });
    await this.applicationReconsiderationService.fetchByApplication(this.fileNumber);
  }

  async onSaveModificationReviewDate(uuid: string, reviewDate: number) {
    await this.modificationService.update(uuid, {
      reviewDate: formatDateForApi(reviewDate),
    });
    await this.modificationService.fetchByApplication(this.fileNumber);
  }

  async onSaveModificationOutcome(uuid: string, reviewOutcomeCode: string) {
    await this.modificationService.update(uuid, {
      reviewOutcomeCode,
    });
    await this.modificationService.fetchByApplication(this.fileNumber);
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  goToRecons() {
    const el = document.getElementById('recons');
    if (el) {
      el.scrollIntoView();
    }
  }

  goToModifications() {
    const el = document.getElementById('modifications');
    if (el) {
      el.scrollIntoView();
    }
  }
}
