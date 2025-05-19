import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { baseUrl } from '.';
import { firstValueFrom } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class FurnitureModelControlService {
  private baseServiceUrl = baseUrl+'furniture/model'
  constructor(private httpModule: HttpClient) { }

  /**
   * Получение модели по ID мебели
   * @param jwt Токен пользователя
   * @param furnitureCardId ID модели мебели
   * @returns Модель в виде файла
   */
  GETfurnitureModel(jwt: string, furnitureCardId: string) {
    const HTTP_PARAMS = new HttpParams()
    .set('jwt', jwt)
    .set('furnitureCardId', furnitureCardId)
    return firstValueFrom(this.httpModule.get(this.baseServiceUrl, { params: HTTP_PARAMS, responseType: 'blob' })) as Promise<Blob>
  }

  /**
   * Загрузка 3D модели
   * @param modelFile Файл модели
   * @param jwt Токен пользователя
   * @param furnitureCardId ID мебели
   * @returns Promise с результатом запроса
   */
  POSTuploadFurnitureModel(modelFile: Blob, jwt: string, furnitureCardId: string) {
    const formData = new FormData();
    formData.append('model', modelFile);
    const HTTP_PARAMS = new HttpParams()
    .set('jwt', jwt)
    .set('furnitureCardId', furnitureCardId)
    .set('fileName', (modelFile as any).name);
    return firstValueFrom(this.httpModule.post(this.baseServiceUrl, formData, { params: HTTP_PARAMS })) as Promise<{message:string}>
  }

  /**
   * Удаление модели по ID
   * @param jwt Токен пользователя
   * @param furnitureCardId ID модели мебели
   * @returns Promise с результатом запроса
   */
  DELETEfurnitureModel(jwt: string, furnitureCardId: string): Promise<any> {
    const HTTP_PARAMS = new HttpParams()
    .set('jwt', jwt)
    .set('furnitureCardId', furnitureCardId)
    return firstValueFrom(this.httpModule.delete(this.baseServiceUrl, { params: HTTP_PARAMS })) as Promise<{message:string}>
  }
}
