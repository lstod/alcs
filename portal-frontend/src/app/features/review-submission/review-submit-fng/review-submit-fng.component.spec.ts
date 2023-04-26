import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { BehaviorSubject } from 'rxjs';
import { ApplicationDocumentDto } from '../../../services/application-document/application-document.dto';
import { ApplicationDocumentService } from '../../../services/application-document/application-document.service';
import { ApplicationSubmissionReviewDto } from '../../../services/application-submission-review/application-submission-review.dto';
import { ApplicationSubmissionReviewService } from '../../../services/application-submission-review/application-submission-review.service';
import { ApplicationSubmissionDto } from '../../../services/application-submission/application-submission.dto';
import { ApplicationSubmissionService } from '../../../services/application-submission/application-submission.service';
import { PdfGenerationService } from '../../../services/pdf-generation/pdf-generation.service';

import { ReviewSubmitFngComponent } from './review-submit-fng.component';

describe('ReviewSubmitFngComponent', () => {
  let component: ReviewSubmitFngComponent;
  let fixture: ComponentFixture<ReviewSubmitFngComponent>;
  let mockAppReviewService: DeepMocked<ApplicationSubmissionReviewService>;
  let mockAppSubmissionService: DeepMocked<ApplicationSubmissionService>;
  let mockAppDocumentService: DeepMocked<ApplicationDocumentService>;
  let mockPdfGenerationService: DeepMocked<PdfGenerationService>;

  let applicationPipe = new BehaviorSubject<ApplicationSubmissionDto | undefined>(undefined);
  let applicationDocumentPipe = new BehaviorSubject<ApplicationDocumentDto[]>([]);

  beforeEach(async () => {
    mockAppReviewService = createMock();
    mockAppReviewService.$applicationReview = new BehaviorSubject<ApplicationSubmissionReviewDto | undefined>(
      undefined
    );
    mockAppDocumentService = createMock();
    mockPdfGenerationService = createMock();
    mockAppSubmissionService = createMock();

    await TestBed.configureTestingModule({
      providers: [
        {
          provide: ApplicationSubmissionReviewService,
          useValue: mockAppReviewService,
        },
        {
          provide: ApplicationSubmissionService,
          useValue: mockAppSubmissionService,
        },
        {
          provide: ApplicationDocumentService,
          useValue: mockAppDocumentService,
        },
        {
          provide: PdfGenerationService,
          useValue: mockPdfGenerationService,
        },
      ],
      declarations: [ReviewSubmitFngComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ReviewSubmitFngComponent);
    component = fixture.componentInstance;

    component.$application = applicationPipe;
    component.$applicationDocuments = applicationDocumentPipe;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
