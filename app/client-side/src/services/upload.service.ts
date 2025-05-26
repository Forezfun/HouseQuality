import { Injectable } from '@angular/core';
import Uppy from '@uppy/core';
import XHRUpload from '@uppy/xhr-upload';
import { BehaviorSubject } from 'rxjs';
import { baseUrl } from '.';
import { FurnitureCardControlService } from './furniture-card-control.service';
import { ServerImageControlService } from './server-image-control.service';
import { AccountCookieService } from './account-cookie.service';
import { NotificationService } from './notification.service';
import { UploadOverlayComponent } from '../components/upload-overlay/upload-overlay.component';

type uploadStatus = 'uploading' | 'success' | 'error';
export type uploadType = 'create' | 'update';
export interface UploadEntry {
  id: string;
  name: string;
  progress: number;
  status: uploadStatus;
}
interface MyXhrUploadOptions {
  endpoint: string;
  fieldName?: string;
  formData?: boolean;
  getResponseError?: (responseText: string, response: Response) => Error | null;
}

@Injectable({ providedIn: 'root' })
export class UploadService {
  private uppy: Uppy;
  public uploads$ = new BehaviorSubject<UploadEntry[]>([]);
  private baseServiceUrl = baseUrl + 'furniture/model';

  constructor(
    private furnitureCardService: FurnitureCardControlService,
    private serverImageControl: ServerImageControlService,
    private accountCookieService: AccountCookieService,
    private notification: NotificationService
  ) {
    this.uppy = new Uppy({ autoProceed: true });

    this.uppy.use(XHRUpload, {
      endpoint: this.baseServiceUrl,
      fieldName: 'file',
      formData: true,
      getResponseError: (responseText, response) => {
        return new Error(`Ошибка: ${response.statusText}`);
      }
    } as MyXhrUploadOptions);

    this.uppy.on('upload-progress', (file, progress) => {
      if (file === undefined || file.meta.name === undefined) return;
      const NAME = file.data instanceof File ? file.data.name : 'file';
      this.updateUpload(file.id, NAME, file.progress.percentage ?? 50, 'uploading');
    });

    this.uppy.on('upload-success', (file) => {
      if (file === undefined || file.meta.name === undefined) return;

      const NAME = file.data instanceof File ? file.data.name : 'file'
      this.updateUpload(file.id, NAME, 100, 'success');
      this.notification.setSuccess('Модель обновлена', 2500);
    });

    this.uppy.on('upload-error', (file, error) => {
      if (file === undefined || file.meta.name === undefined) return;

      const NAME = file.data instanceof File ? file.data.name : 'file'
      this.updateUpload(file.id, NAME, 100, 'error');
      this.cancelUpload(file.id);
    });
  }

  addFile(file: File, jwt: string, furnitureCardId: string, uploadType: uploadType) {
    const UNIQUE_ID = Date.now().toString();
    this.uppy.addFile({
      name: UNIQUE_ID + this.getFileExtension(file.name),
      type: file.type,
      data: file,
      meta: {
        furnitureCardId: furnitureCardId,
        jwt: jwt,
        uploadType: uploadType
      }
    });
  }

  async cancelUpload(fileID: string) {
    const file = this.uppy.getFile(fileID);
    if (file) {
      this.uppy.removeFile(fileID);
      const JWT = this.accountCookieService.getJwt()
      const FURNITURE_CARD_ID = file.meta['furnitureCardId'] as string;
      const UPLOAD_TYPE = file.meta['uploadType'] as string;


      if (JWT && FURNITURE_CARD_ID && UPLOAD_TYPE === 'create') {
        await this.serverImageControl.DELETEproject(JWT, FURNITURE_CARD_ID)
        this.furnitureCardService.DELETEfurnitureCard(JWT, FURNITURE_CARD_ID)
      }
    }
  }
  private getFileExtension(fileName: string): string | null {
    const parts = fileName.split('.');
    const EXTENSION = parts.length > 1 ? parts.pop()?.toLowerCase() : "obj"
    return `.${EXTENSION}`
  }
  removeFileFromQueue(fileID: string) {
    const updatedQueue = this.uploads$.value.filter(file => file.id !== fileID);
    this.uploads$.next(updatedQueue);
  }

  private updateUpload(id: string, name: string, progress: number, status: uploadStatus) {
    const current = this.uploads$.value.filter(file => file.id !== id);
    this.uploads$.next([...current, { id, name, progress, status }]);
  }
}
