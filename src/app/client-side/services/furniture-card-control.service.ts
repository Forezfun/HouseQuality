import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { baseUrl } from '.';
import { imageSliderClientData, imageSliderFromServerData } from '../components/image-slider/image-slider.component';
import { categoryData } from './category.service';
import { firstValueFrom } from 'rxjs';
interface shopData {
  cost: number;
  url: string;
}
interface furnitureProportions {
  width: number;
  length: number;
  height: number;
}
export interface colorClientData {
  color: string,
  imagesData: imageSliderClientData
}
export interface colorFromServerData {
  color: string,
  imagesData: imageSliderFromServerData
}
export interface additionalData {
  category?: categoryData
}
interface furnitureBaseData {
  name: string;
  description: string;
  proportions: furnitureProportions;
  shops: shopData[];
  additionalData: additionalData;
}
export interface furnitureClientData extends furnitureBaseData {
  colors: colorClientData[];
}
export interface furnitureFromServerData extends furnitureBaseData {
  colors: colorFromServerData[];
}
@Injectable({
  providedIn: 'root'
})
export class FurnitureCardControlService {

  private baseUrl = baseUrl + 'furniture/card/';

  constructor(private httpModule: HttpClient) { }

  /**
   * Получение furnitureCard по токену и автору
   * @param jwt Токен пользователя
   * @returns Promise с данными карточки мебели
   */
  GETfurnitureCard(furnitureCardId: string, jwt?: string) {
    let HTTP_PARAMS = new HttpParams()
      .set('furnitureCardId', furnitureCardId)
    if (jwt !== undefined) {
      HTTP_PARAMS = HTTP_PARAMS.set('jwtToken', jwt)
    }
    return firstValueFrom(this.httpModule.get(`${this.baseUrl}`, { params: HTTP_PARAMS })) as Promise<{ furnitureCard: furnitureFromServerData, authorMatched: boolean }>
  }

  /**
   * Создание новой furnitureCard
   * @param jwt Токен пользователя
   * @param furnitureCard Данные карточки мебели
   * @returns Promise с результатом создания карточки
   */
  POSTcreateFurnitureCard(furnitureData: furnitureFromServerData, jwt: string) {
    let HTTP_PARAMS = new HttpParams()
      .set('jwtToken', jwt);
    return firstValueFrom(this.httpModule.post(`${this.baseUrl}`, furnitureData, { params: HTTP_PARAMS })) as Promise<{ message: string }>
  }

  /**
   * Обновление существующей furnitureCard
   * @param jwt Токен пользователя
   * @param furnitureCard Данные карточки мебели для обновления
   * @returns Promise с результатом обновления карточки
   */
  PUTupdateFurnitureCard(furnitureCardUpdateData: furnitureFromServerData, furnitureId: string, jwt: string) {
    let HTTP_PARAMS = new HttpParams()
      .set('jwtToken', jwt)
      .set('furnitureId', furnitureId);
    return firstValueFrom(this.httpModule.put(`${this.baseUrl}`, furnitureCardUpdateData, { params: HTTP_PARAMS })) as Promise<{ message: string }>
  }

  /**
   * Удаление furnitureCard по токену
   * @param jwt Токен пользователя
   * @returns Promise с результатом удаления
   */
  DELETEfurnitureCard(jwt: string, furnitureCardId: string) {
    const HTTP_PARAMS = new HttpParams()
      .set('jwtToken', jwt)
      .set('furnitureCardId', furnitureCardId)
    return firstValueFrom(this.httpModule.delete(`${this.baseUrl}`, { params: HTTP_PARAMS })) as Promise<{ message: string }>
  }
}
