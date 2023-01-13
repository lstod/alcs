import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ApplicationReviewService } from '../../../services/application-review/application-review.service';
import { ToastService } from '../../../services/toast/toast.service';

@Component({
  selector: 'app-review-contact-information',
  templateUrl: './review-contact-information.component.html',
  styleUrls: ['./review-contact-information.component.scss'],
})
export class ReviewContactInformationComponent implements OnInit, OnDestroy {
  $destroy = new Subject<void>();

  lgFileNumber = new FormControl<string | null>('');
  firstName = new FormControl<string | null>('');
  lastName = new FormControl<string | null>('');
  position = new FormControl<string | null>('');
  department = new FormControl<string | null>('');
  phoneNumber = new FormControl<string | null>('');
  email = new FormControl<string | null>('');

  contactForm = new FormGroup({
    lgFileNumber: this.lgFileNumber,
    firstName: this.firstName,
    lastName: this.lastName,
    position: this.position,
    department: this.department,
    phoneNumber: this.phoneNumber,
    email: this.email,
  });
  private fileId: string | undefined;

  constructor(private applicationReviewService: ApplicationReviewService, private router: Router) {}

  ngOnInit(): void {
    this.applicationReviewService.$applicationReview.pipe(takeUntil(this.$destroy)).subscribe((applicationReview) => {
      if (applicationReview) {
        this.fileId = applicationReview.applicationFileNumber;

        this.lgFileNumber.setValue(applicationReview.localGovernmentFileNumber);
        this.firstName.setValue(applicationReview.firstName);
        this.lastName.setValue(applicationReview.lastName);
        this.position.setValue(applicationReview.position);
        this.department.setValue(applicationReview.department);
        this.phoneNumber.setValue(applicationReview.phoneNumber);
        this.email.setValue(applicationReview.email);
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
      await this.applicationReviewService.update(this.fileId, {
        localGovernmentFileNumber: this.lgFileNumber.getRawValue(),
        firstName: this.firstName.getRawValue(),
        lastName: this.lastName.getRawValue(),
        position: this.position.getRawValue(),
        department: this.department.getRawValue(),
        phoneNumber: this.phoneNumber.getRawValue(),
        email: this.email.getRawValue(),
      });
    }
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }
}