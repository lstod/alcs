import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ToastService } from '../../toast/toast.service';
import { ApplicationDocumentService } from './application-document.service';

describe('ApplicationDocumentService', () => {
  let service: ApplicationDocumentService;
  let httpClient: DeepMocked<HttpClient>;
  let toastService: DeepMocked<ToastService>;

  beforeEach(() => {
    httpClient = createMock();
    toastService = createMock();

    TestBed.configureTestingModule({
      providers: [
        {
          provide: HttpClient,
          useValue: httpClient,
        },
        {
          provide: ToastService,
          useValue: toastService,
        },
      ],
    });
    service = TestBed.inject(ApplicationDocumentService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should make a get call for list', async () => {
    httpClient.get.mockReturnValue(
      of([
        {
          uuid: '1',
        },
      ])
    );

    const res = await service.list('1', 'decisionDocument');

    expect(httpClient.get).toHaveBeenCalledTimes(1);
    expect(res.length).toEqual(1);
    expect(res[0].uuid).toEqual('1');
  });

  it('should make a delete call for delete', async () => {
    httpClient.delete.mockReturnValue(
      of({
        uuid: '1',
      })
    );

    const res = await service.delete('1');

    expect(httpClient.delete).toHaveBeenCalledTimes(1);
    expect(res).toBeDefined();
    expect(res.uuid).toEqual('1');
  });

  it('should show a toast warning when uploading a file thats too large', async () => {
    const file = createMock<File>();
    Object.defineProperty(file, 'size', { value: environment.maxFileSize + 1 });

    await service.upload('', 'decisionDocument', file);

    expect(toastService.showWarningToast).toHaveBeenCalledTimes(1);
    expect(httpClient.post).toHaveBeenCalledTimes(0);
  });
});
