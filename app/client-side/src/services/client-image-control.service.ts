import { Injectable } from '@angular/core';
import Compressor from 'compressorjs';

/**
 * Сервис для работы с клиентскими изображениями, включая сжатие
 * @class ClientImageControlService
 * @injectable
 */
@Injectable({
  providedIn: 'root'
})
export class ClientImageControlService {

  /**
   * Сжимает изображение с помощью библиотеки Compressor.js
   * @param image - Исходный файл изображения (Blob или File)
   * @returns Promise, который резолвится в сжатый Blob или отклоняется с ошибкой
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
