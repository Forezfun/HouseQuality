import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { baseUrl } from '.';
import { imageSliderClientData, imageSliderFromServerData } from '../components/image-slider/image-slider.component';
import { firstValueFrom } from 'rxjs';

/**
 * Данные магазина с ценой и URL
 * @interface shopData
 */
export interface shopData {
  /** Цена мебели */
  cost: number;
  /** URL магазина или товара */
  url: string;
}

/**
 * Пропорции мебели (ширина, длина, высота)
 * @interface furnitureProportions
 */
export interface furnitureProportions {
  /** Ширина мебели (или null, если не задана) */
  width: number | null;
  /** Длина мебели (или null, если не задана) */
  length: number | null;
  /** Высота мебели (или null, если не задана) */
  height: number | null;
}

/**
 * Данные цвета на клиенте, включая слайдер изображений
 * @interface colorClientData
 */
export interface colorClientData {
  /** Цвет мебели */
  color: string;
  /** Данные для слайдера изображений */
  imagesData: imageSliderClientData;
}

/**
 * Данные цвета с сервера, включая слайдер изображений
 * @interface colorFromServerData
 */
export interface colorFromServerData {
  /** Цвет мебели */
  color: string;
  /** Данные для слайдера изображений */
  imagesData: imageSliderFromServerData;
}

/**
 * Дополнительные данные мебели с динамическими ключами
 * @interface additionalData
 */
export interface additionalData {
  /** Категория мебели (опционально) */
  category?: string;
  /** Другие динамические свойства */
  [key: string]: string | undefined;
}

/**
 * Базовые данные мебели, общие для клиента и сервера
 * @interface furnitureBaseData
 */
interface furnitureBaseData {
  /** Название мебели */
  name: string;
  /** Описание мебели */
  description: string;
  /** Пропорции мебели */
  proportions: furnitureProportions;
  /** Список магазинов с ценами и URL */
  shops: shopData[];
  /** Дополнительные данные */
  additionalData: additionalData;
}

/**
 * Данные мебели на клиенте с цветами
 * @interface furnitureClientData
 * @extends furnitureBaseData
 */
export interface furnitureClientData extends furnitureBaseData {
  /** Список цветов с данными для клиента */
  colors: colorClientData[];
}

/**
 * Данные мебели с сервера с цветами
 * @interface furnitureFromServerData
 * @extends furnitureBaseData
 */
export interface furnitureFromServerData extends furnitureBaseData {
  /** Список цветов с данными с сервера */
  colors: colorFromServerData[];
}

/**
 * Сервис для управления карточками мебели
 * @class FurnitureCardControlService
 * @injectable
 */
@Injectable({
  providedIn: 'root'
})
export class FurnitureCardControlService {

  /** Базовый URL для запросов к API мебели */
  private baseServiceUrl = baseUrl + 'furniture/card';

  /**
   * Конструктор сервиса
   * @param httpModule HTTP клиент для запросов
   */
  constructor(private httpModule: HttpClient) { }

  /**
   * Получение карточки мебели по ID и опциональному JWT токену
   * @param furnitureCardId - ID карточки мебели
   * @param [jwt] - JWT токен пользователя (опционально)
   * @returns Promise с объектом, содержащим данные карточки и флаг совпадения автора
   * @throws Ошибка при некорректной структуре ответа или при ошибках запроса
   */
  async GETfurnitureCard(
    furnitureCardId: string,
    jwt?: string
  ): Promise<{ furnitureCard: furnitureFromServerData; authorMatched: boolean }> {
    let HTTP_PARAMS = new HttpParams().set('furnitureCardId', furnitureCardId);

    if (jwt !== undefined) {
      HTTP_PARAMS = HTTP_PARAMS.set('jwt', jwt);
    }

    try {
      const response = await firstValueFrom(
        this.httpModule.get(this.baseServiceUrl, { params: HTTP_PARAMS })
      ) as {
        furnitureCard: furnitureFromServerData;
        authorMatched: boolean;
      };

      if (!response?.furnitureCard) {
        throw new Error('Invalid response structure: furnitureCard missing');
      }

      // Добавляем полный URL к изображениям
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
   * Создание новой карточки мебели
   * @param furnitureData - Данные новой карточки мебели
   * @param jwt - JWT токен пользователя
   * @returns Promise с данными созданной карточки, включая её ID
   */
  POSTcreateFurnitureCard(
    furnitureData: furnitureFromServerData,
    jwt: string
  ): Promise<{ furnitureData: furnitureFromServerData & { _id: string } }> {
    let HTTP_PARAMS = new HttpParams().set('jwt', jwt);
    return firstValueFrom(
      this.httpModule.post(this.baseServiceUrl, furnitureData, { params: HTTP_PARAMS })
    ) as Promise<{ furnitureData: furnitureFromServerData & { _id: string } }>;
  }

  /**
   * Обновление существующей карточки мебели
   * @param furnitureCardUpdateData - Обновленные данные карточки мебели
   * @param furnitureCardId - ID карточки мебели для обновления
   * @param jwt - JWT токен пользователя
   * @returns Promise с сообщением результата обновления
   */
  PUTupdateFurnitureCard(
    furnitureCardUpdateData: furnitureFromServerData,
    furnitureCardId: string,
    jwt: string
  ): Promise<{ message: string }> {
    let HTTP_PARAMS = new HttpParams()
      .set('jwt', jwt)
      .set('furnitureCardId', furnitureCardId);
    return firstValueFrom(
      this.httpModule.put(this.baseServiceUrl, furnitureCardUpdateData, { params: HTTP_PARAMS })
    ) as Promise<{ message: string }>;
  }

  /**
   * Удаление карточки мебели по ID и JWT токену
   * @param jwt - JWT токен пользователя
   * @param furnitureCardId - ID карточки мебели для удаления
   * @returns Promise с сообщением результата удаления
   */
  DELETEfurnitureCard(jwt: string, furnitureCardId: string): Promise<{ message: string }> {
    const HTTP_PARAMS = new HttpParams()
      .set('jwt', jwt)
      .set('furnitureCardId', furnitureCardId);
    return firstValueFrom(
      this.httpModule.delete(this.baseServiceUrl, { params: HTTP_PARAMS })
    ) as Promise<{ message: string }>;
  }
}
