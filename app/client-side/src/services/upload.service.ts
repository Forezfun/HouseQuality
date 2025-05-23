import { Injectable } from '@angular/core';
import Uppy from '@uppy/core';
import XHRUpload from '@uppy/xhr-upload';
import { BehaviorSubject } from 'rxjs';
import { baseUrl } from '.';
import { FurnitureCardControlService } from './furniture-card-control.service';
import { ServerImageControlService } from './server-image-control.service';
import { AccountCookieService } from './account-cookie.service';

type UploadStatus = 'uploading' | 'success' | 'error' | 'cancelled';

export interface UploadEntry {
  id: string;
  name: string;
  progress: number;
  status: UploadStatus;
}

@Injectable({ providedIn: 'root' })
export class UploadService {
  private uppy: Uppy;
  public uploads$ = new BehaviorSubject<UploadEntry[]>([]);
  private baseServiceUrl = baseUrl + 'furniture/model';

  constructor(
    private furnitureCardService: FurnitureCardControlService,
    private serverImageControl: ServerImageControlService,
    private accountCookieService: AccountCookieService
  ) {
    this.uppy = new Uppy({ autoProceed: true });

    this.uppy.use(XHRUpload, {
      endpoint: this.baseServiceUrl,
      fieldName: 'file',
      formData: true
    });

    this.uppy.on('upload-progress', (file, progress) => {
      if (file === undefined || file.name === undefined) return;
      this.updateUpload(file.id, file.name, progress.percentage ?? 50, 'uploading');
    });

    this.uppy.on('upload-success', (file) => {
      if (file === undefined || file.name === undefined) return;
      this.updateUpload(file.id, file.name, 100, 'success');
    });

    this.uppy.on('upload-error', (file) => {
      if (file === undefined || file.name === undefined) return;
      this.updateUpload(file.id, file.name, 0, 'error');
    });

    this.uppy.on('file-removed', (file) => {
      if (file === undefined || file.name === undefined) return;
      this.updateUpload(file.id, file.name, 0, 'cancelled');
    });
  }

  addFile(file: File, jwt: string, furnitureCardId: string) {
    this.uppy.addFile({
      name: file.name,
      type: file.type,
      data: file,
      meta: {
        furnitureCardId: furnitureCardId,
        jwt: jwt
      }
    });
  }

  async cancelUpload(fileID: string) {
    const file = this.uppy.getFile(fileID);
    if (file) {
      this.uppy.removeFile(fileID);
      const JWT = this.accountCookieService.getJwt()
      const FURNITURE_CARD_ID = file.meta['furnitureCardId'] as string;

      this.removeFileFromQueue(fileID)

      if (JWT&&FURNITURE_CARD_ID) {
        this.serverImageControl.DELETEproject(JWT, FURNITURE_CARD_ID)
        this.furnitureCardService.DELETEfurnitureCard(JWT, FURNITURE_CARD_ID)
      }
    }
  }

  removeFileFromQueue(fileID: string) {
    const updatedQueue = this.uploads$.value.filter(file => file.id !== fileID);
    this.uploads$.next(updatedQueue);
  }

  private updateUpload(id: string, name: string, progress: number, status: UploadStatus) {
    const current = this.uploads$.value.filter(u => u.id !== id);
    this.uploads$.next([...current, { id, name, progress, status }]);
  }
}
