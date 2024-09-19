import { Injectable } from '@angular/core';
import Compressor from 'compressorjs';
@Injectable({
  providedIn: 'root'
})
export class ClientImageControlService {
  compressImage(image: File): Promise<Blob | null> {
    return new Promise((resolve, reject) => {
      new Compressor(image, {
        quality: 0.6,
        success: (compressedFile: Blob) => {
          resolve(compressedFile); // Разрешаем Promise сжатым изображением
        },
        error: (err: Error) => {
          console.error('Ошибка сжатия:', err.message);
          reject(err); // Отклоняем Promise в случае ошибки
        },
      });
    });
  }
}
