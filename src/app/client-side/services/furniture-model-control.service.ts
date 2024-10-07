import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FurnitureModelControlService {
  private baseUrl = 'http://localhost:8010/proxy/';

  constructor(private httpMModule: HttpClient) { }

  /**
   * Получение модели по ID мебели
   * @param jwt Токен пользователя
   * @param furnitureId ID модели мебели
   * @returns Модель в виде файла
   */
  GETfurnitureModel(jwt: string, furnitureId: string): Observable<Blob> {
    const HTTP_PARAMS = new HttpParams().set('jwtToken', jwt);
    return this.httpMModule.get(`${this.baseUrl}furniture/model/${furnitureId}`, { params: HTTP_PARAMS, responseType: 'blob' });
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
    const HTTP_PARAMS = new HttpParams().set('jwtToken', jwt).set('furnitureId', furnitureId);
    return this.httpMModule.post(`${this.baseUrl}furniture/model/upload`, formData, { params: HTTP_PARAMS });
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
    const HTTP_PARAMS = new HttpParams().set('jwtToken', jwt).set('furnitureId', furnitureId);
    return this.httpMModule.put(`${this.baseUrl}furniture/model/update/${furnitureId}`, formData, { params: HTTP_PARAMS });
  }

  /**
   * Удаление модели по ID
   * @param jwt Токен пользователя
   * @param furnitureId ID модели мебели
   * @returns Observable с результатом запроса
   */
  DELETEfurnitureModel(jwt: string, furnitureId: string): Observable<any> {
    const HTTP_PARAMS = new HttpParams().set('jwtToken', jwt);
    return this.httpMModule.delete(`${this.baseUrl}furniture/model/delete/${furnitureId}`, { params: HTTP_PARAMS });
  }
}
