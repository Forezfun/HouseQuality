import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { baseUrl } from '.';
import { firstValueFrom } from 'rxjs';
import { UploadService, uploadType } from './upload.service';

@Injectable({
  providedIn: 'root'
})
export class FurnitureModelControlService {
  /** Базовый URL для API запросов к моделям мебели */
  private baseServiceUrl = baseUrl + 'furniture/model';

  constructor(
    private httpModule: HttpClient,
    private uploadService: UploadService
  ) { }

  /**
   * Получение 3D модели мебели по ID
   * @param {string} jwt - JWT токен пользователя для авторизации
   * @param {string} furnitureCardId - ID модели мебели
   * @returns {Promise<Blob>} - Файл модели в формате Blob
   */
  GETfurnitureModel(jwt: string, furnitureCardId: string, controller: AbortController): Promise<Blob> {
    const url = new URL(this.baseServiceUrl);
    url.searchParams.set('jwt', jwt);
    url.searchParams.set('furnitureCardId', furnitureCardId);

    return fetch(url.toString(), {
      method: 'GET',
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error('Отмена загрузки');
        return res.blob();
      });
  }

  /**
   * Загрузка 3D модели мебели на сервер
   * @param {Blob} modelFile - Файл модели для загрузки
   * @param {string} jwt - JWT токен пользователя
   * @param {string} furnitureCardId - ID мебели, к которой относится модель
   */
  POSTuploadFurnitureModel(modelFile: File, jwt: string, furnitureCardId: string, uploadType: uploadType) {
    this.uploadService.addFile(modelFile, jwt, furnitureCardId, uploadType);
  }

  /**
   * Удаление 3D модели мебели по ID
   * @param {string} jwt - JWT токен пользователя
   * @param {string} furnitureCardId - ID модели мебели для удаления
   * @returns {Promise<{message: string}>} - Результат запроса с сообщением
   */
  DELETEfurnitureModel(jwt: string, furnitureCardId: string): Promise<{ message: string }> {
    const HTTP_PARAMS = new HttpParams()
      .set('jwt', jwt)
      .set('furnitureCardId', furnitureCardId);

    return firstValueFrom(
      this.httpModule.delete(this.baseServiceUrl, { params: HTTP_PARAMS })
    ) as Promise<{ message: string }>;
  }
}
