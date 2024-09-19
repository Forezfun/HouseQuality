import { Injectable } from '@angular/core';
import { projectInformation } from './project.service';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { UserCookieService } from './user-cookie.service';
import { accountBaseInformation, userType } from './account.service';
@Injectable({
  providedIn: 'root'
})
export class ServerImageControlService {
  constructor(
    private httpModule: HttpClient
  ) { }
  private baseUrl = "http://localhost:8010/proxy/"
  GETuserAvatar(jwt: string) {
    return `${this.baseUrl}images/avatar?jwtToken=${jwt}`
  }
  POSTloadUserAvatar(imageFile: Blob, jwt: string) {
    const formData = new FormData();
    formData.append('image', imageFile);  // Добавляем файл изображения

    // JWT токен передаётся через заголовок Authorization
    const HTTP_PARAMS = new HttpParams()
    .set('jwtToken',jwt);

    // Выполняем POST-запрос для загрузки аватара
    return this.httpModule.post(`${this.baseUrl}images/upload/avatar`, formData, { params:HTTP_PARAMS });
  }
}
