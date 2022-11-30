import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ApplicationModificationService } from '../../../../services/application/application-modification/application-modification.service';
import { ApplicationDecisionService } from '../../../../services/application/application-decision/application-decision.service';
import { ToastService } from '../../../../services/toast/toast.service';

import { EditModificationDialogComponent } from './edit-modification-dialog.component';

describe('EditModificationDialogComponent', () => {
  let component: EditModificationDialogComponent;
  let fixture: ComponentFixture<EditModificationDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EditModificationDialogComponent],
      providers: [
        {
          provide: ApplicationModificationService,
          useValue: {},
        },
        {
          provide: ApplicationDecisionService,
          useValue: {},
        },
        {
          provide: ToastService,
          useValue: {},
        },
        {
          provide: MAT_DIALOG_DATA,
          useValue: { existingModification: { submittedDate: 121231, modifiesDecisions: [] } },
        },
        { provide: MatDialogRef, useValue: {} },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditModificationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});