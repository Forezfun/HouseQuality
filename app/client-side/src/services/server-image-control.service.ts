import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { baseUrl } from '.';
import { firstValueFrom} from 'rxjs';
import { imageSliderClientData } from '../components/image-slider/image-slider.component';
@Injectable({
  providedIn: 'root'
})
export class ServerImageControlService {
  private baseServiceUrl = baseUrl + 'furniture/images/'
  constructor(
    private httpModule: HttpClient
  ) { }


  /**
   * Получение аватара пользователя
   * @param jwt JWT токен пользователя
   * @returns URL для получения аватара пользователя
   */
  GETaccountAvatar(jwt: string) {
    return `${baseUrl}avatar?jwt=${jwt}`;
  }

  /**
   * Загрузка аватара пользователя
   * @param imageFile Файл изображения
   * @param jwt JWT токен пользователя
   * @returns Observable с результатом загрузки аватара
   */
  POSTuploadUserAvatar(imageFile: Blob, jwt: string) {
    const formData = new FormData();
    formData.append('image', imageFile);
    const HTTP_PARAMS = new HttpParams().set('jwt', jwt);
    return firstValueFrom(this.httpModule.post(`${baseUrl}avatar/upload`, formData, { params: HTTP_PARAMS })) as Promise<{ message: string }>
  }

  /**
   * Загрузка изображений проекта
   * @param imageFiles Файлы изображений
   * @param jwt JWT токен пользователя
   * @param furnitureCardId ID карточки мебели
   * @param color Цвет мебели
   * @returns Observable с результатом загрузки изображений
   */
  POSTuploadProjectImages(color: string, imagesData: imageSliderClientData, jwt: string, furnitureCardId: string) {
    const formData = new FormData();

    imagesData.images.forEach((file) => formData.append('images', file));

    const HTTP_PARAMS = new HttpParams()
      .set('furnitureCardId', furnitureCardId)
      .set('color', color)
      .set('idMainImage', imagesData.idMainImage)
      .set('jwt', jwt)

    return firstValueFrom(this.httpModule.post(this.baseServiceUrl + 'upload/images', formData, { params: HTTP_PARAMS })) as Promise<{ message: string }>
  }



  /**
   * Удаление цвета мебели
   * @param jwt JWT токен пользователя
   * @param furnitureCardId ID карточки мебели
   * @param color Цвет мебели для удаления
   * @returns Observable с результатом удаления цвета мебели
   */
  DELETEprojectColor(jwt: string, furnitureCardId: string, color: string) {
    const HTTP_PARAMS = new HttpParams()
      .set('jwt', jwt)
      .set('furnitureCardId', furnitureCardId)
      .set('color', color);

    return firstValueFrom(this.httpModule.delete(this.baseServiceUrl + 'delete/color', { params: HTTP_PARAMS })) as Promise<{ message: string }>
  }

  /**
   * Удаление проекта
   * @param jwt JWT токен пользователя
   * @param furnitureCardId ID карточки мебели
   * @returns Observable с результатом удаления проекта
   */
  DELETEproject(jwt: string, furnitureCardId: string) {
    const HTTP_PARAMS = new HttpParams()
      .set('jwt', jwt)
      .set('furnitureCardId', furnitureCardId);

    return firstValueFrom(this.httpModule.delete(this.baseServiceUrl + 'delete/project', { params: HTTP_PARAMS })) as Promise<{ message: string }>
  }
  /**
 * Получение всех изображений проекта по ID карточки мебели и цвету
 * @param furnitureCardId ID карточки мебели
 * @param color Цвет мебели
 * @returns Observable с массивом всех изображений
 */
  GETallProjectImages(furnitureCardId: string, color: string) {
    const HTTP_PARAMS = new HttpParams()
      .set('furnitureCardId', furnitureCardId)
      .set('color', color);

    return firstValueFrom(this.httpModule.get(this.baseServiceUrl + 'all', { params: HTTP_PARAMS })) as Promise<{ imagesURLS: string[], idMainImage: number }>
  }

  /**
   * Получение главного изображения цвета по ID картинок мебели и цвету
   * @param imagesId ID картинок мебели
   * @param color Цвет мебели
   * @returns Observable с главным изображением
   */
  GETmainImage(furnitureCardId: string, color: string) {
    return `${this.baseServiceUrl}main?furnitureCardId=${furnitureCardId}&color=${color}`;
  }
}
