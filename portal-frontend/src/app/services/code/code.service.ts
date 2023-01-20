import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApplicationTypeDto, LocalGovernmentDto, SubmissionTypeDto } from './code.dto';

@Injectable({
  providedIn: 'root',
})
export class CodeService {
  private baseUrl = `${environment.apiUrl}/code`;

  constructor(private httpClient: HttpClient) {}

  loadCodes() {
    return firstValueFrom(
      this.httpClient.get<{
        localGovernments: LocalGovernmentDto[];
        applicationTypes: ApplicationTypeDto[];
        submissionTypes: SubmissionTypeDto[];
      }>(`${this.baseUrl}`)
    );
  }
}