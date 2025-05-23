import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { UploadEntry, UploadService } from '../../services/upload.service';
import { checkDesktop } from '../../usable/reusable-functions.used';

@Component({
  selector: 'app-upload-overlay',
  imports: [NgFor, AsyncPipe],
  templateUrl: './upload-overlay.component.html',
  styleUrl: './upload-overlay.component.scss'
})
export class UploadOverlayComponent {
  constructor(public uploadService: UploadService) { }

  circumference = 2 * Math.PI * 18;

  cancel(id: string) {
    console.log('Cancel upload', id);
  }
  checkDesktop = checkDesktop
}
