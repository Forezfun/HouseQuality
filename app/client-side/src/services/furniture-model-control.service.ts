import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { baseUrl } from '.';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FurnitureModelControlService {
  /** Базовый URL для API запросов к моделям мебели */
  private baseServiceUrl = baseUrl + 'furniture/model';

  constructor(private httpModule: HttpClient) { }

  /**
   * Получение 3D модели мебели по ID
   * @param {string} jwt - JWT токен пользователя для авторизации
   * @param {string} furnitureCardId - ID модели мебели
   * @returns {Promise<Blob>} - Файл модели в формате Blob
   */
  GETfurnitureModel(jwt: string, furnitureCardId: string): Promise<Blob> {
    const HTTP_PARAMS = new HttpParams()
      .set('jwt', jwt)
      .set('furnitureCardId', furnitureCardId);

    return firstValueFrom(
      this.httpModule.get(this.baseServiceUrl, { params: HTTP_PARAMS, responseType: 'blob' })
    ) as Promise<Blob>;
  }

  /**
   * Загрузка 3D модели мебели на сервер
   * @param {Blob} modelFile - Файл модели для загрузки
   * @param {string} jwt - JWT токен пользователя
   * @param {string} furnitureCardId - ID мебели, к которой относится модель
   * @returns {Promise<{message: string}>} - Результат запроса с сообщением
   */
  POSTuploadFurnitureModel(modelFile: Blob, jwt: string, furnitureCardId: string): Promise<{message: string}> {
    const formData = new FormData();
    formData.append('model', modelFile);
    const HTTP_PARAMS = new HttpParams()
      .set('jwt', jwt)
      .set('furnitureCardId', furnitureCardId)
      .set('fileName', (modelFile as any).name);

    return firstValueFrom(
      this.httpModule.post(this.baseServiceUrl, formData, { params: HTTP_PARAMS })
    ) as Promise<{message: string}>;
  }

  /**
   * Удаление 3D модели мебели по ID
   * @param {string} jwt - JWT токен пользователя
   * @param {string} furnitureCardId - ID модели мебели для удаления
   * @returns {Promise<{message: string}>} - Результат запроса с сообщением
   */
  DELETEfurnitureModel(jwt: string, furnitureCardId: string): Promise<{message: string}> {
    const HTTP_PARAMS = new HttpParams()
      .set('jwt', jwt)
      .set('furnitureCardId', furnitureCardId);

    return firstValueFrom(
      this.httpModule.delete(this.baseServiceUrl, { params: HTTP_PARAMS })
    ) as Promise<{message: string}>;
  }
}
