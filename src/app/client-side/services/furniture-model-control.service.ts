import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { baseUrl } from '.';
@Injectable({
  providedIn: 'root'
})
export class FurnitureModelControlService {

  constructor(private httpModule: HttpClient) { }

  /**
   * Получение модели по ID мебели
   * @param jwt Токен пользователя
   * @param furnitureId ID модели мебели
   * @returns Модель в виде файла
   */
  GETfurnitureModel(jwt: string, furnitureId: string): Observable<Blob> {
    const HTTP_PARAMS = new HttpParams()
    .set('jwtToken', jwt)
    .set('furnitureId', furnitureId)
    return this.httpModule.get(`${baseUrl}furniture/model`, { params: HTTP_PARAMS, responseType: 'blob' });
  }

  /**
   * Загрузка 3D модели
   * @param modelFile Файл модели
   * @param jwt Токен пользователя
   * @param furnitureId ID мебели
   * @returns Observable с результатом запроса
   */
  POSTloadFurnitureModel(modelFile: Blob, jwt: string, furnitureId: string): Observable<any> {
    const formData = new FormData();
    formData.append('model', modelFile);
    const HTTP_PARAMS = new HttpParams()
    .set('jwtToken', jwt)
    .set('furnitureId', furnitureId)
    .set('fileName', (modelFile as any).name);
    return this.httpModule.post(`${baseUrl}furniture/model/upload`, formData, { params: HTTP_PARAMS });
  }

  /**
   * Обновление 3D модели
   * @param modelFile Файл новой модели
   * @param jwt Токен пользователя
   * @param furnitureId ID мебели
   * @returns Observable с результатом запроса
   */
  PUTupdateFurnitureModel(modelFile: Blob, jwt: string, furnitureId: string): Observable<any> {
    const formData = new FormData();
    formData.append('model', modelFile);
    const HTTP_PARAMS = new HttpParams()
    .set('jwtToken', jwt)
    .set('furnitureId', furnitureId)
    .set('fileName', (modelFile as any).name);
    
    return this.httpModule.put(`${baseUrl}furniture/model/update/${furnitureId}`, formData, { params: HTTP_PARAMS });
  }

  /**
   * Удаление модели по ID
   * @param jwt Токен пользователя
   * @param furnitureId ID модели мебели
   * @returns Observable с результатом запроса
   */
  DELETEfurnitureModel(jwt: string, furnitureId: string): Observable<any> {
    const HTTP_PARAMS = new HttpParams().set('jwtToken', jwt);
    return this.httpModule.delete(`${baseUrl}furniture/model/delete/${furnitureId}`, { params: HTTP_PARAMS });
  }
}
