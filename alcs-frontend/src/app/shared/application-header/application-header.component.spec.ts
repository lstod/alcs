import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ApplicationDocumentService } from '../../services/application/application-document/application-document.service';
import { ConfirmationDialogService } from '../confirmation-dialog/confirmation-dialog.service';

import { ApplicationHeaderComponent } from './application-header.component';

describe('ApplicationHeaderComponent', () => {
  let component: ApplicationHeaderComponent;
  let fixture: ComponentFixture<ApplicationHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [ApplicationHeaderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
