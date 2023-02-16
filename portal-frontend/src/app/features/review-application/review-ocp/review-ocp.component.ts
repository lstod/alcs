import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatButtonToggleChange } from '@angular/material/button-toggle';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ApplicationReviewService } from '../../../services/application-review/application-review.service';

@Component({
  selector: 'app-review-ocp',
  templateUrl: './review-ocp.component.html',
  styleUrls: ['./review-ocp.component.scss'],
})
export class ReviewOcpComponent implements OnInit, OnDestroy {
  $destroy = new Subject<void>();

  isOCPDesignation = new FormControl<string | null>(null);
  OCPBylawName = new FormControl<string | null>('');
  OCPDesignation = new FormControl<string | null>('');
  isOCPConsistent = new FormControl<string | null>(null);

  ocpForm = new FormGroup({
    isOCPDesignation: this.isOCPDesignation,
    OCPBylawName: this.OCPBylawName,
    OCPDesignation: this.OCPDesignation,
    isOCPConsistent: this.isOCPConsistent,
  });
  private fileId: string | undefined;

  constructor(private applicationReviewService: ApplicationReviewService, private router: Router) {}

  ngOnInit(): void {
    this.applicationReviewService.$applicationReview.pipe(takeUntil(this.$destroy)).subscribe((applicationReview) => {
      if (applicationReview) {
        this.fileId = applicationReview.applicationFileNumber;

        if (!applicationReview.isOCPDesignation) {
          this.isOCPDesignation.setValue(applicationReview.isOCPDesignation === null ? null : 'false');
          this.OCPBylawName.disable();
          this.OCPDesignation.disable();
          this.isOCPConsistent.disable();
        } else {
          this.isOCPDesignation.setValue('true');
          this.OCPBylawName.setValue(applicationReview.OCPBylawName);
          this.OCPDesignation.setValue(applicationReview.OCPDesignation);
          if (applicationReview.OCPConsistent !== null) {
            this.isOCPConsistent.setValue(applicationReview.OCPConsistent ? 'true' : 'false');
          }
        }
      }
    });
  }

  async onSave() {
    await this.saveProgress();
  }

  async onSaveExit() {
    if (this.fileId) {
      await this.saveProgress();
      await this.router.navigateByUrl(`/application/${this.fileId}`);
    }
  }

  private async saveProgress() {
    if (this.fileId) {
      const ocpDesignation = this.isOCPDesignation.getRawValue();
      let ocpDesignationResult = null;
      if (ocpDesignation !== null) {
        ocpDesignationResult = ocpDesignation === 'true';
      }

      const ocpConsistent = this.isOCPConsistent.getRawValue();
      let ocpConsistentResult = null;
      if (ocpConsistent !== null) {
        ocpConsistentResult = ocpConsistent === 'true';
      }

      await this.applicationReviewService.update(this.fileId, {
        isOCPDesignation: ocpDesignationResult,
        OCPBylawName: this.OCPBylawName.getRawValue(),
        OCPDesignation: this.OCPDesignation.getRawValue(),
        OCPConsistent: ocpConsistentResult,
      });
    }
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  onChangeDesignation($event: MatButtonToggleChange) {
    if ($event.value === 'true') {
      this.OCPBylawName.enable();
      this.OCPDesignation.enable();
      this.isOCPConsistent.enable();
    } else {
      this.OCPBylawName.setValue(null);
      this.OCPDesignation.setValue(null);
      this.isOCPConsistent.setValue(null);
      this.OCPBylawName.disable();
      this.OCPDesignation.disable();
      this.isOCPConsistent.disable();
    }
  }
}