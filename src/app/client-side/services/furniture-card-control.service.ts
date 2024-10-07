import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { furnitureData, furnitureServerData } from '../components/create-furnitre/create-furniture.component';
@Injectable({
  providedIn: 'root'
})
export class FurnitureCardControlService {

  private baseUrl = 'http://localhost:8010/proxy/furniture/card/';

  constructor(private httpModule: HttpClient) { }

  /**
   * Получение furnitureCard по токену и автору
   * @param jwt Токен пользователя
   * @returns Observable с данными карточки мебели
   */
  GETfurnitureCard(furnitureCardId: string,jwt?:string): Observable<any> {
    let HTTP_PARAMS = new HttpParams().set('furnitureCardId', furnitureCardId)
    if(jwt!==undefined){
      HTTP_PARAMS=HTTP_PARAMS.set('jwtToken', jwt)
    }
    return this.httpModule.get(`${this.baseUrl}`, { params: HTTP_PARAMS });
  }

  /**
   * Создание новой furnitureCard
   * @param jwt Токен пользователя
   * @param furnitureCard Данные карточки мебели
   * @returns Observable с результатом создания карточки
   */
  POSTcreateFurnitureCard(jwt: string, furnitureCardTextData: furnitureData): Observable<any> {
    const HTTP_PARAMS = new HttpParams().set('jwtToken', jwt);
    return this.httpModule.post(`${this.baseUrl}`, furnitureCardTextData, { params: HTTP_PARAMS });
  }

  /**
   * Обновление существующей furnitureCard
   * @param jwt Токен пользователя
   * @param furnitureCard Данные карточки мебели для обновления
   * @returns Observable с результатом обновления карточки
   */
  PUTupdateFurnitureCard(jwt: string, furnitureCard: any): Observable<any> {
    const HTTP_PARAMS = new HttpParams().set('jwtToken', jwt);
    return this.httpModule.put(`${this.baseUrl}`, furnitureCard, { params: HTTP_PARAMS });
  }

  /**
   * Удаление furnitureCard по токену
   * @param jwt Токен пользователя
   * @returns Observable с результатом удаления
   */
  DELETEfurnitureCard(jwt: string,furnitureCardId:string): Observable<any> {
    const HTTP_PARAMS = new HttpParams()
    .set('jwtToken', jwt)
    .set('furnitureCardId', furnitureCardId)
    return this.httpModule.delete(`${this.baseUrl}`, { params: HTTP_PARAMS });
  }
}
