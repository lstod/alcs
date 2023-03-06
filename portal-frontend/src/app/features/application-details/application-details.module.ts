import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { NgxMaskPipe } from 'ngx-mask';
import { SharedModule } from '../../shared/shared.module';
import { ApplicationDetailsComponent } from './application-details.component';
import { NfuDetailsComponent } from './nfu-details/nfu-details.component';
import { ParcelComponent } from './parcel/parcel.component';

@NgModule({
  declarations: [ParcelComponent, ApplicationDetailsComponent, NfuDetailsComponent],
  imports: [CommonModule, SharedModule, NgxMaskPipe],
  exports: [ApplicationDetailsComponent],
})
export class ApplicationDetailsModule {}
