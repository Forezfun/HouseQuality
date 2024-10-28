import { Injectable } from '@angular/core';
import Compressor from 'compressorjs';
@Injectable({
  providedIn: 'root'
})
export class ClientImageControlService {
    /**
   * Удаление furnitureCard по токену
   * @param Blob файл 
   * @returns Observable с результатом сжатия
   * Можно использовать async / await
   */
  compressImage(image: File): Promise<Blob | null> {
    console.log(typeof image)
    return new Promise((resolve, reject) => {
      new Compressor(image, {
        quality: 0.6,
        success: (compressedFile: Blob) => {
          resolve(compressedFile);
        },
        error: (err: Error) => {
          console.error('Ошибка сжатия:', err.message);
          
          reject(err); 
        },
      });
    });
  }
}
