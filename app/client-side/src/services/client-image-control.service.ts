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
    return new Promise((resolve, reject) => {
      new Compressor(image, {
        quality: 0.6,
        success: (compressedFile: Blob) => {
          resolve(compressedFile);
        },
        error: (error) => {
          console.error('Ошибка сжатия:', error.message);
          
          reject(error); 
        },
      });
    });
  }
}
