import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { UploadEntry, UploadService } from '../../services/upload.service';
import { checkDesktop } from '../../usable/reusable-functions.used';

@Component({
  selector: 'app-upload-overlay',
  imports: [NgFor, AsyncPipe],
  standalone:true,
  templateUrl: './upload-overlay.component.html',
  styleUrl: './upload-overlay.component.scss'
})
export class UploadOverlayComponent {
  constructor(public uploadService: UploadService) { }
  
  protected circumference = 2 * Math.PI * 18;

  protected cancelUpload(id: string) {
    this.uploadService.cancelUpload(id)
    this.uploadService.removeFileFromQueue(id)
  }
  protected removeFromQueue(id: string) {
    this.uploadService.removeFileFromQueue(id)
  }
  protected checkDesktop = checkDesktop
}
