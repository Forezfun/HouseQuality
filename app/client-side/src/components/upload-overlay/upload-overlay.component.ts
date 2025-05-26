import { AsyncPipe, NgFor } from '@angular/common';
import { AfterViewChecked, ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { UploadEntry, UploadService } from '../../services/upload.service';
import { checkDesktop } from '../../usable/reusable-functions.used';

@Component({
  selector: 'app-upload-overlay',
  standalone: true,
  imports: [NgFor],
  templateUrl: './upload-overlay.component.html',
  styleUrl: './upload-overlay.component.scss'
})
export class UploadOverlayComponent implements OnInit {
  constructor(public uploadService: UploadService) { }

  /**Максимальная длина прогресс бара*/
  protected circumference = 2 * Math.PI * 18;

  /**Проверка десктоп ли клиент*/
  protected checkDesktop = checkDesktop;

  /**Список загруженных файлов с учетом остановки визуального изменения прогресса при наведении*/
  public displayUploads: UploadEntry[] = [];

  /**Хеш мапа <Id загружаемого файла:isHover> */
  protected hoverMap = new Map<string, boolean>();

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

  /**Вычисление длины окружности для прогресса*/
  protected calculatePercentage(percentage: number) {
    return this.circumference - (percentage / 100) * this.circumference
  }

  /**Отмена загрузки*/
  protected cancelUpload(id: string) {
    this.uploadService.cancelUpload(id);
    this.uploadService.removeFileFromQueue(id);
  }

  /**Удаление файла из очереди*/
  protected removeFromQueue(id: string) {
    this.uploadService.removeFileFromQueue(id);
  }

  /**Указание, что у файла hover*/
  protected onMouseEnter(id: string) {
    this.hoverMap.set(id, true);
  }

  /**Указание, что у файла hover*/
  protected onMouseLeave(id: string) {
    this.hoverMap.set(id, false);
  }

  /**Проверка на hover*/
  public isHovered(id: string): boolean {
    return this.hoverMap.get(id) || false;
  }
}
