import { CdkDrag, CdkDropList } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ModuleWithProviders, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { DateAdapter, MatNativeDateModule, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MtxButtonModule } from '@ng-matero/extensions/button';
import { DatetimeAdapter } from '@ng-matero/extensions/core';
import { NgOptionHighlightModule } from '@ng-select/ng-option-highlight';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxMaskDirective, NgxMaskPipe } from 'ngx-mask';
import { ApplicationDocumentComponent } from './application-document/application-document.component';
import { ApplicationHeaderComponent } from './application-header/application-header.component';
import { ApplicationTimeTrackerComponent } from './application-time-tracker/application-time-tracker.component';
import { ApplicationTypePillComponent } from './application-type-pill/application-type-pill.component';
import { AvatarCircleComponent } from './avatar-circle/avatar-circle.component';
import { FavoriteButtonComponent } from './favorite-button/favorite-button.component';
import { InlineBooleanComponent } from './inline-boolean/inline-boolean.component';
import { InlineDropdownComponent } from './inline-dropdown/inline-dropdown.component';
import { InlineNumberComponent } from './inline-number/inline-number.component';
import { InlineTextComponent } from './inline-text/inline-text.component';
import { InlineTextareaComponent } from './inline-textarea/inline-textarea.component';
import { MeetingOverviewComponent } from './meeting-overview/meeting-overview.component';
import { FileSizePipe } from './pipes/fileSize.pipe';
import { MomentPipe } from './pipes/moment.pipe';
import { SafePipe } from './pipes/safe.pipe';
import { StartOfDayPipe } from './pipes/startOfDay.pipe';
import { DATE_FORMATS } from './utils/date-format';
import { ExtensionsDatepickerFormatter } from './utils/extensions-datepicker-formatter';

@NgModule({
  declarations: [
    FavoriteButtonComponent,
    AvatarCircleComponent,
    MomentPipe,
    StartOfDayPipe,
    MeetingOverviewComponent,
    InlineTextareaComponent,
    InlineBooleanComponent,
    InlineNumberComponent,
    InlineTextComponent,
    InlineDropdownComponent,
    ApplicationHeaderComponent,
    ApplicationDocumentComponent,
    ApplicationTimeTrackerComponent,
    ApplicationTypePillComponent,
    SafePipe,
    FileSizePipe,
  ],
  imports: [
    CommonModule,
    MatIconModule,
    MatExpansionModule,
    MatButtonModule,
    MatInputModule,
    FormsModule,
    ReactiveFormsModule,
    MatTooltipModule,
    MatCardModule,
    MatMenuModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatButtonToggleModule,
    MatSelectModule,
    NgxMaskDirective,
    NgxMaskPipe,
    CdkDropList,
    CdkDrag,
  ],
  exports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    NgSelectModule,
    NgOptionHighlightModule,
    MatButtonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatDialogModule,
    MatCardModule,
    MatDividerModule,
    MatInputModule,
    MatIconModule,
    MatSnackBarModule,
    MatToolbarModule,
    MatMenuModule,
    MatTableModule,
    MatNativeDateModule,
    MatDatepickerModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    MomentPipe,
    MatExpansionModule,
    MtxButtonModule,
    StartOfDayPipe,
    MatTooltipModule,
    InlineTextareaComponent,
    InlineBooleanComponent,
    InlineNumberComponent,
    InlineTextComponent,
    InlineDropdownComponent,
    MatAutocompleteModule,
    MatButtonToggleModule,
    ApplicationHeaderComponent,
    ApplicationDocumentComponent,
    MeetingOverviewComponent,
    FavoriteButtonComponent,
    AvatarCircleComponent,
    MatSelectModule,
    ApplicationTimeTrackerComponent,
    ApplicationTypePillComponent,
    SafePipe,
    FileSizePipe,
    NgxMaskDirective,
    NgxMaskPipe,
  ],
})
export class SharedModule {
  static forRoot(): ModuleWithProviders<SharedModule> {
    return {
      ngModule: SharedModule,
      providers: [
        { provide: DatetimeAdapter, useClass: ExtensionsDatepickerFormatter, deps: [MAT_DATE_LOCALE, DateAdapter] },
        { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
        { provide: MAT_DATE_FORMATS, useValue: DATE_FORMATS },
      ],
    };
  }
}
