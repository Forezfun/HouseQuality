import { AsyncPipe, NgFor } from '@angular/common';
import { AfterViewChecked, ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { UploadEntry, UploadService } from '../../services/upload.service';
import { checkDesktop } from '../../usable/reusable-functions.used';

@Component({
  selector: 'app-upload-overlay',
  standalone: true,
  imports: [NgFor, AsyncPipe],
  templateUrl: './upload-overlay.component.html',
  styleUrl: './upload-overlay.component.scss'
})
export class UploadOverlayComponent implements OnInit {
  constructor(public uploadService: UploadService) { }

  protected circumference = 2 * Math.PI * 18;
  protected checkDesktop = checkDesktop;
  public displayUploads: UploadEntry[] = [];

  ngOnInit() {
    this.uploadService.uploads$.subscribe(files => {

      this.displayUploads = files.map(file => {
        if (this.isHovered(file.id)) {
          const old = this.displayUploads.find(f => f.id === file.id);
          return old ?? file;
        }
        return file;
      });
    });
  }
  protected hoverMap = new Map<string, boolean>();
  protected calculatePercentage(percentage: number) {
    console.log('calc')
    return this.circumference - (percentage / 100) * this.circumference
  }
  protected cancelUpload(id: string) {
    this.uploadService.cancelUpload(id);
    this.uploadService.removeFileFromQueue(id);
  }

  protected removeFromQueue(id: string) {
    this.uploadService.removeFileFromQueue(id);
  }

  protected onMouseEnter(id: string) {
    this.hoverMap.set(id, true);
  }

  protected onMouseLeave(id: string) {
    this.hoverMap.set(id, false);
  }

  public isHovered(id: string): boolean {
    return this.hoverMap.get(id) || false;
  }
}
