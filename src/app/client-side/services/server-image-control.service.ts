import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { baseUrl } from '.';
@Injectable({
  providedIn: 'root'
})
export class ServerImageControlService {
  constructor(
    private httpModule: HttpClient
  ) { }


  /**
   * Получение аватара пользователя
   * @param jwt JWT токен пользователя
   * @returns URL для получения аватара пользователя
   */
  GETuserAvatar(jwt: string) {
    return `${baseUrl}avatar?jwtToken=${jwt}`;
  }

  /**
   * Загрузка аватара пользователя
   * @param imageFile Файл изображения
   * @param jwt JWT токен пользователя
   * @returns Observable с результатом загрузки аватара
   */
  POSTloadUserAvatar(imageFile: Blob, jwt: string) {
    const formData = new FormData();
    formData.append('image', imageFile);
    const HTTP_PARAMS = new HttpParams().set('jwtToken', jwt);
    return this.httpModule.post(`${baseUrl}avatar/upload`, formData, { params: HTTP_PARAMS });
  }

  /**
   * Загрузка изображений проекта
   * @param imageFiles Файлы изображений
   * @param jwt JWT токен пользователя
   * @param furnitureCardId ID карточки мебели
   * @param color Цвет мебели
   * @returns Observable с результатом загрузки изображений
   */
  POSTloadProjectImages(imageFiles: Blob[], jwt: string, furnitureCardId: string, color: string,idMainImage:number) {
    const formData = new FormData();
    
    // Добавляем изображения
    console.log(imageFiles)
    imageFiles.forEach((file) => formData.append('images', file));
    
    // Добавляем дополнительные данные
    const HTTP_PARAMS = new HttpParams()
    .set('furnitureCardId', furnitureCardId)
    .set('color', color)
    .set('idMainImage',idMainImage)
    // Отправляем запрос с использованием FormData
    return this.httpModule.post(`${baseUrl}furniture/images/upload/images?jwtToken=${jwt}`, formData,{params:HTTP_PARAMS});
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
      .set('jwtToken', jwt)
      .set('furnitureCardId', furnitureCardId)
      .set('color', color);

    return this.httpModule.delete(`${baseUrl}furniture/images/delete/color`, { params: HTTP_PARAMS });
  }

  /**
   * Удаление проекта
   * @param jwt JWT токен пользователя
   * @param furnitureCardId ID карточки мебели
   * @returns Observable с результатом удаления проекта
   */
  DELETEproject(jwt: string, furnitureCardId: string) {
    const HTTP_PARAMS = new HttpParams()
      .set('jwtToken', jwt)
      .set('furnitureCardId', furnitureCardId);

    return this.httpModule.delete(`${baseUrl}furniture/images/delete/project`, { params: HTTP_PARAMS });
  }
    /**
   * Получение всех изображений проекта по ID карточки мебели и цвету
   * @param furnitureCardId ID карточки мебели
   * @param color Цвет мебели
   * @returns Observable с массивом всех изображений
   */
    async GETallProjectImages(furnitureCardId: string, color: string): Promise<any> {
      const HTTP_PARAMS = new HttpParams()
        .set('furnitureCardId', furnitureCardId)
        .set('color', color);
    
      try {
        const response = await this.httpModule.get(`${baseUrl}furniture/images/all`, { params: HTTP_PARAMS }).toPromise();
        return response;
      } catch (error) {
        console.error('Error fetching project images:', error);
        throw error; // Важно выбрасывать ошибку для обработки в вызывающем коде
      }
    }
  
    /**
     * Получение главного изображения цвета по ID картинок мебели и цвету
     * @param imagesId ID картинок мебели
     * @param color Цвет мебели
     * @returns Observable с главным изображением
     */
    GETmainImage(furnitureCardId: string, color: string) {
        return `${baseUrl}furniture/images/main?furnitureCardId=${furnitureCardId}&color=${color}`;
    }
    GETsimpleImage(filePath:string){
      return `${baseUrl}furniture/images/simple?filePath=${filePath}`;
    }
    
}
