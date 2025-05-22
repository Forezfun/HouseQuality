import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { baseUrl } from '.';
import { firstValueFrom } from 'rxjs';
import { imageSliderClientData } from '../components/image-slider/image-slider.component';

@Injectable({
  providedIn: 'root'
})
export class ServerImageControlService {
  private baseServiceUrl = baseUrl + 'furniture/images/';

  constructor(private httpModule: HttpClient) {}

  /**
   * Получение URL аватара пользователя.
   * @param {string} jwt JWT токен пользователя.
   * @returns {string} Строка с URL для получения аватара.
   */
  GETaccountAvatar(jwt: string): string {
    return `${baseUrl}account/avatar?jwt=${jwt}`;
  }

  /**
   * Загрузка аватара пользователя.
   * @param {Blob} imageFile Изображение аватара.
   * @param {string} jwt JWT токен пользователя.
   * @returns {Promise<{ message: string }>} Промис с сообщением об успешной загрузке.
   */
  POSTuploadUserAvatar(imageFile: Blob, jwt: string): Promise<{ message: string }> {
    const formData = new FormData();
    formData.append('image', imageFile);
    const HTTP_PARAMS = new HttpParams().set('jwt', jwt);
    return firstValueFrom(this.httpModule.post(`${baseUrl}account/avatar`, formData, { params: HTTP_PARAMS })) as Promise<{ message: string }>;
  }

  /**
   * Загрузка изображений проекта.
   * @param {string} color Цвет мебели.
   * @param {imageSliderClientData} imagesData Данные изображений (включая главную).
   * @param {string} jwt JWT токен пользователя.
   * @param {string} furnitureCardId ID карточки мебели.
   * @returns {Promise<{ message: string }>} Промис с сообщением об успешной загрузке.
   */
  POSTuploadProjectImages(color: string, imagesData: imageSliderClientData, jwt: string, furnitureCardId: string): Promise<{ message: string }> {
    const formData = new FormData();
    imagesData.images.forEach((file) => formData.append('images', file));

    const HTTP_PARAMS = new HttpParams()
      .set('furnitureCardId', furnitureCardId)
      .set('color', color)
      .set('idMainImage', imagesData.idMainImage)
      .set('jwt', jwt);

    return firstValueFrom(this.httpModule.post(this.baseServiceUrl + 'upload', formData, { params: HTTP_PARAMS })) as Promise<{ message: string }>;
  }

  /**
   * Удаление цвета проекта (мебели).
   * @param {string} jwt JWT токен пользователя.
   * @param {string} furnitureCardId ID карточки мебели.
   * @param {string} color Цвет, который нужно удалить.
   * @returns {Promise<{ message: string }>} Промис с сообщением об успешном удалении.
   */
  DELETEprojectColor(jwt: string, furnitureCardId: string, color: string): Promise<{ message: string }> {
    const HTTP_PARAMS = new HttpParams()
      .set('jwt', jwt)
      .set('furnitureCardId', furnitureCardId)
      .set('color', color);

    return firstValueFrom(this.httpModule.delete(this.baseServiceUrl + 'delete/color', { params: HTTP_PARAMS })) as Promise<{ message: string }>;
  }

  /**
   * Удаление проекта по ID карточки мебели.
   * @param {string} jwt JWT токен пользователя.
   * @param {string} furnitureCardId ID карточки мебели.
   * @returns {Promise<{ message: string }>} Промис с сообщением об успешном удалении проекта.
   */
  DELETEproject(jwt: string, furnitureCardId: string): Promise<{ message: string }> {
    const HTTP_PARAMS = new HttpParams()
      .set('jwt', jwt)
      .set('furnitureCardId', furnitureCardId);

    return firstValueFrom(this.httpModule.delete(this.baseServiceUrl + 'delete/project', { params: HTTP_PARAMS })) as Promise<{ message: string }>;
  }

  /**
   * Получение всех изображений проекта по цвету и ID карточки мебели.
   * @param {string} furnitureCardId ID карточки мебели.
   * @param {string} color Цвет мебели.
   * @returns {Promise<{ imagesURLS: string[], idMainImage: number }>} Промис с URL изображений и ID главного изображения.
   */
  GETallProjectImages(furnitureCardId: string, color: string): Promise<{ imagesURLS: string[], idMainImage: number }> {
    const HTTP_PARAMS = new HttpParams()
      .set('furnitureCardId', furnitureCardId)
      .set('color', color);

    return firstValueFrom(this.httpModule.get(this.baseServiceUrl + 'all', { params: HTTP_PARAMS })) as Promise<{ imagesURLS: string[], idMainImage: number }>;
  }

  /**
   * Получение URL главного изображения по ID карточки мебели и цвету.
   * @param {string} furnitureCardId ID карточки мебели.
   * @param {string} color Цвет мебели.
   * @returns {string} Строка с URL главного изображения.
   */
  GETmainImage(furnitureCardId: string, color: string): string {
    return `${this.baseServiceUrl}main?furnitureCardId=${furnitureCardId}&color=${color}`;
  }
}
