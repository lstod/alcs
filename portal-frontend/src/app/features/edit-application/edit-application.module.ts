import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NgxMaskDirective, NgxMaskPipe } from 'ngx-mask';
import { SharedModule } from '../../shared/shared.module';
import { NfuProposalComponent } from './nfu/nfu-proposal/nfu-proposal.component';
import { ApplicationOwnerDialogComponent } from './parcel-details/application-owner-dialog/application-owner-dialog.component';
import { ApplicationOwnersDialogComponent } from './parcel-details/application-owners-dialog/application-owners-dialog.component';
import { ChangeApplicationTypeDialogComponent } from './change-application-type-dialog/change-application-type-dialog.component';
import { EditApplicationComponent } from './edit-application.component';
import { DeleteParcelDialogComponent } from './parcel-details/delete-parcel/delete-parcel-dialog.component';
import { ParcelDetailsComponent } from './parcel-details/parcel-details.component';
import { ParcelEntryComponent } from './parcel-details/parcel-entry/parcel-entry.component';
import { ParcelOwnersComponent } from './parcel-details/parcel-owners/parcel-owners.component';
import { SelectGovernmentComponent } from './select-government/select-government.component';
import { LandUseComponent } from './land-use/land-use.component';

const routes: Routes = [
  {
    path: '',
    component: EditApplicationComponent,
  },
];

@NgModule({
  declarations: [
    ParcelDetailsComponent,
    ParcelEntryComponent,
    ChangeApplicationTypeDialogComponent,
    EditApplicationComponent,
    DeleteParcelDialogComponent,
    SelectGovernmentComponent,
    ParcelOwnersComponent,
    ApplicationOwnersDialogComponent,
    ApplicationOwnerDialogComponent,
    LandUseComponent,
    NfuProposalComponent,
  ],
  imports: [CommonModule, SharedModule, RouterModule.forChild(routes), NgxMaskDirective, NgxMaskPipe],
})
export class EditApplicationModule {}