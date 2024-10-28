import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoaderServiceControlService {
  private worker: Worker | undefined; // Объявляем тип Worker или undefined
  public objectLoaded$ = new Subject<any>();

  constructor() {
      if (typeof Worker !== 'undefined') {
        console.log(import.meta.url)
          this.worker = new Worker(new URL('../components/scene/loaders/loaders/obj.loader.ts', import.meta.url));
          console.log(new URL('../components/scene/loaders/loaders/obj.loader.ts', import.meta.url))
          console.log(this.worker)
          this.worker.onmessage = (event) => {
            console.log('worker received a data')
            console.log(event)
              this.objectLoaded$.next(event.data);
          };
      } else {
          // Worker не поддерживается
          console.error('Web Workers are not supported in this environment.');
      }
  }

  loadModel(blobFile: Blob) {
      if (this.worker) { // Проверяем, инициализирован ли worker
          this.worker.postMessage({ blobFile });
      } else {
          console.error('Worker is not initialized.');
      }
  }
}
