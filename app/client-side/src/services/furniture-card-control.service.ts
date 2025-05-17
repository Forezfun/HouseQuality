import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { baseUrl } from '.';
import { imageSliderClientData, imageSliderFromServerData } from '../components/image-slider/image-slider.component';
import { firstValueFrom } from 'rxjs';
export interface shopData {
  cost: number;
  url: string;
}
export interface furnitureProportions {
  width: number|null;
  length: number|null;
  height: number|null;
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
  category?: string
  [key: string]: string | undefined
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

  private baseServiceUrl = baseUrl + 'furniture/card';

  constructor(private httpModule: HttpClient) { }

  /**
   * Получение furnitureCard по токену и автору
   * @param jwt Токен пользователя
   * @returns Promise с данными карточки мебели
   */
  async GETfurnitureCard(furnitureCardId: string, jwt?: string) {
    let HTTP_PARAMS = new HttpParams()
      .set('furnitureCardId', furnitureCardId);

    if (jwt !== undefined) {
      HTTP_PARAMS = HTTP_PARAMS.set('jwt', jwt);
    }

    try {
      const response = await firstValueFrom(
        this.httpModule.get(this.baseServiceUrl, { params: HTTP_PARAMS })) as {
          furnitureCard: furnitureFromServerData;
          authorMatched: boolean;
        }


      if (!response?.furnitureCard) {
        throw new Error('Invalid response structure: furnitureCard missing');
      }

      const transformedFurnitureCard = {
        ...response.furnitureCard,
        colors: response.furnitureCard.colors.map(colorData => ({
          color: colorData.color,
          imagesData: {
            idMainImage: colorData.imagesData.idMainImage,
            images: colorData.imagesData.images.map(url => baseUrl + url)
          }
        }))
      };

      return {
        furnitureCard: transformedFurnitureCard,
        authorMatched: response.authorMatched
      };

    } catch (error) {
      console.error('Error in GETfurnitureCard:', error);
      throw error;
    }
  }

  /**
   * Создание новой furnitureCard
   * @param jwt Токен пользователя
   * @param furnitureCard Данные карточки мебели
   * @returns Promise с результатом создания карточки
   */
  POSTcreateFurnitureCard(furnitureData: furnitureFromServerData, jwt: string) {
    let HTTP_PARAMS = new HttpParams()
      .set('jwt', jwt);
    return firstValueFrom(this.httpModule.post(this.baseServiceUrl, furnitureData, { params: HTTP_PARAMS })) as Promise<{ furnitureData: furnitureFromServerData & { _id: string } }>
  }

  /**
   * Обновление существующей furnitureCard
   * @param jwt Токен пользователя
   * @param furnitureCard Данные карточки мебели для обновления
   * @returns Promise с результатом обновления карточки
   */
  PUTupdateFurnitureCard(furnitureCardUpdateData: furnitureFromServerData, furnitureId: string, jwt: string) {
    let HTTP_PARAMS = new HttpParams()
      .set('jwt', jwt)
      .set('furnitureId', furnitureId);
    return firstValueFrom(this.httpModule.put(this.baseServiceUrl, furnitureCardUpdateData, { params: HTTP_PARAMS })) as Promise<{ message: string }>
  }

  /**
   * Удаление furnitureCard по токену
   * @param jwt Токен пользователя
   * @returns Promise с результатом удаления
   */
  DELETEfurnitureCard(jwt: string, furnitureCardId: string) {
    const HTTP_PARAMS = new HttpParams()
      .set('jwt', jwt)
      .set('furnitureCardId', furnitureCardId)
    return firstValueFrom(this.httpModule.delete(this.baseServiceUrl, { params: HTTP_PARAMS })) as Promise<{ message: string }>
  }
}
